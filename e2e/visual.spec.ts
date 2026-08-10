import {
	sampleActiveRunId,
	sampleBackgroundAsset,
	sampleCameraFeeds,
	sampleLogoAsset,
	sampleRunDataArray,
} from "./data";
import {expect, test} from "./fixtures";

/**
 * グラフィックスのビジュアルリグレッションテスト。
 *
 * Replicant にテストデータを流し込んで描画を決定論的にしたうえで、
 * `toHaveScreenshot()` で基準画像と比較する。
 *
 * 初回（または意図的な見た目変更時）は基準画像を更新する:
 *   pnpm test:e2e:update
 */

/** すべての <img> が読み込み完了するまで待つ（スクショの安定化）。 */
const waitForImages = async (page: import("@playwright/test").Page) => {
	await page.waitForFunction(() =>
		Array.from(document.images).every((img) => img.complete),
	);
};

test.describe("visual regression", () => {
	test("4_3-1 レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("4_3-1.html");

		// 背景・ロゴ・カメラ・run データ、アクティブ run を注入してレイアウトを描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("cameraFeeds", sampleCameraFeeds);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run のゲーム名が描画されていることを確認。
		await expect(page.getByText("Super Mario World")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("4_3-1.png");
	});

	test("16_9-1 レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("16_9-1.html");

		// 背景・ロゴ・カメラ・run データ、アクティブ run を注入してレイアウトを描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("cameraFeeds", sampleCameraFeeds);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run のゲーム名が描画されていることを確認。
		await expect(page.getByText("Super Mario World")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("16_9-1.png");
	});

	test("ScheduleList レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("setup.html");

		// run データ、アクティブ run、背景・カメラ・ロゴアセットを注入して描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("cameraFeeds", sampleCameraFeeds);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run (run-1) 以降の「今後走行」のみが表示される。
		await expect(page.getByText("Super Metroid")).toBeVisible();
		await expect(page.getByText("Super Mario World")).toBeHidden();

		// scheduledStartTime の表示はロケール依存のため、game 名のみ検証する。
		await waitForImages(page);

		await expect(page).toHaveScreenshot("schedule-list.png");
	});
});
