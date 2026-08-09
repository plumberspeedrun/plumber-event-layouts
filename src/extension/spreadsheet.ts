import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {SheetStaff} from "../nodecg/generated/sheetStaff.js";
import type {SpreadsheetStatus} from "../nodecg/generated/spreadsheetStatus.js";

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

type StaffSheetRow = Partial<Record<StaffSheetRowKey, string>>;

const buildSocial = (record: StaffSheetRow) => {
	const social: Record<string, string> = {};
	for (const key of SOCIAL_KEYS) {
		if (record[key] != null) social[key] = record[key];
	}
	return Object.keys(social).length > 0 ? {social} : {};
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

export const spreadsheet = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const sheetStaffReplicant = nodecg.Replicant<SheetStaff>("sheetStaff");
	const spreadsheetStatusReplicant =
		nodecg.Replicant<SpreadsheetStatus>("spreadsheetStatus");

	const config = nodecg.bundleConfig.googleSpreadsheet;

	if (config == null) {
		nodecg.log.info(
			"googleSpreadsheet の設定が見つからないため、Spreadsheet 連携は無効です。",
		);
		return;
	}

	const staffSheetName = config.staffSheetName ?? "Staff";

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

	const syncSpreadsheet = async () => {
		try {
			const staffRows = await fetchSheetRows(staffSheetName);
			const staffRecords = rowsToRecords(staffRows, STAFF_COLUMNS);

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
