import NodeCG from "nodecg/types";
import {assets} from "./assets.js";
import {spreadsheet} from "./spreadsheet.js";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
	spreadsheet(nodecg);
};
