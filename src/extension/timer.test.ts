import {describe, expect, it} from "vitest";
import type {Timer} from "../nodecg/generated/timer.js";
import {restoreTimerState} from "./timer.js";

const baseTimer: Timer = {
	time: "00:01:00",
	state: "running",
	milliseconds: 60000,
	timestamp: 1000,
	startedAt: 1000,
};

describe("restoreTimerState", () => {
	it("running の場合はセグメント開始時刻と積算値を復元する", () => {
		// milliseconds = accumulatedMs + (timestamp - startedAt) を逆算する。
		const restored = restoreTimerState(
			{...baseTimer, milliseconds: 10000, timestamp: 11000, startedAt: 10000},
			20000,
		);
		expect(restored).toEqual({accumulatedMs: 9000, startedAt: 10000});
		// 再開後の経過時間には停止期間（now - timestamp）が含まれる。
		expect(restored.accumulatedMs + (20000 - (restored.startedAt ?? 0))).toBe(
			19000,
		);
	});

	it("startedAt を持たない旧データはダウンタイムを積算して再開する", () => {
		const restored = restoreTimerState({...baseTimer, startedAt: null}, 20000);
		expect(restored).toEqual({
			accumulatedMs: 60000 + (20000 - 1000),
			startedAt: 20000,
		});
	});

	it("startedAt が NaN の異常データはフォールバックする", () => {
		const restored = restoreTimerState(
			{...baseTimer, startedAt: Number.NaN},
			20000,
		);
		expect(restored).toEqual({
			accumulatedMs: 60000 + (20000 - 1000),
			startedAt: 20000,
		});
	});

	it("timestamp が startedAt より古い異常データはフォールバックする", () => {
		const restored = restoreTimerState(
			{...baseTimer, timestamp: 500, startedAt: 1000},
			20000,
		);
		expect(restored).toEqual({
			accumulatedMs: 60000 + (20000 - 500),
			startedAt: 20000,
		});
	});

	it("startedAt が未来（now より後）の場合はフォールバックする", () => {
		const restored = restoreTimerState(
			{...baseTimer, timestamp: 26000, startedAt: 25000},
			20000,
		);
		expect(restored).toEqual({
			accumulatedMs: 60000 + (20000 - 26000),
			startedAt: 20000,
		});
	});

	it("paused は積算値を維持し、開始時刻は null にする", () => {
		const restored = restoreTimerState(
			{...baseTimer, state: "paused", milliseconds: 30000},
			20000,
		);
		expect(restored).toEqual({accumulatedMs: 30000, startedAt: null});
	});

	it("finished は積算値を維持し、開始時刻は null にする", () => {
		const restored = restoreTimerState(
			{...baseTimer, state: "finished", milliseconds: 30000},
			20000,
		);
		expect(restored).toEqual({accumulatedMs: 30000, startedAt: null});
	});

	it("stopped は初期状態を返す", () => {
		const restored = restoreTimerState(
			{...baseTimer, state: "stopped", milliseconds: 0},
			20000,
		);
		expect(restored).toEqual({accumulatedMs: 0, startedAt: null});
	});
});
