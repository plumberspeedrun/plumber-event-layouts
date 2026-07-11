import {useReplicant} from "@nodecg/react-hooks";
import type {ActiveRunId} from "../nodecg/generated/activeRunId";
import type {CameraFeeds} from "../nodecg/generated/cameraFeeds";
import type {Nsmb} from "../nodecg/generated/nsmb";
import type {ObsConfig} from "../nodecg/generated/obsConfig";
import type {RunDataArray} from "../nodecg/generated/runDataArray";
import type {SheetStaff} from "../nodecg/generated/sheetStaff";
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

export const useSheetStaff = () => {
	const [sheetStaff] = useReplicant<SheetStaff>("sheetStaff");
	if (sheetStaff == null) return;
	return sheetStaff;
};

export const useSheetRunners = () => {
	const sheetStaff = useSheetStaff();
	if (sheetStaff == null) return;
	return sheetStaff.filter((s) => s.role === "runner");
};

export const useSheetCommentators = () => {
	const sheetStaff = useSheetStaff();
	if (sheetStaff == null) return;
	return sheetStaff.filter((s) => s.role === "commentator");
};

export const useSpreadsheetStatus = () => {
	const [status] = useReplicant<SpreadsheetStatus>("spreadsheetStatus");
	if (status == null) return;
	return status;
};

export const useCurrentRunCommentators = () => {
	const activeRun = useActiveRun();
	const sheetStaff = useSheetStaff();
	if (activeRun == null || sheetStaff == null) return;
	return sheetStaff.filter(
		(s) => s.role === "commentator" && s.game === activeRun.game,
	);
};

export const useNsmb = () => {
	const [nsmb] = useReplicant<Nsmb>("nsmb");
	if (nsmb == null) return;
	return nsmb;
};

type NsmbActiveRelay = NonNullable<NonNullable<Nsmb["relayData"]>[number]>;

export const useNsmbActiveRelay = (): NsmbActiveRelay | undefined => {
	const nsmb = useNsmb();
	if (nsmb == null) return;

	const relayData = nsmb.relayData ?? [];
	const activeIndex = nsmb.activeIndex ?? 0;
	return relayData[activeIndex];
};

export const useNsmbReplicant = () => {
	return useReplicant<Nsmb>("nsmb");
};

export const useCameraFeeds = () => {
	return useReplicant<CameraFeeds>("cameraFeeds");
};

export const useObsScenes = () => {
	const [scenes] = useReplicant<string[]>("scenes", {
		bundle: "nodecg-obs-browser",
	});
	if (scenes == null) return;
	return scenes;
};

export const useObsConfig = () => {
	return useReplicant<ObsConfig>("obsConfig");
};
