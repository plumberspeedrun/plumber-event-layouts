import type NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {ObsConfig} from "../nodecg/generated/obsConfig.js";

export const obs = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const obsConfigRep = nodecg.Replicant<ObsConfig>("obsConfig");

	nodecg.listenFor("obsChangeScene", (sceneName: string, ack) => {
		try {
			nodecg.sendMessageToBundle(
				"change-scene",
				"nodecg-obs-browser",
				sceneName,
			);
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("obsSetupScene", (_data, ack) => {
		try {
			const setupSceneName = obsConfigRep.value?.setupSceneName;
			if (setupSceneName != null) {
				nodecg.sendMessageToBundle(
					"change-scene",
					"nodecg-obs-browser",
					setupSceneName,
				);
			}
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});
};
