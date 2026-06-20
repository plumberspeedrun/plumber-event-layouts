import {test as base, expect, type Page} from "@playwright/test";

/**
 * グラフィックスの E2E テスト用フィクスチャ。
 *
 * - `gotoGraphics`: グラフィックスページを開き、NodeCG クライアント API と
 *   Web フォントの読み込み完了を待つ。
 * - `setReplicant`: 稼働中の NodeCG に対し Replicant 値を流し込む。グラフィックスは
 *   `useReplicant`（= `nodecg.Replicant`）で購読しているため、注入した値が
 *   そのまま画面に反映される。元の値はテスト終了時に自動で復元する。
 */

const BUNDLE_NAME = "plumber-event-layouts";

/** グラフィックスビューの URL を生成するヘルパー。 */
export const graphicsUrl = (file: string) =>
	`/bundles/${BUNDLE_NAME}/graphics/${file}`;

export interface SetReplicantOptions {
	/** Replicant が属するバンドル名。省略時はこのバンドル。 */
	bundle?: string;
}

export interface NodeCGFixture {
	/** グラフィックスページを開き、API とフォントの準備完了を待つ。 */
	gotoGraphics: (file: string) => Promise<void>;
	/**
	 * Replicant に値を流し込む。
	 * 元の値は記録され、テスト終了時に自動で復元される。
	 */
	setReplicant: <T>(
		name: string,
		value: T,
		options?: SetReplicantOptions,
	) => Promise<void>;
}

/**
 * ブラウザコンテキストで Replicant 値を設定し、設定前の値を返す。
 * Replicant が宣言済みになるのを待ってから値を代入する。
 */
const applyReplicant = <T>(
	page: Page,
	name: string,
	bundle: string | undefined,
	value: T,
): Promise<unknown> =>
	page.evaluate(
		({name, bundle, value}) =>
			new Promise<unknown>((resolve) => {
				const replicant =
					typeof bundle === "string"
						? nodecg.Replicant(name, bundle)
						: nodecg.Replicant(name);
				const apply = () => {
					const previous = replicant.value;
					replicant.value = value;
					// change イベント → React 再描画の伝播を待つ。
					setTimeout(() => {
						resolve(previous);
					}, 0);
				};
				if (replicant.status === "declared") {
					apply();
				} else {
					replicant.once("declared", apply);
				}
			}),
		{name, bundle, value},
	);

export const test = base.extend<{nodecg: NodeCGFixture}>({
	nodecg: async ({page}, use) => {
		// (bundle, name) ごとに最初の注入前の値を記録しておく。
		const originals = new Map<string, {bundle?: string; value: unknown}>();

		const gotoGraphics: NodeCGFixture["gotoGraphics"] = async (file) => {
			await page.goto(graphicsUrl(file));
			// NodeCG クライアント API が利用可能になるまで待つ。
			await page.waitForFunction(() => typeof nodecg !== "undefined");
			// Web フォントの読み込みを待つ（VRT の安定化）。
			await page.evaluate(() => document.fonts.ready);
		};

		const setReplicant: NodeCGFixture["setReplicant"] = async (
			name,
			value,
			options,
		) => {
			const bundle = options?.bundle;
			const key = `${bundle ?? ""}:${name}`;
			const previous = await applyReplicant(page, name, bundle, value);
			if (!originals.has(key)) {
				originals.set(key, {bundle, value: previous});
			}
		};

		await use({gotoGraphics, setReplicant});

		// 注入した Replicant を元の値に復元する（稼働中インスタンスの汚染を防ぐ）。
		for (const [key, {bundle, value}] of originals) {
			const name = key.slice((bundle ?? "").length + 1);
			await applyReplicant(page, name, bundle, value).catch(() => {
				// ページが既に閉じている場合などは無視する。
			});
		}
	},
});

export {expect};
