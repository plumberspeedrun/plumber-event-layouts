import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import type NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {Nsmb} from "../nodecg/generated/nsmb.js";

const NSMB_COLUMNS = [
	"game",
	"platform",
	"year",
	"runner",
	"commentators",
] as const;

type NsmbColumnKey = (typeof NSMB_COLUMNS)[number];
type NsmbRow = Partial<Record<NsmbColumnKey, string>>;

const rowsToRecords = (rows: string[][]): NsmbRow[] => {
	const [header, ...body] = rows;
	if (header == null) return [];

	const columnIndices = NSMB_COLUMNS.map((col) => header.indexOf(col));

	return body.map((row) => {
		const record: NsmbRow = {};
		NSMB_COLUMNS.forEach((col, i) => {
			const index = columnIndices[i];
			if (index == null || index < 0) return;
			const value = row[index];
			if (value == null || value === "") return;
			record[col] = value;
		});
		return record;
	});
};

export const nsmb = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const nsmbReplicant = nodecg.Replicant<Nsmb>("nsmb");

	const config = nodecg.bundleConfig.googleSpreadsheet;
	if (config == null) return;

	const nsmbSheetName = config.nsmbSheetName ?? "NSMB";

	const auth = new googleAuth.GoogleAuth({
		keyFile: config.credentialsPath,
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});
	const sheets = googleSheets({version: "v4", auth});

	const syncNsmb = async () => {
		try {
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: config.spreadsheetId,
				range: nsmbSheetName,
			});
			const rows = (res.data.values ?? []) as string[][];
			const records = rowsToRecords(rows);

			const currentActiveIndex = nsmbReplicant.value?.activeIndex ?? 0;
			nsmbReplicant.value = {
				relayData: records
					.filter(
						(r) =>
							r.game != null &&
							r.platform != null &&
							r.year != null &&
							r.runner != null,
					)
					.map((r) => ({
						game: r.game!,
						platform: r.platform!,
						year: parseInt(r.year!, 10),
						runner: r.runner!,
						commentators:
							r.commentators != null
								? r.commentators
										.split(",")
										.map((c) => c.trim())
										.filter((c) => c !== "")
								: [],
					})),
				activeIndex: currentActiveIndex,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			nodecg.log.error(`NSMB シートの同期に失敗しました: ${message}`);
		}
	};

	nodecg.listenFor("syncSpreadsheet", () => {
		void syncNsmb();
	});

	void syncNsmb();
};
