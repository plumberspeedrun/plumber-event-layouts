import {auth as googleAuth, sheets as googleSheets} from "@googleapis/sheets";
import type NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {Nsmb} from "../nodecg/generated/nsmb.js";
import type {SheetStaff} from "../nodecg/generated/sheetStaff.js";

const NSMB_COLUMNS = [
	"game",
	"category",
	"platform",
	"year",
	"runner",
	"commentator_1",
	"commentator_2",
] as const;

type NsmbColumnKey = (typeof NSMB_COLUMNS)[number];
type NsmbRow = Partial<Record<NsmbColumnKey, string>>;

type Social = {
	discord?: string;
	twitch?: string;
	youtube?: string;
	twitter?: string;
	niconico?: string;
};

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

const buildSocialField = (social: Social | undefined) => {
	if (social == null) return {};
	const filtered: Record<string, string> = {};
	for (const [key, value] of Object.entries(social)) {
		if (value != null) filtered[key] = value;
	}
	return Object.keys(filtered).length > 0 ? {social: filtered} : {};
};

export const nsmb = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const nsmbReplicant = nodecg.Replicant<Nsmb>("nsmb");
	const sheetStaffRep = nodecg.Replicant<SheetStaff>("sheetStaff");

	const config = nodecg.bundleConfig.googleSpreadsheet;
	if (config == null) return;

	const nsmbSheetName = config.nsmbSheetName ?? "NSMB";

	const auth = new googleAuth.GoogleAuth({
		keyFile: config.credentialsPath,
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});
	const sheets = googleSheets({version: "v4", auth});

	const findRunnerSocial = (name: string) => {
		const staffMember = (sheetStaffRep.value ?? []).find(
			(s) => s.role === "runner" && s.name === name,
		);
		return staffMember?.social as Social | undefined;
	};

	const findCommentatorSocial = (name: string) => {
		const staffMember = (sheetStaffRep.value ?? []).find(
			(s) => s.role === "commentator" && s.name === name,
		);
		return staffMember?.social as Social | undefined;
	};

	const enrichRelayData = () => {
		const current = nsmbReplicant.value;
		if (current?.relayData == null) return;

		nsmbReplicant.value = {
			...current,
			relayData: current.relayData.map((item) => ({
				...item,
				runner: {
					name: item.runner.name,
					...buildSocialField(findRunnerSocial(item.runner.name)),
				},
				commentators: (item.commentators ?? []).map((c) => ({
					name: c.name,
					...buildSocialField(findCommentatorSocial(c.name)),
				})),
			})),
		};
	};

	sheetStaffRep.on("change", () => enrichRelayData());

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
							r.category != null &&
							r.platform != null &&
							r.year != null &&
							r.runner != null,
					)
					.map((r) => ({
						game: r.game!,
						category: r.category!,
						platform: r.platform!,
						year: parseInt(r.year!, 10),
						runner: {
							name: r.runner!,
							...buildSocialField(findRunnerSocial(r.runner!)),
						},
						commentators: [r.commentator_1, r.commentator_2]
							.filter((c): c is string => c != null && c !== "")
							.map((name) => ({
								name,
								...buildSocialField(findCommentatorSocial(name)),
							})),
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
