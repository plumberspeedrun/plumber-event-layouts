import {
	sampleActiveRunId,
	sampleAdImageAsset,
	sampleAdImageOverlay,
	sampleBackgroundAsset,
	sampleCameraVisible,
	sampleLogoAsset,
	sampleRunDataArray,
	sampleSm64,
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
		await nodecg.setReplicant("cameraVisible", sampleCameraVisible);
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
		await nodecg.setReplicant("cameraVisible", sampleCameraVisible);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run のゲーム名が描画されていることを確認。
		await expect(page.getByText("Super Mario World")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("16_9-1.png");
	});

	test("SM64 レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("SM64.html");

		// 背景・ロゴ・カメラ・run データ、アクティブ run を注入してレイアウトを描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("sm64", sampleSm64);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run のゲーム名と解説者名が描画されていることを確認。
		await expect(page.getByText("Super Mario World")).toBeVisible();
		await expect(page.getByText("Commentator One")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("SM64.png");
	});

	test("SM64 レイアウト（左右カメラOFF）", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("SM64.html");

		// 左右のカメラを個別に OFF にして、カメラオフアイコンが左右に表示されることを確認する。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("sm64", {
			...sampleSm64,
			cameraVisible: {left: false, right: false},
		});
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		await expect(page.getByText("Super Mario World")).toBeVisible();
		await expect(page.getByText("Commentator One")).toBeVisible();
		await waitForImages(page);

		await expect(page).toHaveScreenshot("SM64-camera-off.png");
	});

	test("ScheduleList レイアウト", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("setup.html");

		// run データ、アクティブ run、背景・カメラ・ロゴアセットを注入して描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("cameraVisible", sampleCameraVisible);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);

		// アクティブ run (run-1) 以降の「今後走行」のみが表示される。
		await expect(page.getByText("Super Metroid")).toBeVisible();
		await expect(page.getByText("Super Mario World")).toBeHidden();

		// scheduledStartTime の表示はロケール依存のため、game 名のみ検証する。
		await waitForImages(page);

		await expect(page).toHaveScreenshot("schedule-list.png");
	});

	test("16_9-4 レイアウト（宣伝画像オーバーレイ表示）", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("16_9-4.html");

		// 背景・ロゴ・カメラ・run データ、アクティブ run、宣伝画像を注入して描画させる。
		await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
		await nodecg.setReplicant("assets:logo", sampleLogoAsset);
		await nodecg.setReplicant("assets:adImage", sampleAdImageAsset);
		await nodecg.setReplicant("cameraVisible", sampleCameraVisible);
		await nodecg.setReplicant("runDataArray", sampleRunDataArray);
		await nodecg.setReplicant("activeRunId", sampleActiveRunId);
		await nodecg.setReplicant("adImage", sampleAdImageOverlay);

		// アクティブ run のゲーム名が描画されていることを確認。
		await expect(page.getByText("Super Mario World")).toBeVisible();

		// 宣伝画像オーバーレイが最前面（position: fixed / z-index）で、
		// フッターを除いた領域の上下左右から 10px ずつ内側のボックスに、
		// 縦横比を保って収める表示（object-fit: contain）になるのを待つ。
		const overlay = page.getByTestId("ad-image-overlay");
		await expect(overlay).toBeVisible();
		await expect(overlay).toHaveCSS("position", "fixed");
		await expect(overlay).toHaveCSS("z-index", "1000");
		await expect(overlay).toHaveCSS("object-fit", "contain");
		await expect(overlay).toHaveCSS("top", "10px");
		await expect(overlay).toHaveCSS("left", "10px");
		await expect(overlay).toHaveCSS("width", "1900px");
		await expect(overlay).toHaveCSS("height", "1010px");

		// フッターはオーバーレイより前面に表示される（フッター領域の最前面要素が
		// オーバーレイではないこと）を確認する。
		const overlayOnTopOfFooter = await page.evaluate(() => {
			const el = document.elementFromPoint(960, 1055);
			return el?.closest('[data-testid="ad-image-overlay"]') != null;
		});
		expect(overlayOnTopOfFooter).toBe(false);

		await waitForImages(page);

		await expect(page).toHaveScreenshot("16_9-4-ad-overlay.png");
	});

	// 16_9-4 以外の全レイアウトにも宣伝画像オーバーレイが表示される。
	for (const file of [
		"4_3-1.html",
		"4_3-2.html",
		"4_3-4.html",
		"SM64.html",
		"16_9-1.html",
		"16_9-2.html",
		"nsmb_4_3.html",
		"nsmb_16_9.html",
		"nsmb_ds.html",
		"nsmb_3ds.html",
		"setup.html",
	]) {
		test(`${file} レイアウト（宣伝画像オーバーレイ表示）`, async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoGraphics(file);

			// 背景・ロゴ・カメラ・run データ、アクティブ run、宣伝画像を注入して描画させる。
			await nodecg.setReplicant("assets:background", sampleBackgroundAsset);
			await nodecg.setReplicant("assets:logo", sampleLogoAsset);
			await nodecg.setReplicant("assets:adImage", sampleAdImageAsset);
			await nodecg.setReplicant("cameraVisible", sampleCameraVisible);
			await nodecg.setReplicant("runDataArray", sampleRunDataArray);
			await nodecg.setReplicant("activeRunId", sampleActiveRunId);
			await nodecg.setReplicant("adImage", sampleAdImageOverlay);

			// 宣伝画像オーバーレイが最前面（position: fixed / z-index）で表示される。
			const overlay = page.getByTestId("ad-image-overlay");
			await expect(overlay).toBeVisible();
			await expect(overlay).toHaveCSS("position", "fixed");
			await expect(overlay).toHaveCSS("z-index", "1000");
		});
	}
});
