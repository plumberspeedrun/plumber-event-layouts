# TESTING

## テスト方針

本バンドルは Playwright による E2E / VRT（ビジュアルリグレッション）テストを運用する。方針は [Issue 12](https://github.com/plumberspeedrun/plumber-event-layouts/issues/12) の決定に拠る。

### 役割分担

| 対象 | 自動テストの役割 |
|------|------------------|
| **Dashboard / Extension** | E2E の主対象とする。オペレーター操作 → メッセージ送信 → Replicant の状態遷移に至る一連の振る舞いを検証する |
| **Graphics** | 日常の見た目調整は HMR とブラウザによる目視確認を主とする。自動テストは少数の代表レイアウトの VRT のみに限定し、想定外の見た目の崩れを検知する |

Graphics の見た目調整における目視確認の手順は [docs/GRAPHICS.md](GRAPHICS.md) の「Verification」を参照すること。

## E2E / VRT の実行

Playwright はテスト実行時に NodeCG を自動ビルド・起動する（`playwright.config.ts` の `webServer`）。`pnpm dev` などで起動済みの場合はこれを再利用する。

```bash
pnpm test:e2e          # E2E と VRT をすべて実行
pnpm test:e2e:ui       # Playwright UI モード（デバッグ用）
pnpm test:e2e:update   # VRT の基準画像を更新（見た目変更時のみ）
```

コミット前には `pnpm check` を実行すること。

## 構成

| ファイル | 役割 |
|----------|------|
| `e2e/fixtures.ts` | `gotoGraphics` / `gotoDashboard` / `setReplicant` / `readReplicant` / `sendMessage` を提供する。`setReplicant` で注入した値はテスト終了時に元の値へ自動復元される |
| `e2e/data.ts` | テスト用のサンプルデータ（Run・タイマー・カメラフィード・アセット等）を定義する |
| `e2e/dashboard.spec.ts` | Dashboard の E2E（タイマー操作・完走/棄権・NSMB の OBS シーン切替・スケジュール）を記述する |
| `e2e/visual.spec.ts` | Graphics の VRT（現在は「4_3-1」「16_9-1」「setup（ScheduleList）」の 3 レイアウト）を記述する |

### Replicant へのテストデータ注入

Graphics は `useReplicant` により Replicant を購読するため、`setReplicant` で注入した値をそのまま受けて描画する。VRT ではこれを利用して描画を決定論的にした後にスクリーンショットを撮影する。

## 直列実行について

テストは直列（`workers: 1`）で実行する。これは意図的な設定である。

Replicant は NodeCG サーバー上の共有状態であり、複数テストを並列実行するとテスト同士が書き込む
値（`activeRunId` / `runDataArray` など）で互いに干渉し、決定的に失敗する。CI と同一条件に統一する
ため、ローカルでも常に直列で実行する。

## VRT の基準画像

- 基準画像は OS 別・ブラウザ別で `e2e/visual.spec.ts-snapshots/` に保存される。
- 実装の内部的な変更では基準画像は更新しない。見た目を意図的に変更した場合のみ
  `pnpm test:e2e:update` で更新する。
- 更新前には差分を確認し、意図した見た目であることを確認すること。

## 対象外

- **Spreadsheet / Horaro API** への自動テストは行わない。外部 API に依存し、かつ
  Horaro のシート変更による副作用により非決定的になるためである。手動確認の対象とする。
- Graphics の VRT 代表ケース拡充（空データ・複数走者・長い名前・各画面比率）は
  別 Issue として管理する。