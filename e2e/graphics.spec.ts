import {expect, test} from "./fixtures";

/**
 * グラフィックスオーバーレイのスモークテスト。
 *
 * NodeCG ランタイム経由でグラフィックスページを読み込み、React が #root に
 * マウントされてレイアウトが描画されることを確認します。
 */

test.describe("graphics", () => {
	test("example グラフィックスが描画される", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("example.html");

		// #root に React コンテンツがマウントされる。
		await expect(page.locator("#root")).not.toBeEmpty();
		// BaseLayout のフッターが表示される。
		await expect(page.getByText("hi")).toBeVisible();
	});

	test("SmwRace グラフィックスが描画される", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("SmwRace.html");

		await expect(page.locator("#root")).not.toBeEmpty();
	});
});
