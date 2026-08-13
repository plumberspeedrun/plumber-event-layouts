# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:24-bookworm AS build
WORKDIR /app

# pnpm のバージョンをローカル開発環境と一致させる
RUN npm install -g pnpm@10.27.0

# 依存パッケージのインストール（キャッシュ効率のため package.json / lock を先にコピー）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ソースをコピーして本番ビルド（dashboard/・graphics/・extension/・shared/dist を生成）
COPY . .
RUN pnpm build

# ---- Runtime stage ----
FROM node:24-bookworm AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g pnpm@10.27.0

# 本番依存のみインストール（nodecg 本体も含む）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ビルド成果物とバンドル本体をコピー
COPY --from=build /app/package.json ./
COPY --from=build /app/configschema.json ./
COPY --from=build /app/schemas ./schemas
COPY --from=build /app/dashboard ./dashboard
COPY --from=build /app/graphics ./graphics
COPY --from=build /app/extension ./extension
COPY --from=build /app/shared ./shared
COPY --from=build /app/bundles ./bundles

# 実行時データディレクトリ（cfg は bind mount、db / assets / logs は named volume で永続化）
RUN mkdir -p cfg db assets logs

EXPOSE 9090

CMD ["node_modules/.bin/nodecg", "start"]
