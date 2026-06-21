import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import NodeCG from "nodecg/types";
import {Commentators} from "../nodecg/generated/commentators";
import {Configschema} from "../nodecg/generated/configschema";
import {ExtendedPlayerData} from "../nodecg/generated/extendedPlayerData";
import {SpreadsheetStatus} from "../nodecg/generated/spreadsheetStatus";
import {RunDataArray} from "../types/speedcontrol";

const RUNNER_COLUMNS = ["name", "twitch", "youtube", "twitter", "niconico"];
const COMMENTATOR_COLUMNS = [
	"runId",
	"name",
	"twitter",
	"twitch",
	"youtube",
	"niconico",
	"pronouns",
];

type SheetRow = {
	[column: string]: string;
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
	const commentatorsReplicant = nodecg.Replicant<Commentators>("commentators");
	const extendedPlayerDataReplicant =
		nodecg.Replicant<ExtendedPlayerData>("extendedPlayerData");
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

			const runDataArray = nodecg.readReplicant<RunDataArray>(
				"runDataArray",
				"nodecg-speedcontrol",
			);

			const newExtendedPlayerData: ExtendedPlayerData = {};
			if (runDataArray != null) {
				for (const runData of runDataArray) {
					for (const team of runData.teams) {
						for (const player of team.players) {
							const record = runnerRecords.find(
								(runner) => runner["name"] === player.name,
							);
							if (record == null) continue;

							const twitter = record["twitter"];
							const niconico = record["niconico"];
							if (twitter == null && niconico == null) continue;

							newExtendedPlayerData[player.id] = {
								...(twitter != null && {twitter}),
								...(niconico != null && {niconico}),
							};
						}
					}
				}
			}

			const newCommentators: Commentators = {};
			for (const record of commentatorRecords) {
				const runId = record["runId"];
				const name = record["name"];
				if (runId == null || name == null) continue;

				const twitter = record["twitter"];
				const twitch = record["twitch"];
				const youtube = record["youtube"];
				const niconico = record["niconico"];
				const pronouns = record["pronouns"];
				const hasSocial =
					twitter != null ||
					twitch != null ||
					youtube != null ||
					niconico != null;

				const entry = newCommentators[runId] ?? [];
				entry.push({
					name,
					...(pronouns != null && {pronouns}),
					...(hasSocial && {
						social: {
							...(twitter != null && {twitter}),
							...(twitch != null && {twitch}),
							...(youtube != null && {youtube}),
							...(niconico != null && {niconico}),
						},
					}),
				});
				newCommentators[runId] = entry;
			}

			commentatorsReplicant.value = newCommentators;
			extendedPlayerDataReplicant.value = newExtendedPlayerData;
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
