# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## これは何か

スピードランイベント用配信オーバーレイのための **NodeCG バンドル** です。NodeCG はライブ制作用オーバーレイ（eスポーツ、配信など）のためのフレームワークで、3 つの異なるレイヤーを連携させます。

- **Extension（拡張機能）** — 共有状態（Replicant）を管理する Node.js のサーバーサイドロジック
- **Dashboard（ダッシュボード）** — オペレーター用のコントロールパネル（ブラウザ）
- **Graphics（グラフィックス）** — 放送用オーバーレイビュー（ブラウザ）

パッケージマネージャーは **pnpm** です。

## コマンド

```bash
pnpm dev          # すべてを並行起動: tsc watch、Vite 開発サーバー、NodeCG ランタイム
pnpm start        # NodeCG ランタイムのみを起動
pnpm build        # 本番ビルド（ブラウザは Vite、拡張機能は Rollup）
pnpm typecheck    # 拡張機能とブラウザの型チェック
pnpm lint         # ESLint
pnpm format       # src/ と schemas/ に対する Prettier（書き込み）
pnpm format:check # Prettier（チェックのみ）
pnpm check        # typecheck + lint + format:check + build — コミット前に実行
pnpm clean        # 生成ディレクトリ（dashboard/、graphics/、extension/、db/）とビルドキャッシュを削除
pnpm generate-schema-types  # NodeCG スキーマから TS 型を再生成
```

テストランナーはまだ組み込まれていません（`vitest` はインストール済みですが `test` スクリプトはありません）。

NodeCG は `http://localhost:9090` で動作し、Vite 開発サーバーはその隣でポート 8080 で動作します。

## アーキテクチャ

### 3 層構造の NodeCG

```
Extension (Node.js)  ←→  Replicants (WebSocket 同期)  ←→  Browser (Dashboard / Graphics)
```

- **`src/extension/`** — NodeCG が起動時に呼び出すコード（`index.ts` がエントリーポイント）。Replicant（すべてのブラウザクライアントにリアルタイム同期される共有状態オブジェクト）を作成・管理します。
- **`src/browser/dashboard/views/*.tsx`** — 各 `.tsx` ファイルが個別のダッシュボードパネル HTML ページになります。
- **`src/browser/graphics/views/*.tsx`** — 各 `.tsx` ファイルが個別のグラフィックスオーバーレイ HTML ページになります。
- **`src/browser/graphics/`** — 共有グラフィックス部品が `views/` と並んで配置されます（例: 1920×1080 の絶対配置オーバーレイコンテナである `BaseLayout.tsx`）。再利用可能な部品は `components/` に置きます。
- **`src/browser/render.ts`** — React コンポーネントを `#root` にマウントします。すべてのビューのエントリーポイントがこれを呼び出します。
- **`src/browser/hooks.ts`** — `useReplicant` をラップするカスタムフック。クロスバンドル（speedcontrol）の Replicant には、`useReplicant` を直接呼ばずにこれらを使用してください。
- **`src/types/speedcontrol/`** — nodecg-speedcontrol の Replicant 用に手動でメンテナンスされている TypeScript 型。speedcontrol の型が変わった場合はこれらを更新してください。

### Replicant

Replicant は NodeCG のリアルタイム共有状態で、拡張機能とすべてのブラウザクライアントの間で WebSocket 経由で同期されます。ブラウザでは `@nodecg/react-hooks` の `useReplicant` で読み書きします。`src/browser/hooks.ts` のラッパーフックを経由してください。

**イミュータブル更新原則:** Replicant の値を更新する際は、既存のオブジェクトや配列を直接変更（ミューテーション）せず、常に新しいオブジェクトを生成して `.value` に代入すること。NodeCG は代入を検知して変更通知を発火するため、参照経由の直接変更では同期が保証されない。配列内の要素を更新する場合は `map` で新しい配列を生成する。

### アセット

オペレーターがアップロード可能なアセットカテゴリは、`package.json` の `nodecg.assetCategories` で宣言されています。拡張機能は対応する `assets:*` Replicant を監視してアップロードファイルを管理します。

### 依存バンドル

`bundles/` には兄弟の NodeCG バンドルが git サブモジュールとして含まれています。NodeCG は起動時に `bundles/` 内のすべてを自動的に読み込みます。

- **`bundles/nodecg-speedcontrol`** — 走行スケジュール管理。`src/browser/hooks.ts` を介して利用される `runDataArray`、`runDataActiveRun`、`timer` Replicant の供給元です。
- **`bundles/nodecg-obs-browser`** — OBS 連携バンドル。

### ビルドパイプライン

カスタム Vite プラグイン（`vite/vite-plugin-nodecg.mts`）がビルドを統括します。

- glob でグラフィックス／ダッシュボードのビューを検出
- `vite/template.html` から HTML ファイルを生成
- Rollup で拡張機能をビルド（esbuild + node-externals プラグインを使用）
- 開発時には HTML テンプレートに HMR スクリプトを注入

バンドル名は `plumber-event-layouts` です（`vite.config.mts` で定義）。

## ワークフロー

### パネルやオーバーレイの追加

- `src/browser/dashboard/views/`（ダッシュボードパネル）または `src/browser/graphics/views/`（グラフィックスオーバーレイ）に `.tsx` ファイルを置きます。
- ビルドが glob で自動検出するため、コードへの登録は不要です。
- ダッシュボードパネルは `package.json` の `nodecg.dashboardPanels` / `nodecg.graphics` にも登録する必要があります。

### スキーマ付き Replicant の追加

その JSON Schema を定義し、`pnpm generate-schema-types` を実行して TypeScript 型を `src/nodecg/generated` に再生成します。

## コードスタイル

Prettier は、タブ（幅 2）、JSX のシングルクォート、末尾カンマ、80 文字幅、インポートの自動整理で設定されています。コミット前に `pnpm check`（少なくとも `pnpm format`）を実行してください。

## 作業ルール

- `pnpm` を使用すること。`npm` や `yarn` は使用しないこと。
- 新しいパターンを導入する前に既存の実装を確認すること。
- 近隣のファイルで使われている規約に従うこと。
- 要求されたタスクに必要な最小限の変更にとどめること。
- 無関係なファイルを変更しないこと。
- タスクに必要でない限り、依存関係を追加・更新しないこと。
- 型エラーを抑制するためだけに `any`、型アサーション、`@ts-ignore` を使用しないこと。
- `src/nodecg/generated/` 配下のファイルを手動で編集しないこと。
- JSON Schema を変更したら `pnpm generate-schema-types` を実行すること。
- 明示的に要求されない限り、グラフィックの寸法や配置規約を変更しないこと。
- graphicsの開発は`GRAPHICS.md`および`docs/graphics/`内ドキュメントに準拠すること。
- Replicant の値がオブジェクトや配列の場合、直接変更せず新しいオブジェクトを生成して代入すること（イミュータブル更新原則）。
- 初回接続時に Replicant の値が利用できない場合を考慮すること。
- 明示的に要求されない限り、コミット、プッシュ、リセット、クリーン、変更の破棄を行わないこと。

実装前:

1. 関連ファイルと既存パターンを確認する。
2. 変更が必要なファイルを特定する。
3. リポジトリから検証できない前提を書き留める。

実装後:

1. 変更したファイルに Prettier を実行する。
2. `pnpm check` を実行する。
3. 変更したファイルを報告する。
4. 失敗した、または実行できなかったチェックを報告する。
