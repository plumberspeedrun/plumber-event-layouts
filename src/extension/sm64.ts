import type NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {Sm64} from "../nodecg/generated/sm64.js";

export const sm64 = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const sm64Replicant = nodecg.Replicant<Sm64>("sm64");

	sm64Replicant.on("change", (newVal, oldVal) => {
		if (oldVal === undefined || newVal === undefined) return;
		if (newVal.activeIndex === oldVal.activeIndex) return;

		const activeIndex = newVal.activeIndex ?? 0;
		const scene = newVal.scenes?.[activeIndex];
		const sceneName = scene?.obsSceneName;
		if (sceneName == null) return;

		nodecg.sendMessageToBundle("change-scene", "nodecg-obs-browser", sceneName);
	});
};
