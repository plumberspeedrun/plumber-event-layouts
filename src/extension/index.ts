import type NodeCG from "nodecg/types";
import {assets} from "./assets.js";
import {schedule} from "./schedule.js";
import {spreadsheet} from "./spreadsheet.js";
import {timer} from "./timer.js";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
	spreadsheet(nodecg);
	schedule(nodecg);
	timer(nodecg);
};
