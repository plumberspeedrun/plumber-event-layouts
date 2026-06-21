import type {Page} from "@playwright/test";
import {
	sampleActiveRunId,
	sampleRunDataArray,
	sampleSheetCommentators,
	sampleSheetRunners,
	sampleSpreadsheetStatus,
	sampleTimer,
} from "./data";
import {expect, test} from "./fixtures";

const setAndWaitForChange = async <T>(
	page: Page,
	name: string,
	value: T,
): Promise<T> => {
	const result = await page.evaluate(
		({name, value}) =>
			new Promise<unknown>((resolve) => {
				const rep = nodecg.Replicant(name);
				const doSet = () => {
					const serialized = JSON.stringify(value);
					const handler = (newVal: unknown) => {
						if (JSON.stringify(newVal) === serialized) {
							rep.removeListener("change", handler);
							resolve(newVal);
						}
					};
					rep.on("change", handler);
					rep.value = value;
				};
				if (rep.status === "declared") doSet();
				else rep.once("declared", doSet);
			}),
		{name, value},
	);
	return result as T;
};

test.describe("schedule replicants", () => {
	test("runDataArray Replicant に値を注入して読み戻せる", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(
			page,
			"runDataArray",
			sampleRunDataArray,
		);
		expect(value).toEqual(sampleRunDataArray);
	});

	test("activeRunId Replicant に値を注入して読み戻せる", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(
			page,
			"activeRunId",
			sampleActiveRunId,
		);
		expect(value).toEqual(sampleActiveRunId);
	});

	test("timer Replicant に値を注入して読み戻せる", async ({page, nodecg}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(page, "timer", sampleTimer);
		expect(value).toEqual(sampleTimer);
	});
});

test.describe("spreadsheet replicants", () => {
	test("sheetRunners Replicant に値を注入して読み戻せる", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(
			page,
			"sheetRunners",
			sampleSheetRunners,
		);
		expect(value).toEqual(sampleSheetRunners);
	});

	test("sheetCommentators Replicant に値を注入して読み戻せる", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(
			page,
			"sheetCommentators",
			sampleSheetCommentators,
		);
		expect(value).toEqual(sampleSheetCommentators);
	});

	test("spreadsheetStatus Replicant に値を注入して読み戻せる", async ({
		page,
		nodecg,
	}) => {
		await nodecg.gotoGraphics("example.html");
		const value = await setAndWaitForChange(
			page,
			"spreadsheetStatus",
			sampleSpreadsheetStatus,
		);
		expect(value).toEqual(sampleSpreadsheetStatus);
	});
});
