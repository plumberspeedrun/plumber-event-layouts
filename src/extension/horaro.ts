import crypto from "node:crypto";
import type NodeCG from "nodecg/types";
import type {ActiveRunId} from "../nodecg/generated/activeRunId.js";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {RunDataArray} from "../nodecg/generated/runDataArray.js";
import type {SheetStaff} from "../nodecg/generated/sheetStaff.js";

type RunData = RunDataArray[number];
type RunType = NonNullable<RunData["runType"]>;

type HoraroItem = {
	length?: string;
	scheduled?: string;
	options?: {setup?: string} | null;
	data: (string | null | undefined)[];
};

type HoraroSchedule = {
	data: {
		columns: string[];
		items: HoraroItem[];
	};
};

const parseIsoSeconds = (iso: string | undefined): number | null => {
	if (iso == null) return null;
	const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(
		iso,
	);
	if (m == null) return null;
	const day = Number(m[1] ?? 0);
	const hour = Number(m[2] ?? 0);
	const minute = Number(m[3] ?? 0);
	const second = Number(m[4] ?? 0);
	return Math.round(day * 86400 + hour * 3600 + minute * 60 + second);
};

const parseSetupSeconds = (raw: string | undefined): number | null => {
	if (raw == null) return null;
	const value = raw.trim().toLowerCase();
	const hms = /^(\d+)h(\d+)m(\d+)s$/.exec(value);
	if (hms != null) {
		return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
	}
	const ms = /^(\d+)m(\d+)s$/.exec(value);
	if (ms != null) return Number(ms[1]) * 60 + Number(ms[2]);
	if (/^\d+m$/.test(value)) return Number(value.slice(0, -1)) * 60;
	if (/^\d+s$/.test(value)) return Number(value.slice(0, -1));
	return null;
};

const formatSeconds = (total: number): string => {
	const hour = Math.floor(total / 3600);
	const minute = Math.floor((total % 3600) / 60);
	const second = total % 60;
	if (hour > 0) {
		return `${hour}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
	}
	return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
};

const toIsoDateTime = (raw: string | undefined): string | undefined => {
	if (raw == null) return undefined;
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

const splitRunners = (raw: string | undefined): string[] => {
	if (raw == null) return [];
	return raw
		.split(/[,，]/)
		.map((s) => s.trim())
		.filter((s) => s !== "");
};

const buildPlayer = (name: string, teamId: string, sheetStaff: SheetStaff) => {
	const social = sheetStaff.find(
		(s) => s.role === "runner" && s.name === name,
	)?.social;
	return {
		id: crypto.randomUUID(),
		teamId,
		name,
		...(social != null && {social: {...social}}),
	};
};

const buildTeams = (
	runners: string[],
	runType: RunType,
	sheetStaff: SheetStaff,
): RunData["teams"] => {
	if (runners.length === 0) return [];

	if (runType === "team") {
		return runners.map((teamName) => ({
			id: crypto.randomUUID(),
			name: teamName,
			players: [],
		}));
	}
	return runners.map((name) => {
		const teamId = crypto.randomUUID();
		return {id: teamId, players: [buildPlayer(name, teamId, sheetStaff)]};
	});
};

const resolveRunType = (
	raw: string | undefined,
	runTypes: {ffa?: readonly string[]; team?: readonly string[]} | undefined,
): RunType => {
	if (raw == null) return "ffa";
	const value = raw.trim();
	if (runTypes?.team?.includes(value)) return "team";
	return "ffa";
};

export const horaro = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const runDataArrayReplicant = nodecg.Replicant<RunDataArray>("runDataArray");
	const activeRunIdReplicant = nodecg.Replicant<ActiveRunId>("activeRunId");
	const sheetStaffReplicant = nodecg.Replicant<SheetStaff>("sheetStaff");

	const config = nodecg.bundleConfig.horaro;
	if (config == null) {
		nodecg.log.info("horaro の設定が見つからないため、Horaro 連携は無効です。");
		return;
	}

	const baseUrl = config.baseUrl ?? "https://horaro.net/-/api/v1/schedules/";
	const columnMap = config.columns ?? {};

	let cachedColumns: string[] = [];
	let cachedItems: HoraroItem[] = [];
	let hasCached = false;

	const buildRunData = (
		item: HoraroItem,
		columns: string[],
		sheetStaff: SheetStaff,
	): RunData | null => {
		const row: Record<string, string> = {};
		columns.forEach((col, i) => {
			const value = item.data[i];
			if (value != null && value !== "") row[col] = value;
		});

		const game = columnMap.game ? row[columnMap.game] : undefined;
		if (game == null) return null;

		const category = columnMap.category ? row[columnMap.category] : undefined;
		const system = columnMap.system ? row[columnMap.system] : undefined;
		const runType = resolveRunType(
			columnMap.runType ? row[columnMap.runType] : undefined,
			config.runTypes,
		);
		const runnerRaw =
			columnMap.runner != null ? row[columnMap.runner] : undefined;

		const estimateSeconds = parseIsoSeconds(item.length);
		const setupSeconds = parseSetupSeconds(item.options?.setup);
		const scheduledStartTime = toIsoDateTime(item.scheduled);

		return {
			id: crypto.randomUUID(),
			game,
			...(category != null && {category}),
			...(system != null && {system}),
			...(estimateSeconds != null && {
				estimate: formatSeconds(estimateSeconds),
			}),
			...(setupSeconds != null && {setupTime: formatSeconds(setupSeconds)}),
			...(scheduledStartTime != null && {scheduledStartTime}),
			...(columnMap.runType != null && {runType}),
			teams: buildTeams(splitRunners(runnerRaw), runType, sheetStaff),
		};
	};

	const rebuild = () => {
		if (!hasCached) return;
		const runDataArray = cachedItems
			.map((item) =>
				buildRunData(item, cachedColumns, sheetStaffReplicant.value ?? []),
			)
			.filter((run): run is RunData => run != null);
		runDataArrayReplicant.value = runDataArray;
		if (
			activeRunIdReplicant.value != null &&
			!runDataArray.some((run) => run.id === activeRunIdReplicant.value)
		) {
			activeRunIdReplicant.value = null;
		}
	};

	const syncSchedule = async () => {
		try {
			const response = await fetch(`${baseUrl}${config.scheduleId}`);
			if (!response.ok) {
				throw new Error(`Horaro API の応答が異常です: ${response.status}`);
			}
			const schedule = (await response.json()) as HoraroSchedule;
			cachedColumns = schedule.data.columns;
			cachedItems = schedule.data.items;
			hasCached = true;
			rebuild();
			nodecg.log.info(
				`Horaro の同期が完了しました（${cachedItems.length} 走行）。`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			nodecg.log.error(`Horaro の同期に失敗しました: ${message}`);
		}
	};

	sheetStaffReplicant.on("change", () => {
		rebuild();
	});

	nodecg.listenFor("syncSpreadsheet", () => {
		void syncSchedule();
	});

	void syncSchedule();
};
