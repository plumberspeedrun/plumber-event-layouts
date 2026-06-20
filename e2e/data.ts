import type {Assets} from "../src/types/assets";
import type {
	RunDataActiveRun,
	RunDataArray,
	Timer,
} from "../src/types/speedcontrol";

/**
 * テスト用のサンプルデータ。
 *
 * VRT を決定論的にするため、固定値・data URL を用いる。
 * speedcontrol の Replicant（`runDataArray` 等）はバンドル名
 * `nodecg-speedcontrol` を指定して注入する。
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
	teamFinishTimes: {},
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
						teamID: "team-1",
						name: "Runner One",
						social: {twitch: "runner_one"},
						customData: {},
					},
				],
			},
		],
		customData: {},
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
						teamID: "team-2",
						name: "Runner Two",
						social: {twitch: "runner_two"},
						customData: {},
					},
				],
			},
		],
		customData: {},
	},
];

export const sampleActiveRun: RunDataActiveRun = sampleRunDataArray[0];
