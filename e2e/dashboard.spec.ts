import type {ActiveRunId} from "../src/nodecg/generated/activeRunId";
import type {AdImage} from "../src/nodecg/generated/adImage";
import type {CameraVisible} from "../src/nodecg/generated/cameraVisible";
import type {Nsmb} from "../src/nodecg/generated/nsmb";
import type {RunDataArray} from "../src/nodecg/generated/runDataArray";
import type {Timer} from "../src/nodecg/generated/timer";
import {
	sampleActiveRunId,
	sampleActiveRunIdForTimer,
	sampleAdImageAsset,
	sampleAdImageOverlay,
	sampleNsmb,
	sampleRunDataArray,
	sampleRunForTimer,
} from "./data";
import {expect, test} from "./fixtures";

/**
 * Dashboard / Extension の E2E テスト。
 *
 * グラフィックスと違い、ここではボタン操作 → メッセージ送信 → Extension の
 * Replicant 更新までの一連の振る舞いを検証する。
 *
 * Replicant はサーバー側で共有されるため、このファイル内のテストは
 * 直列（serial）で実行し、タイマーの誤作動やデータの取り合いを防ぐ。
 */

/** window に収集した change-scene メッセージを読み取る。 */
const readChangeSceneMessages = (page: import("@playwright/test").Page) =>
	page.evaluate(
		() =>
			(window as unknown as {__changeSceneMessages?: unknown[]})
				.__changeSceneMessages ?? [],
	);

/** change-scene メッセージを収集するリスナーを登録する。 */
const collectChangeSceneMessages = (
	page: import("@playwright/test").Page,
): Promise<void> =>
	page.evaluate(() => {
		const win = window as unknown as {__changeSceneMessages?: unknown[]};
		win.__changeSceneMessages = [];
		nodecg.listenFor("change-scene", "nodecg-obs-browser", (data: unknown) => {
			win.__changeSceneMessages!.push(data);
		});
	});

