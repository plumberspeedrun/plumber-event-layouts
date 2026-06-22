import {useReplicant} from "@nodecg/react-hooks";
import type {ActiveRunId} from "../nodecg/generated/activeRunId";
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
