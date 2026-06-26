import type NodeCG from "nodecg/types";
import type {Assets} from "../types/assets";

export const assets = (nodecg: NodeCG.ServerAPI) => {
	const logoAssets = nodecg.Replicant<Assets[]>("assets:logo");

	logoAssets.on("change", (newVal) => {
		if (!newVal || newVal.length <= 1) return;

		const toDelete = newVal.slice(0, -1);
		for (const asset of toDelete) {
			fetch(`http://localhost:${nodecg.config.port}${asset.url}`, {
				method: "DELETE",
			}).catch((err) => nodecg.log.error(err));
		}
	});
};
