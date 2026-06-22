import type NodeCG from "nodecg/types";
import type {ActiveRunId} from "../nodecg/generated/activeRunId.js";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {RunDataArray} from "../nodecg/generated/runDataArray.js";
import type {Timer} from "../nodecg/generated/timer.js";

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
			timerReplicant.value = {
				...timerReplicant.value,
				time: formatTime(ms),
				milliseconds: ms,
				timestamp: Date.now(),
			};
		}, 100);
	};

	const finishTimer = () => {
		stopTick();
		const ms = getCurrentMs();
		timerReplicant.value = {
			...timerReplicant.value,
			time: formatTime(ms),
			milliseconds: ms,
			timestamp: Date.now(),
			state: "finished",
		};
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
				startedAt = Date.now();
				startTick();
				timerReplicant.value = {...timerReplicant.value, state: "running"};
			} else if (state === "paused") {
				startedAt = Date.now();
				startTick();
				timerReplicant.value = {...timerReplicant.value, state: "running"};
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("timerPause", (_data, ack) => {
		try {
			if (timerReplicant.value.state === "running") {
				accumulatedMs += Date.now() - startedAt!;
				startedAt = null;
				stopTick();
				timerReplicant.value = {
					...timerReplicant.value,
					time: formatTime(accumulatedMs),
					milliseconds: accumulatedMs,
					timestamp: Date.now(),
					state: "paused",
				};
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("timerStop", (_data, ack) => {
		try {
			const state = timerReplicant.value.state;
			if (state === "running" || state === "paused") {
				const finalMs = getCurrentMs();
				accumulatedMs = finalMs;
				startedAt = null;

				const run = getActiveRun();
				const activeRunId = activeRunIdRep.value;
				if (run != null && activeRunId != null) {
					const result = {...(run.result ?? {})};
					let placement = Object.keys(result).length;
					for (const team of run.teams) {
						if (result[team.id] != null) continue;
						placement += 1;
						result[team.id] = {
							time: formatTime(finalMs),
							milliseconds: finalMs,
							placement,
							state: "completed",
						};
					}
					runDataArrayRep.value = (runDataArrayRep.value ?? []).map((r) =>
						r.id === activeRunId ? {...r, result} : r,
					);
				}

				finishTimer();
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
							const placement = Object.keys(result).length + 1;
							result[data.teamId] = {
								time: formatTime(ms),
								milliseconds: ms,
								placement,
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
};
