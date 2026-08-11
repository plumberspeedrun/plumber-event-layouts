import type {ActiveRunId} from "../src/nodecg/generated/activeRunId";
import type {AdImage} from "../src/nodecg/generated/adImage";
import type {CameraVisible} from "../src/nodecg/generated/cameraVisible";
import type {Nsmb} from "../src/nodecg/generated/nsmb";
import type {RunDataArray} from "../src/nodecg/generated/runDataArray";
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

/** 宣伝画像。16:9 とは異なる比率で、contain 表示の余白（透け）を検証できるようにする。 */
export const sampleAdImageAsset: Assets[] = [
	{
		base: "test-ad",
		category: "adImage",
		ext: ".svg",
		name: "test-ad",
		namespace: "plumber-event-layouts",
		url: solidSvg(900, 600, "#d4a017"),
	},
];

export const sampleAdImageOverlay: AdImage = {
	name: "test-ad",
	visible: true,
};

export const sampleTimer: Timer = {
	time: "00:12:34",
	state: "running",
	milliseconds: 754000,
	timestamp: 0,
	startedAt: 0,
};

export const sampleCameraVisible: CameraVisible = true;

export const sampleRunDataArray: RunDataArray = [
	{
		id: "run-1",
		game: "Super Mario World",
		system: "SNES",
		category: "Any%",
		estimate: "01:30:00",
		scheduledStartTime: "2026-06-22T10:00:00.000Z",
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
		scheduledStartTime: "2026-06-22T12:00:00.000Z",
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

/** タイマーの完走/棄権テスト用: 2チーム構成の走行。 */
export const sampleRunForTimer: RunDataArray = [
	{
		id: "timer-run",
		game: "Timer Test",
		system: "SNES",
		category: "Any%",
		teams: [
			{
				id: "team-a",
				players: [
					{
						id: "player-a",
						teamId: "team-a",
						name: "Runner A",
						social: {twitch: "runner_a"},
					},
				],
			},
			{
				id: "team-b",
				players: [
					{
						id: "player-b",
						teamId: "team-b",
						name: "Runner B",
						social: {twitch: "runner_b"},
					},
				],
			},
		],
	},
];

export const sampleActiveRunIdForTimer: ActiveRunId = "timer-run";

/** NSMBリレーのOBSシーン切替テスト用。obsSceneName は一部のリレーのみ設定する。 */
export const sampleNsmb: Nsmb = {
	activeIndex: 0,
	relayData: [
		{
			game: "New Super Mario Bros. Wii",
			category: "Any%",
			platform: "Wii",
			year: 2009,
			runner: {name: "Runner A"},
		},
		{
			game: "New Super Mario Bros. U",
			category: "Any%",
			platform: "Wii U",
			year: 2012,
			runner: {name: "Runner B"},
			obsSceneName: "NSMB Relay",
		},
		{
			game: "New Super Mario Bros. DS",
			category: "Warpless",
			platform: "DS",
			year: 2006,
			runner: {name: "Runner C"},
		},
	],
};

export const sampleSpreadsheetStatus: SpreadsheetStatus = {
	enabled: true,
	lastSynced: "2026-06-21T00:00:00.000Z",
};
