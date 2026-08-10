# DEVELOPMENT

## 開発ルール

- `pnpm` を使用すること。`npm` や `yarn` は使用しないこと。
- 新しいパターンを導入する前に既存の実装を確認すること。


## pnpmコマンド

```bash
pnpm dev               # すべてを並行起動: tsc watch、Vite 開発サーバー、NodeCG ランタイム
pnpm start             # NodeCG ランタイムのみを起動
pnpm build             # 本番ビルド（ブラウザは Vite、extensionは Rollup）
pnpm typecheck         # extensionとブラウザの型チェック
pnpm lint              # Biome によるリント
pnpm format            # Biome によるフォーマット（書き込み）
pnpm format:check      # Biome によるフォーマット（チェックのみ）
pnpm fix               # Biome の安全な修正を自動適用（リント + フォーマット）
pnpm check             # typecheck + check:biome — コミット前に実行
pnpm test:e2e          # Playwright E2E / VRT（NodeCG を自動ビルド・起動）
pnpm test:e2e:ui       # Playwright UI モード
pnpm test:e2e:update   # VRT の基準画像を更新
pnpm clean             # 生成ディレクトリ（dashboard/、graphics/、extension/、db/）とビルドキャッシュを削除
pnpm generate-schema-types  # NodeCG スキーマから TS 型を再生成
```

テストの詳細な方針・構成は [docs/TESTING.md](TESTING.md) を参照してください。

## ポート

NodeCGサーバーは `http://localhost:9090` で動作し、Vite 開発サーバーはポート 8080 で動作します。

## コードスタイル

フォーマット・リントは Biome を使用しています（設定は `biome.json` を参照）。
フォーマットはタブインデント（幅 2）、80 文字幅、JSX はシングルクォート、文字列はダブルクォート、
末尾カンマで統一しています。コミット前に `pnpm check`（自動修正は `pnpm fix`）を実行してください。

