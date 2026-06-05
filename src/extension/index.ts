import NodeCG from "nodecg/types";
import {assets} from "./assets";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
};
