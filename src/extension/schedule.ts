import crypto from "node:crypto";
import type NodeCG from "nodecg/types";
import type {ActiveRunId} from "../nodecg/generated/activeRunId.js";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {RunDataArray} from "../nodecg/generated/runDataArray.js";
import type {SheetStaff} from "../nodecg/generated/sheetStaff.js";

type RunData = RunDataArray[number];

const sortByScheduledStartTime = (a: RunData, b: RunData): number => {
	if (a.scheduledStartTime == null && b.scheduledStartTime == null) return 0;
	if (a.scheduledStartTime == null) return 1;
	if (b.scheduledStartTime == null) return -1;
	return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
};

type AddRunInput = {
	game?: string;
	category?: string;
	system?: string;
	estimate?: string;
	setupTime?: string;
	runType?: "ffa" | "team";
	obsSceneName?: string;
	teams: {
		name?: string;
		players: {
			name: string;
			pronouns?: string;
		}[];
	}[];
};

export const schedule = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const runDataArrayRep = nodecg.Replicant<RunDataArray>("runDataArray");
	const activeRunIdRep = nodecg.Replicant<ActiveRunId>("activeRunId");
	const sheetStaffRep = nodecg.Replicant<SheetStaff>("sheetStaff");

	// アクティブな走行が存在しない（または削除済み）場合に、先頭の走行をアクティブに設定する。
	const reconcileActiveRun = () => {
		const runs = runDataArrayRep.value ?? [];
		if (runs.length === 0) {
			if (activeRunIdRep.value != null) {
				activeRunIdRep.value = null;
			}
			return;
		}
		const activeId = activeRunIdRep.value;
		if (activeId == null || !runs.some((run) => run.id === activeId)) {
			activeRunIdRep.value = runs[0]!.id;
		}
	};

	runDataArrayRep.on("change", () => {
		reconcileActiveRun();
	});
	activeRunIdRep.on("change", (newVal) => {
		if (newVal == null) {
			reconcileActiveRun();
		}
	});
	reconcileActiveRun();

	const enrichPlayerSocial = (playerName: string) => {
		const staffMember = sheetStaffRep.value?.find(
			(s) => s.role === "runner" && s.name === playerName,
		);
		return staffMember?.social ? {social: {...staffMember.social}} : {};
	};

	nodecg.listenFor("scheduleAddRun", (data: AddRunInput, ack) => {
		try {
			const newRun: RunData = {
				id: crypto.randomUUID(),
				...(data.game != null && {game: data.game}),
				...(data.category != null && {category: data.category}),
				...(data.system != null && {system: data.system}),
				...(data.estimate != null && {estimate: data.estimate}),
				...(data.setupTime != null && {setupTime: data.setupTime}),
				...(data.runType != null && {runType: data.runType}),
				...(data.obsSceneName != null && {
					obsSceneName: data.obsSceneName,
				}),
				teams: data.teams.map((team) => {
					const teamId = crypto.randomUUID();
					return {
						id: teamId,
						...(team.name != null && {name: team.name}),
						players: team.players.map((player) => ({
							id: crypto.randomUUID(),
							teamId,
							name: player.name,
							...(player.pronouns != null && {pronouns: player.pronouns}),
							...enrichPlayerSocial(player.name),
						})),
					};
				}),
			};

			const newArray = [...(runDataArrayRep.value ?? []), newRun];
			newArray.sort(sortByScheduledStartTime);
			runDataArrayRep.value = newArray;
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor(
		"scheduleUpdateRun",
		(data: {id: string; run: Partial<RunData>}, ack) => {
			try {
				const runs = runDataArrayRep.value ?? [];
				const index = runs.findIndex((run) => run.id === data.id);
				if (index >= 0) {
					const existingRun = runs[index]!;
					const {
						scheduledStartTime: _scheduledStartTime,
						releaseYear: _releaseYear,
						...restRun
					} = data.run;
					const updatedRun: RunData = {
						...existingRun,
						...restRun,
						id: existingRun.id,
					};
					const newRuns = [...runs];
					newRuns[index] = updatedRun;
					newRuns.sort(sortByScheduledStartTime);
					runDataArrayRep.value = newRuns;
				}
				if (ack && !ack.handled) ack(null);
			} catch (err) {
				if (ack && !ack.handled) ack(err as Error);
			}
		},
	);

	nodecg.listenFor("scheduleRemoveRun", (data: {id: string}, ack) => {
		try {
			const runs = runDataArrayRep.value ?? [];
			runDataArrayRep.value = runs.filter((run) => run.id !== data.id);
			// アクティブの整合は reconcileActiveRun が行う
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("scheduleSetActiveRun", (data: {id: string}, ack) => {
		try {
			const runs = runDataArrayRep.value ?? [];
			if (runs.some((run) => run.id === data.id)) {
				activeRunIdRep.value = data.id;
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});
};
