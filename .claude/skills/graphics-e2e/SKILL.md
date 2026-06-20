---
name: graphics-e2e
description: >-
  Playwright によるグラフィックスの E2E / ビジュアルリグレッション（VRT）テストを
  扱うためのスキル。NodeCG グラフィックスのテスト追加・修正、Replicant への
  テストデータ注入、スクリーンショット基準画像の作成・更新、テストの実行や
  デバッグを行うときに使用する。「e2e テストを追加」「グラフィックスのテスト」
  「ビジュアルリグレッション」「スクショ比較」「Replicant にテストデータを流す」
  「snapshot を更新」などの依頼で発動する。
---

# Graphics E2E / Visual Regression (Playwright)

このリポジトリの NodeCG グラフィックスを Playwright でテストするための手順とパターン。

## 前提アーキテクチャ

グラフィックスは `useReplicant`（= グローバルの `nodecg.Replicant`）で共有状態を購読する。
そのため **テストは NodeCG ランタイム（`http://localhost:9090`）が起動した状態で**
実行する必要がある。Playwright の `webServer` が `pnpm build && pnpm start` で自動起動し、
`pnpm dev` 等が起動済みならそれを再利用する（CI 以外）。

グラフィックスの URL: `/bundles/plumber-event-layouts/graphics/<file>.html`

## ディレクトリ構成

```
playwright.config.ts                 # 設定（baseURL, viewport 1920x1080, VRT 既定値, webServer）
e2e/
  tsconfig.json                      # e2e 専用（DOM lib + nodecg/types/augment-window）
  fixtures.ts                        # test/expect/graphicsUrl と nodecg フィクスチャ
  data.ts                            # 型付きサンプルデータ
  *.spec.ts                          # テスト本体
  *.spec.ts-snapshots/               # 基準画像（OS/ブラウザ別、git コミット対象）
```

## 鉄則

- テストファイルは必ず `./fixtures` から `test` / `expect` を import する（`@playwright/test` から直接 import しない）。`nodecg` フィクスチャが使えなくなる。
- 値が来る前のフォールバック表示を考慮し、`expect(...).toBeVisible()` 等で**描画完了を待ってから**スクショを撮る（時間待ちに依存しない）。
- `any` / 型アサーション / `@ts-ignore` で型エラーを抑制しない。`nodecg` グローバルは `augment-window` で型付け済み。
- 基準画像（`*-snapshots/`）はコミットする。`test-results/` 等の生成物は `.gitignore` 済み。
- 寸法・配置規約（1920x1080 等）は明示要求がない限り変えない。

## よく使うパターン

### グラフィックスを開く

```ts
import {expect, test} from "./fixtures";

test("...", async ({page, nodecg}) => {
  await nodecg.gotoGraphics("SmwRace.html"); // API とフォントの準備完了まで待つ
  await expect(page.locator("#root")).not.toBeEmpty();
});
```

### Replicant にテストデータを注入する

`setReplicant` は値を流し込み、**テスト終了時に元の値へ自動復元**する（稼働中インスタンスを汚染しない）。

```ts
import {sampleBackgroundAsset, sampleTimer} from "./data";

// このバンドルの Replicant（assets:* など）
await nodecg.setReplicant("assets:background", sampleBackgroundAsset);

// speedcontrol など別バンドルの Replicant は bundle を指定
await nodecg.setReplicant("timer", sampleTimer, {bundle: "nodecg-speedcontrol"});
await nodecg.setReplicant("runDataArray", sampleRunDataArray, {
  bundle: "nodecg-speedcontrol",
});
```

speedcontrol の Replicant 名: `runDataArray` / `runDataActiveRun` / `timer`（すべて bundle `nodecg-speedcontrol`）。

### ビジュアルリグレッション（VRT）

```ts
await nodecg.gotoGraphics("SmwRace.html");
await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
await nodecg.setReplicant("assets:logo", sampleLogoAsset);
await expect(page.getByText("hi")).toBeVisible(); // 描画完了を待つ
// すべての <img> 読込待ち（必要に応じて）
await page.waitForFunction(() =>
  Array.from(document.images).every((img) => img.complete),
);
await expect(page).toHaveScreenshot("smw-race.png");
```

決定論性のため: 外部リソースに依存しない data URL（`e2e/data.ts` の `solidSvg`）を使う、フォント/画像の読込を待つ、`animations: "disabled"` と `deviceScaleFactor: 1`（`playwright.config.ts` で既定設定済み）。

### テストデータを増やす

`e2e/data.ts` に型付きで追加する（型は `../src/types/speedcontrol` と `../src/types/assets` から import）。画像は `solidSvg(w, h, fill)` で外部依存なしに生成できる。

## コマンド

```bash
pnpm test:e2e          # 実行（基準画像と比較）
pnpm test:e2e:update   # 見た目を意図的に変えた / 新規 VRT 時に基準画像を更新
pnpm test:e2e:ui       # UI モードでデバッグ
pnpm exec playwright test <file|grep>   # 個別実行
pnpm exec playwright show-report        # 直近レポート閲覧
pnpm exec tsc -p e2e/tsconfig.json --noEmit   # e2e の型チェック
```

## 作業後チェック

1. 変更した e2e ファイルに `pnpm prettier --write` を実行。
2. `pnpm exec tsc -p e2e/tsconfig.json --noEmit` で型チェック。
3. `pnpm test:e2e` を実行し、全テスト通過を確認。
4. 新規／更新した基準画像（`*-snapshots/`）が妥当か目視確認してから報告する。

## トラブルシュート

- **`nodecg is not defined` / Replicant が反映されない**: ページ遷移に `nodecg.gotoGraphics()` を使っているか確認（API の準備完了待ちが必要）。
- **VRT が不安定 / 微差で落ちる**: フォント・画像の読込待ちが入っているか、`animations: "disabled"` が効いているか確認。閾値は `playwright.config.ts` の `maxDiffPixelRatio` で調整。
- **基準画像が OS 差で落ちる**: 基準画像は `*-<project>-<platform>.png` と OS 別に保存される。生成した OS と同一環境（または CI）で比較すること。
- **`window`/`document` の型エラー**: e2e ファイルが `e2e/tsconfig.json`（DOM lib 入り）配下にあるか確認。
