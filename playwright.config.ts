import {defineConfig, devices} from "@playwright/test";

/**
 * Playwright によるグラフィックスの E2E / ビジュアルリグレッションテスト構成。
 *
 * グラフィックスは Replicant（WebSocket 同期）に依存するため、NodeCG ランタイムを
 * 起動した状態でテストする必要があります。`webServer` で NodeCG を立ち上げ、
 * `baseURL` 配下の `/bundles/<bundleName>/graphics/*.html` にアクセスします。
 *
 * グラフィックスページの URL 生成や Replicant への値注入は `e2e/fixtures.ts` を
 * 参照してください。
 */

const PORT = 9090;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./e2e",
	/* グラフィックスは 1920x1080 の固定レイアウト。 */
	use: {
		baseURL,
		viewport: {width: 1920, height: 1080},
		/* スクリーンショットを安定させるためスケールを固定。 */
		deviceScaleFactor: 1,
		trace: "on-first-retry",
	},
	/* ビジュアルリグレッションの既定設定。 */
	expect: {
		toHaveScreenshot: {
			/* フォントのアンチエイリアス等による微差を許容する。 */
			maxDiffPixelRatio: 0.01,
			/* アニメーションを無効化して描画を安定させる。 */
			animations: "disabled",
		},
	},
	fullyParallel: true,
	forbidOnly: !!process.env["CI"],
	retries: process.env["CI"] ? 2 : 0,
	workers: process.env["CI"] ? 1 : undefined,
	reporter: "html",
	projects: [
		{
			name: "chromium",
			use: {...devices["Desktop Chrome"]},
		},
	],
	/* テスト実行前に NodeCG をビルドして起動する。既存の `pnpm dev` 等が
	   起動済みの場合はそれを再利用する（CI ではしない）。 */
	webServer: {
		command: "pnpm build && pnpm start",
		url: baseURL,
		reuseExistingServer: !process.env["CI"],
		timeout: 180_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
