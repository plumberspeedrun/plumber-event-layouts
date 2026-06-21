import type {ActiveRunId} from "../src/nodecg/generated/activeRunId";
import type {RunDataArray} from "../src/nodecg/generated/runDataArray";
import type {SheetCommentators} from "../src/nodecg/generated/sheetCommentators";
import type {SheetRunners} from "../src/nodecg/generated/sheetRunners";
import type {SpreadsheetStatus} from "../src/nodecg/generated/spreadsheetStatus";
import type {Timer} from "../src/nodecg/generated/timer";
import type {Assets} from "../src/types/assets";

/**
 * テスト用のサンプルデータ。
 *
 * VRT を決定論的にするため、固定値・data URL を用いる。
 * `runDataArray` 等は本バンドル独自の Replicant として注入する。
 */

/**
 * 単色矩形の SVG data URL を生成する。
 * 外部リソースに依存せず、決定論的に描画できるプレースホルダ画像。
 */
const solidSvg = (width: number, height: number, fill: string) =>
	"data:image/svg+xml," +
	encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
			`<rect width='100%' height='100%' fill='${fill}'/></svg>`,
	);

export const sampleBackgroundAsset: Assets[] = [
	{
		base: "test-background",
		category: "background",
		ext: ".svg",
		name: "test-background",
		namespace: "plumber-event-layouts",
		url: solidSvg(1920, 1080, "#1b3a5c"),
	},
];

export const sampleLogoAsset: Assets[] = [
	{
		base: "test-logo",
		category: "logo",
		ext: ".svg",
		name: "test-logo",
		namespace: "plumber-event-layouts",
		url: solidSvg(500, 200, "#e0552b"),
	},
];

export const sampleTimer: Timer = {
	time: "00:12:34",
	state: "running",
	milliseconds: 754000,
	timestamp: 0,
};

export const sampleRunDataArray: RunDataArray = [
	{
		id: "run-1",
		game: "Super Mario World",
		system: "SNES",
		category: "Any%",
		estimate: "01:30:00",
		teams: [
			{
				id: "team-1",
				players: [
					{
						id: "player-1",
						teamId: "team-1",
						name: "Runner One",
						social: {twitch: "runner_one", twitter: "runner_one_x"},
					},
				],
			},
		],
		commentators: [
			{
				name: "Commentator One",
				social: {twitter: "comm_one", twitch: "comm_one_twitch"},
			},
			{
				name: "Commentator Two",
				pronouns: "they/them",
			},
		],
	},
	{
		id: "run-2",
		game: "Super Metroid",
		system: "SNES",
		category: "100%",
		estimate: "01:45:00",
		teams: [
			{
				id: "team-2",
				players: [
					{
						id: "player-2",
						teamId: "team-2",
						name: "Runner Two",
						social: {twitch: "runner_two"},
					},
				],
			},
		],
	},
];

export const sampleActiveRunId: ActiveRunId = "run-1";

export const sampleSheetRunners: SheetRunners = [
	{
		name: "Runner One",
		social: {twitch: "runner_one", twitter: "runner_one_x"},
	},
	{name: "Runner Two", social: {twitch: "runner_two"}},
];

export const sampleSheetCommentators: SheetCommentators = [
	{
		game: "Super Mario World",
		name: "Commentator One",
		social: {twitter: "comm_one", twitch: "comm_one_twitch"},
	},
	{game: "Super Mario World", name: "Commentator Two", pronouns: "they/them"},
];

export const sampleSpreadsheetStatus: SpreadsheetStatus = {
	enabled: true,
	lastSynced: "2026-06-21T00:00:00.000Z",
};
