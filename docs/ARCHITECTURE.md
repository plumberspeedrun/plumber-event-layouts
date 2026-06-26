# アーキテクチャ

## NodeCG

```
Extension (Node.js)  ←→  Replicants (WebSocket 同期)  ←→  Browser (Dashboard / Graphics)
```

- **`src/extension/`** — NodeCG が起動時に呼び出すコード（`index.ts` がエントリーポイント）。Replicant（すべてのブラウザクライアントにリアルタイム同期される共有状態オブジェクト）を作成・管理します。
- **`src/browser/dashboard/views/*.tsx`** — 各 `.tsx` ファイルが個別のダッシュボードパネル HTML ページになります。
- **`src/browser/graphics/views/*.tsx`** — 各 `.tsx` ファイルが個別のグラフィックスオーバーレイ HTML ページになります。
- **`src/browser/graphics/`** — 共有グラフィックス部品が `views/` と並んで配置されます（例: 1920×1080 の絶対配置オーバーレイコンテナである `BaseLayout.tsx`）。再利用可能な部品は `components/` に置きます。
- **`src/browser/render.ts`** — React コンポーネントを `#root` にマウントします。すべてのビューのエントリーポイントがこれを呼び出します。
- **`src/browser/hooks.ts`** — `useReplicant` をラップするカスタムフック。Replicant には `useReplicant` を直接呼ばず、これらのラッパーを使用してください。
- **`src/types/schedule.d.ts`** — `runDataArray` スキーマから派生するユーティリティ型（`RunData`、`RunDataTeam` 等）の再エクスポート。

### Replicant

Replicant は NodeCG のリアルタイム共有状態で、拡張機能とすべてのブラウザクライアントの間で WebSocket 経由で同期されます。ブラウザでは `@nodecg/react-hooks` の `useReplicant` で読み書きします。`src/browser/hooks.ts` のラッパーフックを経由してください。

#### 注意点

- **イミュータブル更新原則:** Replicant の値を更新する際は、既存のオブジェクトや配列を直接変更（ミューテーション）せず、常に新しいオブジェクトを生成して `.value` に代入すること。
- 初回接続時に Replicant の値が利用できない場合を考慮すること。

### アセット

ユーザーがアップロード可能なアセットカテゴリは、`package.json` の `nodecg.assetCategories` で宣言されています。拡張機能は対応する `assets:*` Replicant を監視してアップロードファイルを管理します。

### 依存バンドル

`bundles/` には兄弟の NodeCG バンドルが git サブモジュールとして含まれています。NodeCG は起動時に `bundles/` 内のすべてを自動的に読み込みます。

- **`bundles/nodecg-obs-browser`** — OBS 連携バンドル。

### ビルドパイプライン

カスタム Vite プラグイン（`vite/vite-plugin-nodecg.mts`）がビルドを統括します。

- glob でグラフィックス／ダッシュボードのビューを検出
- `vite/template.html` から HTML ファイルを生成
- Rollup で拡張機能をビルド（esbuild + node-externals プラグインを使用）
- 開発時には HTML テンプレートに HMR スクリプトを注入

バンドル名は `plumber-event-layouts` である。`vite.config.mts` で定義する。

### パネルやオーバーレイの追加

- `src/browser/dashboard/views/`（ダッシュボードパネル）または `src/browser/graphics/views/`（グラフィックスオーバーレイ）に `.tsx` ファイルを配置する。
- ダッシュボードパネルは `package.json` の `nodecg.dashboardPanels`、あるいは`nodecg.graphics` に登録する。

### スキーマ付き Replicant の追加

Replicantのデータ構造をJSON Schemaで定義し、`pnpm generate-schema-types` を実行して型定義を`src/nodecg/generated`配下に生成する。