test.describe("dashboard", () => {
	test.describe.configure({mode: "serial"});

	test.describe("タイマー操作", () => {
		test("開始 → 一時停止 → リセット で状態が遷移する", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");

			// 他テストの残存状態に依存しないよう、初期化してから開始する。
			await nodecg.sendMessage("timerReset");
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("stopped");

			await page.getByRole("button", {name: "開始/再開"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("running");
			await expect(page.getByRole("button", {name: "一時停止"})).toBeEnabled();

			// 走行中は時間が進む。
			const msRunning = (await nodecg.readReplicant<Timer>("timer"))
				?.milliseconds;
			await page.waitForTimeout(300);
			const msAfterWait = (await nodecg.readReplicant<Timer>("timer"))
				?.milliseconds;
			expect(msAfterWait).toBeGreaterThan(msRunning ?? 0);

			await page.getByRole("button", {name: "一時停止"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("paused");

			// 一時停止中は時間が進まない。
			const msPaused = (await nodecg.readReplicant<Timer>("timer"))
				?.milliseconds;
			await page.waitForTimeout(300);
			expect((await nodecg.readReplicant<Timer>("timer"))?.milliseconds).toBe(
				msPaused,
			);

			await page.getByRole("button", {name: "リセット"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("stopped");
			expect((await nodecg.readReplicant<Timer>("timer"))?.milliseconds).toBe(
				0,
			);
		});

		test("完走・棄権で結果が記録され、全チーム完了でタイマーが終了する", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("runDataArray", sampleRunForTimer);
			await nodecg.setReplicant("activeRunId", sampleActiveRunIdForTimer);
			await nodecg.sendMessage("timerReset");

			await expect(page.getByText("Timer Test")).toBeVisible();
			await expect(page.getByRole("button", {name: "完走"})).toHaveCount(2);
			await expect(page.getByRole("button", {name: "棄権"})).toHaveCount(2);

			await page.getByRole("button", {name: "開始/再開"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("running");

			// チームA を完走。1チーム分の結果が記録され、タイマーは走行中。
			await page.getByRole("button", {name: "完走"}).first().click();
			await expect
				.poll(async () => {
					const runs = await nodecg.readReplicant<RunDataArray>("runDataArray");
					return runs?.find((r) => r.id === "timer-run")?.result?.["team-a"]
						?.state;
				})
				.toBe("completed");
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("running");
			await expect(page.getByRole("button", {name: "完走"})).toHaveCount(1);

			// チームB を棄権。全チームに結果が付いたのでタイマーが終了する。
			await page.getByRole("button", {name: "棄権"}).first().click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("finished");
			await expect
				.poll(async () => {
					const runs = await nodecg.readReplicant<RunDataArray>("runDataArray");
					return runs?.find((r) => r.id === "timer-run")?.result?.["team-b"]
						?.state;
				})
				.toBe("forfeit");

			// UI に各チームの結果が表示される。
			await expect(page.getByText("完走")).toHaveCount(1);
			await expect(page.getByText("棄権")).toHaveCount(1);

			// リセットで結果がクリアされる。
			await page.getByRole("button", {name: "リセット"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("stopped");
			await expect
				.poll(async () => {
					const runs = await nodecg.readReplicant<RunDataArray>("runDataArray");
					return runs?.find((r) => r.id === "timer-run")?.result;
				})
				.toBeUndefined();
		});

		test("完走の取り消しで結果が消え、タイマーを再開できる", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("runDataArray", sampleRunForTimer);
			await nodecg.setReplicant("activeRunId", sampleActiveRunIdForTimer);
			await nodecg.sendMessage("timerReset");

			// 全チームを完走させ、タイマーを終了させる。
			await page.getByRole("button", {name: "開始/再開"}).click();
			await page.getByRole("button", {name: "完走"}).first().click();
			await expect(page.getByRole("button", {name: "完走"})).toHaveCount(1);
			await page.getByRole("button", {name: "完走"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("finished");
			await expect(page.getByRole("button", {name: "取り消し"})).toHaveCount(2);

			// 全チーム完走時の記録時刻を控えておく。
			const msFinished =
				(await nodecg.readReplicant<Timer>("timer"))?.milliseconds ?? 0;

			// 停止状態を挟んでから取り消すと、結果が消えて自動的に再開する。
			await page.waitForTimeout(500);
			await page.getByRole("button", {name: "取り消し"}).first().click();
			await expect
				.poll(async () => {
					const runs = await nodecg.readReplicant<RunDataArray>("runDataArray");
					return runs?.find((r) => r.id === "timer-run")?.result?.["team-a"];
				})
				.toBeUndefined();
			await expect(page.getByRole("button", {name: "取り消し"})).toHaveCount(1);
			await expect(page.getByRole("button", {name: "完走"})).toHaveCount(1);

			// 停止期間を含んだ時刻から自動再開する。
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("running");
			const msAfterCancel = (await nodecg.readReplicant<Timer>("timer"))
				?.milliseconds;
			expect(msAfterCancel).toBeGreaterThanOrEqual(msFinished + 400);

			// 再開後も時間が進む。
			await page.waitForTimeout(300);
			const msResumed = (await nodecg.readReplicant<Timer>("timer"))
				?.milliseconds;
			expect(msResumed).toBeGreaterThan(msAfterCancel ?? 0);
		});
	});

	test.describe("NSMBリレー", () => {
		test("アクティブリレー変更で OBS シーン切替メッセージが送信される", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("nsmb.html");
			await nodecg.setReplicant("nsmb", sampleNsmb);
			await expect(page.getByText("1 / 3")).toBeVisible();

			await collectChangeSceneMessages(page);

			await page.getByRole("button", {name: "次へ"}).click();
			await expect
				.poll(
					async () => (await nodecg.readReplicant<Nsmb>("nsmb"))?.activeIndex,
				)
				.toBe(1);
			await expect(page.getByText("2 / 3")).toBeVisible();

			// activeIndex 1 の relayData には obsSceneName "NSMB Relay" が設定されている。
			await expect
				.poll(() => readChangeSceneMessages(page))
				.toEqual(["NSMB Relay"]);
		});

		test("OBSシーン未設定のリレーでは切替メッセージを送信しない", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("nsmb.html");

			// activeIndex 1 のリレーに obsSceneName を持たないデータを注入する。
			const nsmbWithoutScene: Nsmb = {
				...sampleNsmb,
				relayData: (sampleNsmb.relayData ?? []).map((relay, i) =>
					i === 1
						? {
								game: relay.game,
								category: relay.category,
								platform: relay.platform,
								year: relay.year,
								runner: relay.runner,
							}
						: relay,
				),
			};
			await nodecg.setReplicant("nsmb", nsmbWithoutScene);
			await expect(page.getByText("1 / 3")).toBeVisible();

			await collectChangeSceneMessages(page);

			await page.getByRole("button", {name: "次へ"}).click();
			await expect
				.poll(
					async () => (await nodecg.readReplicant<Nsmb>("nsmb"))?.activeIndex,
				)
				.toBe(1);

			// 切替メッセージが送信されないことを確認する。
			await page.waitForTimeout(500);
			expect(await readChangeSceneMessages(page)).toEqual([]);
		});
	});

	test.describe("スケジュール", () => {
		test("カーソルで走行を選ぶとアクティブ走行が切り替わる", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("runDataArray", sampleRunDataArray);
			await nodecg.setReplicant("activeRunId", null);

			// アクティブ未設定時は先頭の走行がアクティブになる。
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-1");
			await expect(page.getByText("Super Mario World")).toBeVisible();

			// 次へ → カーソル移動と同時に run-2 がアクティブになる。
			await page.getByRole("button", {name: "次へ"}).click();
			await expect(page.getByText("Super Metroid")).toBeVisible();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-2");

			// 前へ → カーソル移動と同時に run-1 に戻る。
			await page.getByRole("button", {name: "前へ"}).click();
			await expect(page.getByText("Super Mario World")).toBeVisible();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-1");
		});

		test("走行を編集して保存すると runDataArray に反映される", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("runDataArray", sampleRunDataArray);
			await nodecg.setReplicant("activeRunId", sampleActiveRunId);
			await expect(page.getByText("Super Mario World")).toBeVisible();

			// 1番目の走行 (Super Mario World) の編集モーダルを開く。
			await page.getByRole("button", {name: "編集"}).first().click();
			const gameInput = page.getByPlaceholder("ゲーム名").last();
			await expect(gameInput).toHaveValue("Super Mario World");
			await gameInput.fill("Super Mario World 2");
			await page.getByRole("button", {name: "保存"}).click();

			// runDataArray の run-1 が更新され、UI にも反映される。
			await expect
				.poll(async () => {
					const runs = await nodecg.readReplicant<RunDataArray>("runDataArray");
					return runs?.find((r) => r.id === "run-1")?.game;
				})
				.toBe("Super Mario World 2");
			await expect(page.getByText("Super Mario World 2")).toBeVisible();
		});
	});

	test.describe("カメラ", () => {
		test("スイッチでカメラ表示を切り替えられる", async ({page, nodecg}) => {
			await nodecg.gotoDashboard("overview.html");
			// 前回実行時の永続化値に依存しないよう、OFF から開始する。
			await nodecg.setReplicant("cameraVisible", false);

			await expect(page.getByRole("heading", {name: "カメラ"})).toBeVisible();
			await expect(page.getByRole("switch")).not.toBeChecked();

			// ON にすると cameraVisible が true になる。
			await page.getByRole("switch").click();
			await expect
				.poll(async () => nodecg.readReplicant<CameraVisible>("cameraVisible"))
				.toBe(true);

			// OFF に戻すと false になる。
			await page.getByRole("switch").click();
			await expect
				.poll(async () => nodecg.readReplicant<CameraVisible>("cameraVisible"))
				.toBe(false);
		});
	});

	test.describe("宣伝画像", () => {
		test("画像を選択して表示・非表示できる", async ({page, nodecg}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("assets:adImage", sampleAdImageAsset);
			// 前回実行時の永続化値に依存しないよう、初期状態にリセットする。
			await nodecg.setReplicant("adImage", {name: null, visible: false});

			// 初期状態: 画像未選択のため表示ボタンが無効。
			await expect(
				page.getByRole("button", {name: "表示", exact: true}),
			).toBeDisabled();

			// ドロップダウンから画像を選択すると選択中の画像名が反映される。
			await page.getByLabel("画像").click();
			await page.getByRole("option", {name: "test-ad"}).click();
			await expect
				.poll(
					async () => (await nodecg.readReplicant<AdImage>("adImage"))?.name,
				)
				.toBe("test-ad");

			// 表示ボタンで visible が true になり、状態表示が切り替わる。
			await page.getByRole("button", {name: "表示", exact: true}).click();
			await expect
				.poll(
					async () => (await nodecg.readReplicant<AdImage>("adImage"))?.visible,
				)
				.toBe(true);
			await expect(page.getByText("表示中: test-ad")).toBeVisible();

			// 非表示ボタンで visible が false になる。
			await page.getByRole("button", {name: "非表示", exact: true}).click();
			await expect
				.poll(
					async () => (await nodecg.readReplicant<AdImage>("adImage"))?.visible,
				)
				.toBe(false);
			await expect(page.getByText("表示中: test-ad")).toBeHidden();
		});

		test("アクティブな走行を切り替えると宣伝画像が非表示になる", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("overview.html");
			await nodecg.setReplicant("assets:adImage", sampleAdImageAsset);
			await nodecg.setReplicant("runDataArray", sampleRunDataArray);
			await nodecg.setReplicant("activeRunId", sampleActiveRunId);
			// 表示中の宣伝画像を設定する。
			await nodecg.setReplicant("adImage", sampleAdImageOverlay);
			await expect(page.getByText("表示中: test-ad")).toBeVisible();

			// カーソルを run-2 へ移動するとアクティブも切り替わる。
			await page.getByRole("button", {name: "次へ"}).click();
			await expect(page.getByText("Super Metroid")).toBeVisible();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-2");

			// アクティブの切り替えで宣伝画像が非表示になる。
			await expect
				.poll(
					async () => (await nodecg.readReplicant<AdImage>("adImage"))?.visible,
				)
				.toBe(false);
		});
	});
});
