import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {SheetCommentators} from "../nodecg/generated/sheetCommentators.js";
import type {SheetRunners} from "../nodecg/generated/sheetRunners.js";
import type {SpreadsheetStatus} from "../nodecg/generated/spreadsheetStatus.js";

const RUNNER_COLUMNS = ["name", "twitch", "youtube", "twitter", "niconico"];
const COMMENTATOR_COLUMNS = [
	"game",
	"name",
	"twitter",
	"twitch",
	"youtube",
	"niconico",
	"pronouns",
];

const SOCIAL_KEYS = ["twitch", "youtube", "twitter", "niconico"] as const;

type SheetRow = {
	[column: string]: string;
};

const buildSocial = (record: SheetRow) => {
	const social: Record<string, string> = {};
	for (const key of SOCIAL_KEYS) {
		if (record[key] != null) social[key] = record[key];
	}
	return Object.keys(social).length > 0 ? {social} : {};
};

const rowsToRecords = (rows: string[][], columns: string[]): SheetRow[] => {
	const [header, ...body] = rows;
	if (header == null) return [];

	const columnIndices = columns.map((column) => header.indexOf(column));

	return body.map((row) => {
		const record: SheetRow = {};
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

export const spreadsheet = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const sheetRunnersReplicant = nodecg.Replicant<SheetRunners>("sheetRunners");
	const sheetCommentatorsReplicant =
		nodecg.Replicant<SheetCommentators>("sheetCommentators");
	const spreadsheetStatusReplicant =
		nodecg.Replicant<SpreadsheetStatus>("spreadsheetStatus");

	const config = nodecg.bundleConfig.googleSpreadsheet;

	if (config == null) {
		nodecg.log.info(
			"googleSpreadsheet の設定が見つからないため、Spreadsheet 連携は無効です。",
		);
		return;
	}

	const runnerSheetName = config.runnerSheetName ?? "Runners";
	const commentatorSheetName = config.commentatorSheetName ?? "Commentators";

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
			const [runnerRows, commentatorRows] = await Promise.all([
				fetchSheetRows(runnerSheetName),
				fetchSheetRows(commentatorSheetName),
			]);

			const runnerRecords = rowsToRecords(runnerRows, RUNNER_COLUMNS);
			const commentatorRecords = rowsToRecords(
				commentatorRows,
				COMMENTATOR_COLUMNS,
			);

			sheetRunnersReplicant.value = runnerRecords
				.filter((r) => r["name"] != null)
				.map((r) => ({
					name: r["name"]!,
					...buildSocial(r),
				}));

			sheetCommentatorsReplicant.value = commentatorRecords
				.filter((r) => r["game"] != null && r["name"] != null)
				.map((r) => ({
					game: r["game"]!,
					name: r["name"]!,
					...(r["pronouns"] != null && {pronouns: r["pronouns"]}),
					...buildSocial(r),
				}));

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
