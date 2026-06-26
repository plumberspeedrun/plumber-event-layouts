import {useReplicant} from "@nodecg/react-hooks";
import type {ActiveRunId} from "../nodecg/generated/activeRunId";
import type {Nsmb} from "../nodecg/generated/nsmb";
import type {RunDataArray} from "../nodecg/generated/runDataArray";
import type {SheetCommentators} from "../nodecg/generated/sheetCommentators";
import type {SheetRunners} from "../nodecg/generated/sheetRunners";
import type {SpreadsheetStatus} from "../nodecg/generated/spreadsheetStatus";
import type {Timer} from "../nodecg/generated/timer";

export const useRunDataArray = () => {
	const [runDataArray] = useReplicant<RunDataArray>("runDataArray");
	if (runDataArray == null) return;
	return runDataArray;
};

export const useActiveRunId = () => {
	const [activeRunId] = useReplicant<ActiveRunId>("activeRunId");
	if (activeRunId == null) return;
	return activeRunId;
};

export const useActiveRun = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();
	if (activeRunId == null || runDataArray == null) return;
	return runDataArray.find((r) => r.id === activeRunId);
};

export const useUpcomingRun = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();
	if (activeRunId == null || runDataArray == null) return;
	const activeIndex = runDataArray.findIndex((r) => r.id === activeRunId);
	if (activeIndex < 0 || activeIndex >= runDataArray.length - 1) return;
	return runDataArray[activeIndex + 1];
};

export const useTimer = () => {
	const [timer] = useReplicant<Timer>("timer");
	if (timer == null) return;
	return timer;
};

export const useSheetRunners = () => {
	const [sheetRunners] = useReplicant<SheetRunners>("sheetRunners");
	if (sheetRunners == null) return;
	return sheetRunners;
};

export const useSheetCommentators = () => {
	const [sheetCommentators] =
		useReplicant<SheetCommentators>("sheetCommentators");
	if (sheetCommentators == null) return;
	return sheetCommentators;
};

export const useSpreadsheetStatus = () => {
	const [status] = useReplicant<SpreadsheetStatus>("spreadsheetStatus");
	if (status == null) return;
	return status;
};

export const useCurrentRunCommentators = () => {
	const activeRun = useActiveRun();
	const sheetCommentators = useSheetCommentators();
	if (activeRun == null || sheetCommentators == null) return;
	return sheetCommentators.filter((c) => c.game === activeRun.game);
};

type Social = {
	twitch?: string;
	youtube?: string;
	twitter?: string;
	niconico?: string;
};

type NsmbActiveRelay = {
	game: string;
	platform: string;
	year: number;
	runner: {name: string; social?: Social};
	commentators: Array<{name: string; social?: Social}>;
};

export const useNsmb = () => {
	const [nsmb] = useReplicant<Nsmb>("nsmb");
	if (nsmb == null) return;
	return nsmb;
};

export const useNsmbActiveRelay = (): NsmbActiveRelay | undefined => {
	const nsmb = useNsmb();
	const sheetRunners = useSheetRunners();
	const sheetCommentators = useSheetCommentators();

	if (nsmb == null || sheetRunners == null || sheetCommentators == null) return;

	const relayData = nsmb.relayData ?? [];
	const activeIndex = nsmb.activeIndex ?? 0;
	const relay = relayData[activeIndex];
	if (relay == null) return;

	const runnerSheet = sheetRunners.find((r) => r.name === relay.runner);
	const runner = {
		name: relay.runner,
		...(runnerSheet?.social != null && {social: runnerSheet.social}),
	};

	const commentators = (relay.commentators ?? []).map((name) => {
		const sheet = sheetCommentators.find((c) => c.name === name);
		return {name, ...(sheet?.social != null && {social: sheet.social})};
	});

	return {
		game: relay.game,
		platform: relay.platform,
		year: relay.year,
		runner,
		commentators,
	};
};

export const useNsmbReplicant = () => {
	return useReplicant<Nsmb>("nsmb");
};
