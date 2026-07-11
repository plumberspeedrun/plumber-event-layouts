import crypto from "node:crypto";
import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import NodeCG from "nodecg/types";
import type {ActiveRunId} from "../nodecg/generated/activeRunId.js";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {RunDataArray} from "../nodecg/generated/runDataArray.js";
import type {SheetStaff} from "../nodecg/generated/sheetStaff.js";
import type {SpreadsheetStatus} from "../nodecg/generated/spreadsheetStatus.js";

type RunData = RunDataArray[number];
type RunType = NonNullable<RunData["runType"]>;
type StaffMember = SheetStaff[number];
type StaffRole = StaffMember["role"];

const STAFF_COLUMNS: StaffSheetRowKey[] = [
	"name",
	"role",
	"game_name",
	"category",
	"team_name",
	"discord",
	"twitter",
	"youtube",
	"twitch",
];
const SCHEDULE_COLUMNS: ScheduleSheetRowKey[] = [
	"game_name",
	"category",
	"system",
	"release_year",
	"estimate",
	"setup_time",
	"scheduled_start_time",
	"run_type",
];
const SOCIAL_KEYS = ["discord", "twitch", "youtube", "twitter"] as const;

type StaffSheetRowKey =
	| "name"
	| "role"
	| "game_name"
	| "category"
	| "team_name"
	| "discord"
	| "twitter"
	| "youtube"
	| "twitch";

type ScheduleSheetRowKey =
	| "game_name"
	| "category"
	| "system"
	| "release_year"
	| "estimate"
	| "setup_time"
	| "scheduled_start_time"
	| "run_type";

type StaffSheetRow = Partial<Record<StaffSheetRowKey, string>>;
type ScheduleSheetRow = Partial<Record<ScheduleSheetRowKey, string>>;

const buildSocial = (record: StaffSheetRow) => {
	const social: Record<string, string> = {};
	for (const key of SOCIAL_KEYS) {
		if (record[key] != null) social[key] = record[key];
	}
	return Object.keys(social).length > 0 ? {social} : {};
};

const buildSocialField = (social: StaffMember["social"]) => {
	if (social == null) return {};
	const filtered: Record<string, string> = {};
	for (const key of SOCIAL_KEYS) {
		const value = social[key];
		if (value != null) filtered[key] = value;
	}
	return Object.keys(filtered).length > 0 ? {social: filtered} : {};
};

const rowsToRecords = <K extends string>(
	rows: string[][],
	columns: K[],
): Partial<Record<K, string>>[] => {
	const [header, ...body] = rows;
	if (header == null) return [];

	const columnIndices = columns.map((column) => header.indexOf(column));

	return body.map((row) => {
		const record: Partial<Record<K, string>> = {};
		columns.forEach((column, i) => {
			const index = columnIndices[i];
			if (index == null || index < 0) return;
			const value = row[index];
			if (value == null || value === "") return;
			record[column] = value;
		});
		return record;
	});
};

const sortByScheduledStartTime = (a: RunData, b: RunData): number => {
	if (a.scheduledStartTime == null && b.scheduledStartTime == null) return 0;
	if (a.scheduledStartTime == null) return 1;
	if (b.scheduledStartTime == null) return -1;
	return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
};

const parseRunType = (raw: string | undefined): RunType =>
	raw === "team" ? "team" : "ffa";

const ROLE_MAP: Record<string, StaffRole> = {
	runner: "runner",
	commentator: "commentator",
	走者: "runner",
	解説: "commentator",
};

const parseRole = (raw: string | undefined): StaffRole | undefined => {
	if (raw == null) return undefined;
	return ROLE_MAP[raw.trim()];
};

