import {useReplicant} from "@nodecg/react-hooks";
import {Commentators} from "../nodecg/generated/commentators";
import {ExtendedPlayerData} from "../nodecg/generated/extendedPlayerData";
import {RunDataActiveRun, RunDataArray, Timer} from "../types/speedcontrol";

export const useRunDataArray = () => {
	const [runDataArray] = useReplicant<RunDataArray>("runDataArray", {
		bundle: "nodecg-speedcontrol",
	});
	if (runDataArray == null) return;
	return runDataArray;
};

export const useTimer = () => {
	const [timer] = useReplicant<Timer>("timer", {bundle: "nodecg-speedcontrol"});
	if (timer == null) return;
	return timer;
};

export const useRunDataActiveRun = () => {
	const [runDataActiveRun] = useReplicant<RunDataActiveRun>(
		"runDataActiveRun",
		{bundle: "nodecg-speedcontrol"},
	);

	if (runDataActiveRun == null) return;
	return runDataActiveRun;
};

export const useUpcomingRunData = () => {
	const runDataActiveRun = useRunDataActiveRun();
	const runDataArray = useRunDataArray();

	if (runDataActiveRun == null) return;
	const upcomingRunData = runDataArray?.filter(
		(runData) => runData.id == runDataActiveRun?.id + 1,
	)[0];
	return upcomingRunData;
};

export const useCommentators = () => {
	const [commentators] = useReplicant<Commentators>("commentators");
	if (commentators == null) return;
	return commentators;
};

export const useExtendedPlayerData = () => {
	const [extendedPlayerData] =
		useReplicant<ExtendedPlayerData>("extendedPlayerData");
	if (extendedPlayerData == null) return;
	return extendedPlayerData;
};

export const useCurrentRunCommentators = () => {
	const runDataActiveRun = useRunDataActiveRun();
	const commentators = useCommentators();

	if (runDataActiveRun == null || commentators == null) return;
	return commentators[runDataActiveRun.id];
};
