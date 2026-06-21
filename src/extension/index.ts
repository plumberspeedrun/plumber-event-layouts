import NodeCG from "nodecg/types";
import {assets} from "./assets";
import {spreadsheet} from "./spreadsheet";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
	spreadsheet(nodecg);
};
