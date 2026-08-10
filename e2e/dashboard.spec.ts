import type {ActiveRunId} from "../src/nodecg/generated/activeRunId";
import type {Nsmb} from "../src/nodecg/generated/nsmb";
import type {RunDataArray} from "../src/nodecg/generated/runDataArray";
import type {Timer} from "../src/nodecg/generated/timer";
import {
	sampleActiveRunId,
	sampleActiveRunIdForTimer,
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
			await nodecg.gotoDashboard("timerControl.html");

			// 他テストの残存状態に依存しないよう、初期化してから開始する。
			await nodecg.sendMessage("timerReset");
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("stopped");

			await page.getByRole("button", {name: "開始/再開"}).click();
			await expect
				.poll(async () => (await nodecg.readReplicant<Timer>("timer"))?.state)
				.toBe("running");
			await expect(page.getByText("状態: running")).toBeVisible();
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
			await nodecg.gotoDashboard("timerControl.html");
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
			await expect(page.getByText(/completed/)).toHaveCount(1);
			await expect(page.getByText(/forfeit/)).toHaveCount(1);

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
		test("走行を Active に設定でき、前後の走行へ移動できる", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("schedule.html");
			await nodecg.setReplicant("runDataArray", sampleRunDataArray);
			await nodecg.setReplicant("activeRunId", null);
			await expect(page.getByText("Super Mario World")).toBeVisible();
			expect(await nodecg.readReplicant<ActiveRunId>("activeRunId")).toBeNull();

			// 2番目の走行 (Super Metroid) を Active に設定。
			await page.getByRole("button", {name: "Activeに設定"}).nth(1).click();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-2");
			await expect(
				page.getByRole("button", {name: "Activeに設定"}).nth(1),
			).toBeDisabled();

			// 前へ → run-1 に戻る。
			await page.getByRole("button", {name: "前へ"}).click();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-1");

			// 次へ → 再び run-2。
			await page.getByRole("button", {name: "次へ"}).click();
			await expect
				.poll(async () => nodecg.readReplicant<ActiveRunId>("activeRunId"))
				.toBe("run-2");
		});

		test("走行を編集して保存すると runDataArray に反映される", async ({
			page,
			nodecg,
		}) => {
			await nodecg.gotoDashboard("schedule.html");
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
});
