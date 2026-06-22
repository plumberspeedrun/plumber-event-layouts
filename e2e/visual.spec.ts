import {
	sampleActiveRunId,
	sampleBackgroundAsset,
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
	test("example レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("example.html");
		await expect(page.getByText("hi")).toBeVisible();

		await expect(page).toHaveScreenshot("example.png");
	});

	test("SmwRace レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("SmwRace.html");

		// 背景・ロゴアセットを注入してレイアウトを描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);

		// フォールバック文言ではなくレイアウトが表示されることを確認。
		await expect(page.getByText("hi")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("smw-race.png");
	});

	test("ScheduleList レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("ScheduleList.html");

		// run データとアクティブ run を注入してスケジュールを描画させる。
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// scheduledStartTime の表示はロケール依存のため、ゲーム名のみ検証する。
		await expect(page.getByText("Super Mario World")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("schedule-list.png");
	});
});
