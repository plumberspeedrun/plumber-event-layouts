# plumber-event-layouts

スピードラン配信イベント向けの NodeCG グラフィックスオーバーレイバンドルです。

## 概要

`plumber-event-layouts` は、[NodeCG](https://nodecg.dev/) フレームワーク上で動作する配信用グラフィックスバンドルです。スピードランイベントのライブ配信において、タイマー・スケジュール表示などのオーバーレイ画面と、オペレーター用のダッシュボードパネルを提供します。

[nodecg-speedcontrol](https://github.com/nicnacnic/nodecg-speedcontrol) と連携し、走者情報・タイマー・ゲームスケジュールをリアルタイムで画面に反映します。グラフィックスは 1920×1080 解像度で設計されており、OBS などの配信ソフトからブラウザソースとして取り込む形で利用します。

## 前提条件

- Node.js（最新の LTS 推奨）
- pnpm

## セットアップ

```bash
# 依存パッケージのインストール
pnpm install
```

## 起動方法

### 開発サーバー（ホットリロードあり）

```bash
pnpm run dev
```

以下の3プロセスが並列起動します：

| プロセス | 内容 |
|----------|------|
| `dev:tsc` | Extension の TypeScript をウォッチビルド |
| `dev:vite` | ブラウザ向け Vite 開発サーバー（HMR 対応） |
| `dev:nodecg` | NodeCG ランタイム |

NodeCG のデフォルトポートは `http://localhost:9090` です。

### プロダクションビルド

```bash
pnpm run build
```

### NodeCG の起動のみ

```bash
pnpm run start
```

### クリーンアップ

```bash
pnpm run clean
```

生成された `dashboard/`・`graphics/`・`extension/`・`db/` ディレクトリを削除します。

## 開発

### スキーマ型の再生成

NodeCG の Replicant スキーマから TypeScript 型定義を再生成します：

```bash
pnpm run generate-schema-types
```

### 新しいパネル・オーバーレイの追加

ファイルを追加するだけでビルドシステムが自動検出します。登録作業は不要です。

| 追加場所 | 用途 |
|----------|------|
| `src/browser/dashboard/views/*.tsx` | ダッシュボードパネル（オペレーター操作用） |
| `src/browser/graphics/views/*.tsx` | グラフィックスオーバーレイ（配信画面用） |

### コードスタイル

Prettier を使用しています（タブインデント、シングル JSX クォート、末尾カンマ、80 文字幅）。コミット前に実行してください：

```bash
pnpx prettier --write .
```

## アーキテクチャ

NodeCG の三層構造で動作します：

```
Extension (Node.js サーバー)
    ↕  Replicant（WebSocket リアルタイム同期）
ブラウザ（Dashboard / Graphics）
```

### ディレクトリ構成

```
src/
├── extension/
│   └── index.ts          # NodeCG 起動時に呼ばれるエントリポイント。Replicant を作成・管理する
├── browser/
│   ├── render.ts          # React コンポーネントを #root にマウントするユーティリティ
│   ├── hooks.ts           # nodecg-speedcontrol の Replicant を扱うカスタムフック群
│   ├── dashboard/
│   │   └── views/         # ダッシュボードパネル（各 .tsx が独立した HTML ページになる）
│   └── graphics/
│       ├── views/         # グラフィックスオーバーレイ（各 .tsx が独立した HTML ページになる）
│       ├── components/    # 表示用コンポーネント
│       │   └── ScheduleList.tsx # 走者・ゲーム一覧表示コンポーネント
│       └── BaseLayout.tsx # 1920×1080 のベースレイアウトコンポーネント
├── types/
│   └── speedcontrol/      # nodecg-speedcontrol の型定義
vite/
└── vite-plugin-nodecg.mts # カスタム Vite プラグイン（HTML 生成・Extension ビルドを統括）
bundles/                   # 依存する NodeCG バンドル（nodecg-speedcontrol, nodecg-obs-browser）
```

### Replicant と状態管理

Replicant は NodeCG が提供するリアルタイム共有状態オブジェクトです。Extension（サーバー）・ダッシュボード・グラフィックスの間で WebSocket を通じて自動同期されます。

ブラウザ側では `@nodecg/react-hooks` の `useReplicant` フックを使って値を購読・更新します：

```ts
// nodecg-speedcontrol のタイマーを購読する例
const [timer] = useReplicant<Timer>("timer", { bundle: "nodecg-speedcontrol" });
```

### 連携バンドル

| バンドル | 概要 |
|----------|------|
| `nodecg-speedcontrol` | 走者データ・タイマーなどのスピードラン管理機能を提供する |
| `nodecg-obs-browser` | OBS Studio のブラウザソース経由でダッシュボードからシーン切り替えを操作できる（`bundles/` に同梱） |

### ビルドパイプライン

カスタム Vite プラグイン（`vite/vite-plugin-nodecg.mts`）が以下を自動処理します：

1. `src/browser/graphics/views/**/*.tsx` と `src/browser/dashboard/views/**/*.tsx` を glob で検出
2. `vite/template.html` を元に各ビューの HTML ファイルを生成
3. Extension（`src/extension/index.ts`）を Rollup + esbuild で CommonJS ビルド
4. 開発時は HMR スクリプトを HTML に注入

## ライセンス

MIT