const toIsoDateTime = (raw: string | undefined): string | undefined => {
	if (raw == null) return undefined;
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

export const spreadsheet = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const sheetStaffReplicant = nodecg.Replicant<SheetStaff>("sheetStaff");
	const spreadsheetStatusReplicant =
		nodecg.Replicant<SpreadsheetStatus>("spreadsheetStatus");
	const runDataArrayReplicant = nodecg.Replicant<RunDataArray>("runDataArray");
	const activeRunIdReplicant = nodecg.Replicant<ActiveRunId>("activeRunId");

	const config = nodecg.bundleConfig.googleSpreadsheet;

	if (config == null) {
		nodecg.log.info(
			"googleSpreadsheet の設定が見つからないため、Spreadsheet 連携は無効です。",
		);
		return;
	}

	const staffSheetName = config.staffSheetName ?? "Staff";
	const scheduleSheetName = config.scheduleSheetName ?? "Schedule";

	const auth = new googleAuth.GoogleAuth({
		keyFile: config.credentialsPath,
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});
	const sheets = googleSheets({version: "v4", auth});

	const fetchSheetRows = async (sheetName: string): Promise<string[][]> => {
		const res = await sheets.spreadsheets.values.get({
			spreadsheetId: config.spreadsheetId,
			range: sheetName,
		});
		return (res.data.values ?? []) as string[][];
	};

	const toPlayer = (
		staffMember: StaffMember,
		teamId: string,
	): RunData["teams"][number]["players"][number] => ({
		id: crypto.randomUUID(),
		teamId,
		name: staffMember.name,
		...buildSocialField(staffMember.social),
	});

	const buildTeams = (
		runners: StaffMember[],
		runType: RunType,
	): RunData["teams"] => {
		const hasTeamName = runners.some(
			(r) => r.teamName != null && r.teamName !== "",
		);

		if (!hasTeamName) {
			if (runType === "team") {
				if (runners.length === 0) return [];
				const teamId = crypto.randomUUID();
				return [{id: teamId, players: runners.map((r) => toPlayer(r, teamId))}];
			}
			return runners.map((r) => {
				const teamId = crypto.randomUUID();
				return {id: teamId, players: [toPlayer(r, teamId)]};
			});
		}

		const groups = new Map<string, StaffMember[]>();
		for (const r of runners) {
			const key = r.teamName ?? "";
			const list = groups.get(key) ?? [];
			list.push(r);
			groups.set(key, list);
		}

		return Array.from(groups.entries()).map(([teamName, members]) => {
			const teamId = crypto.randomUUID();
			return {
				id: teamId,
				...(teamName !== "" && {name: teamName}),
				players: members.map((r) => toPlayer(r, teamId)),
			};
		});
	};

	const buildCommentators = (
		commentators: StaffMember[],
	): RunData["commentators"] => {
		if (commentators.length === 0) return undefined;
		return commentators.map((c) => ({
			name: c.name,
			...buildSocialField(c.social),
		}));
	};

	const buildRunFromScheduleRow = (
		record: ScheduleSheetRow,
		staff: SheetStaff,
	): RunData => {
		const runType = parseRunType(record.run_type);
		const scheduledStartTime = toIsoDateTime(record.scheduled_start_time);
		const staffForGame = staff.filter(
			(s) =>
				s.game === record.game_name &&
				(s.category == null || s.category === record.category),
		);
		const runners = staffForGame.filter((s) => s.role === "runner");
		const commentators = buildCommentators(
			staffForGame.filter((s) => s.role === "commentator"),
		);

		return {
			id: crypto.randomUUID(),
			game: record.game_name!,
			...(record.category != null && {category: record.category}),
			...(record.system != null && {system: record.system}),
			...(record.release_year != null && {
				releaseYear: record.release_year,
			}),
			...(record.estimate != null && {estimate: record.estimate}),
			...(record.setup_time != null && {setupTime: record.setup_time}),
			...(scheduledStartTime != null && {scheduledStartTime}),
			runType,
			teams: buildTeams(runners, runType),
			...(commentators != null && {commentators}),
		};
	};

	const syncSpreadsheet = async () => {
		try {
			const [staffRows, scheduleRows] = await Promise.all([
				fetchSheetRows(staffSheetName),
				fetchSheetRows(scheduleSheetName),
			]);

			const staffRecords = rowsToRecords(staffRows, STAFF_COLUMNS);
			const scheduleRecords = rowsToRecords(scheduleRows, SCHEDULE_COLUMNS);

			const newSheetStaff: SheetStaff = staffRecords.flatMap((r) => {
				if (r.name == null) return [];
				const role = parseRole(r.role);
				if (role == null) return [];
				return [
					{
						name: r.name,
						role,
						...(r.game_name != null && {game: r.game_name}),
						...(r.category != null && {category: r.category}),
						...(r.team_name != null && {teamName: r.team_name}),
						...buildSocial(r),
					},
				];
			});

			sheetStaffReplicant.value = newSheetStaff;

			const newRunDataArray = scheduleRecords
				.filter((r) => r.game_name != null)
				.map((record) => buildRunFromScheduleRow(record, newSheetStaff));
			newRunDataArray.sort(sortByScheduledStartTime);

			runDataArrayReplicant.value = newRunDataArray;
			if (
				activeRunIdReplicant.value != null &&
				!newRunDataArray.some((run) => run.id === activeRunIdReplicant.value)
			) {
				activeRunIdReplicant.value = null;
			}

			spreadsheetStatusReplicant.value = {
				enabled: true,
				lastSynced: new Date().toISOString(),
			};

			nodecg.log.info("Spreadsheet の同期が完了しました。");
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			spreadsheetStatusReplicant.value = {
				enabled: true,
				lastError: message,
			};
			nodecg.log.error(`Spreadsheet の同期に失敗しました: ${message}`);
		}
	};

	nodecg.listenFor("syncSpreadsheet", (_data, ack) => {
		syncSpreadsheet()
			.then(() => {
				if (ack && !ack.handled) ack(null);
			})
			.catch((err) => {
				if (ack && !ack.handled) ack(err);
			});
	});

	void syncSpreadsheet();
};
