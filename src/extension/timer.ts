import type NodeCG from "nodecg/types";
import type {ActiveRunId} from "../nodecg/generated/activeRunId.js";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {RunDataArray} from "../nodecg/generated/runDataArray.js";
import type {Timer} from "../nodecg/generated/timer.js";

export type RestoredTimerState = {
	accumulatedMs: number;
	startedAt: number | null;
};

/**
 * 永続化されたタイマー値から、サーバー再起動時の in-memory 状態を復元する。
 * `running` の場合はセグメント開始時刻からの差分で経過時間を再構成するため、
 * サーバー停止期間も経過時間に含まれる。
 */
export const restoreTimerState = (
	persisted: Timer,
	now: number,
): RestoredTimerState => {
	if (persisted.state === "running") {
		const started = persisted.startedAt;
		if (
			started != null &&
			Number.isFinite(started) &&
			persisted.timestamp >= started &&
			started <= now
		) {
			return {
				accumulatedMs: persisted.milliseconds - (persisted.timestamp - started),
				startedAt: started,
			};
		}
		// startedAt を持たない旧データ等は、ダウンタイムを積算して再開する。
		return {
			accumulatedMs: persisted.milliseconds + (now - persisted.timestamp),
			startedAt: now,
		};
	}
	if (persisted.state === "paused" || persisted.state === "finished") {
		return {accumulatedMs: persisted.milliseconds, startedAt: null};
	}
	return {accumulatedMs: 0, startedAt: null};
};

const formatTime = (ms: number): string => {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (n: number) => n.toString().padStart(2, "0");

	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const timer = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const runDataArrayRep = nodecg.Replicant<RunDataArray>("runDataArray");
	const activeRunIdRep = nodecg.Replicant<ActiveRunId>("activeRunId");
	const timerReplicant = nodecg.Replicant<Timer>("timer", {
		defaultValue: {
			time: "00:00:00",
			state: "stopped",
			milliseconds: 0,
			timestamp: 0,
			startedAt: null,
		},
	});

	let accumulatedMs = 0;
	let startedAt: number | null = null;
	let tickInterval: ReturnType<typeof setInterval> | null = null;

	const getCurrentMs = (): number =>
		accumulatedMs + (startedAt != null ? Date.now() - startedAt : 0);

	const stopTick = () => {
		if (tickInterval != null) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
	};

	const startTick = () => {
		stopTick();
		tickInterval = setInterval(() => {
			const ms = getCurrentMs();
			timerReplicant.value.time = formatTime(ms);
			timerReplicant.value.milliseconds = ms;
			timerReplicant.value.timestamp = Date.now();
		}, 100);
	};

	const finishTimer = () => {
		stopTick();
		const ms = getCurrentMs();
		accumulatedMs = ms;
		startedAt = null;
		timerReplicant.value.time = formatTime(ms);
		timerReplicant.value.milliseconds = ms;
		timerReplicant.value.timestamp = Date.now();
		timerReplicant.value.startedAt = null;
		timerReplicant.value.state = "finished";
	};

	const resumeRunning = () => {
		startedAt = Date.now();
		startTick();
		const ms = getCurrentMs();
		timerReplicant.value.time = formatTime(ms);
		timerReplicant.value.milliseconds = ms;
		timerReplicant.value.timestamp = Date.now();
		timerReplicant.value.startedAt = startedAt;
		timerReplicant.value.state = "running";
	};

	const getActiveRun = () => {
		const activeRunId = activeRunIdRep.value;
		if (activeRunId == null) return undefined;
		return runDataArrayRep.value?.find((run) => run.id === activeRunId);
	};

	nodecg.listenFor("timerStart", (_data, ack) => {
		try {
			const state = timerReplicant.value.state;
			if (state === "stopped") {
				accumulatedMs = 0;
				resumeRunning();
			} else if (state === "paused") {
				resumeRunning();
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("timerPause", (_data, ack) => {
		try {
			if (timerReplicant.value.state === "running" && startedAt != null) {
				accumulatedMs += Date.now() - startedAt;
				startedAt = null;
				stopTick();
				timerReplicant.value.time = formatTime(accumulatedMs);
				timerReplicant.value.milliseconds = accumulatedMs;
				timerReplicant.value.timestamp = Date.now();
				timerReplicant.value.startedAt = null;
				timerReplicant.value.state = "paused";
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("timerReset", (_data, ack) => {
		try {
			stopTick();
			accumulatedMs = 0;
			startedAt = null;
			timerReplicant.value = {
				time: "00:00:00",
				state: "stopped",
				milliseconds: 0,
				timestamp: 0,
				startedAt: null,
			};

			const run = getActiveRun();
			const activeRunId = activeRunIdRep.value;
			if (run != null && activeRunId != null) {
				runDataArrayRep.value = (runDataArrayRep.value ?? []).map((r) =>
					r.id === activeRunId ? {...r, result: undefined} : r,
				);
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor(
		"timerSplit",
		(data: {teamId: string; state?: "completed" | "forfeit"}, ack) => {
			try {
				if (timerReplicant.value.state === "running") {
					const run = getActiveRun();
					const activeRunId = activeRunIdRep.value;
					if (run != null && activeRunId != null) {
						const result = {...(run.result ?? {})};
						if (result[data.teamId] == null) {
							const ms = getCurrentMs();
							result[data.teamId] = {
								time: formatTime(ms),
								milliseconds: ms,
								state: data.state ?? "completed",
							};
							runDataArrayRep.value = (runDataArrayRep.value ?? []).map((r) =>
								r.id === activeRunId ? {...r, result} : r,
							);

							if (Object.keys(result).length >= run.teams.length) {
								finishTimer();
							}
						}
					}
				}
				if (ack && !ack.handled) ack(null);
			} catch (err) {
				if (ack && !ack.handled) ack(err as Error);
			}
		},
	);

	nodecg.listenFor("timerUndoSplit", (data: {teamId: string}, ack) => {
		try {
			const run = getActiveRun();
			const activeRunId = activeRunIdRep.value;
			if (
				run != null &&
				activeRunId != null &&
				run.result?.[data.teamId] != null
			) {
				const result = {...(run.result ?? {})};
				delete result[data.teamId];
				runDataArrayRep.value = (runDataArrayRep.value ?? []).map((r) =>
					r.id === activeRunId
						? {
								...r,
								result: Object.keys(result).length > 0 ? result : undefined,
							}
						: r,
				);

				if (timerReplicant.value.state === "finished") {
					// 完走〜取り消しまでの停止期間も経過時間に含めてから再開する。
					accumulatedMs += Date.now() - timerReplicant.value.timestamp;
					resumeRunning();
				}
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	// サーバー再起動時、永続化されたタイマー状態から in-memory 状態を復元する。
	const restored = restoreTimerState(timerReplicant.value, Date.now());
	accumulatedMs = restored.accumulatedMs;
	startedAt = restored.startedAt;
	timerReplicant.value.startedAt = restored.startedAt;
	if (timerReplicant.value.state === "running") {
		startTick();
	}
};
