export type {ActiveRunId} from "../nodecg/generated/activeRunId";
export type {RunDataArray} from "../nodecg/generated/runDataArray";
export type {SheetCommentators} from "../nodecg/generated/sheetCommentators";
export type {SheetRunners} from "../nodecg/generated/sheetRunners";
export type {Timer} from "../nodecg/generated/timer";

import type {RunDataArray} from "../nodecg/generated/runDataArray";
import type {SheetCommentators} from "../nodecg/generated/sheetCommentators";
import type {SheetRunners} from "../nodecg/generated/sheetRunners";

// 配列要素の型を抽出
export type RunData = RunDataArray[number];
export type RunDataTeam = RunData["teams"][number];
export type RunDataPlayer = RunDataTeam["players"][number];
export type RunDataCommentator = NonNullable<RunData["commentators"]>[number];
export type RunDataResult = NonNullable<RunData["result"]>[string];

export type SheetRunner = SheetRunners[number];
export type SheetCommentator = SheetCommentators[number];
