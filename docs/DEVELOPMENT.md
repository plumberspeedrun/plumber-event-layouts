# DEVELOPMENT

## 開発ルール

- `pnpm` を使用すること。`npm` や `yarn` は使用しないこと。
- 新しいパターンを導入する前に既存の実装を確認すること。


## pnpmコマンド

```bash
pnpm dev          # すべてを並行起動: tsc watch、Vite 開発サーバー、NodeCG ランタイム
pnpm start        # NodeCG ランタイムのみを起動
pnpm build        # 本番ビルド（ブラウザは Vite、extensionは Rollup）
pnpm typecheck    # extensionとブラウザの型チェック
pnpm lint         # ESLint
pnpm format       # src/ と schemas/ に対する Prettier（書き込み）
pnpm format:check # Prettier（チェックのみ）
pnpm check        # typecheck + lint + format:check + build — コミット前に実行
pnpm clean        # 生成ディレクトリ（dashboard/、graphics/、extension/、db/）とビルドキャッシュを削除
pnpm generate-schema-types  # NodeCG スキーマから TS 型を再生成
```

## ポート

NodeCGサーバーは `http://localhost:9090` で動作し、Vite 開発サーバーはポート 8080 で動作します。

## コードスタイル

Prettier は、タブ（幅 2）、JSX のシングルクォート、末尾カンマ、80 文字幅、インポートの自動整理で設定されています。コミット前に `pnpm check`（少なくとも `pnpm format`）を実行してください。

