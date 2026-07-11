import type NodeCG from "nodecg/types";
import {assets} from "./assets.js";
import {nsmb} from "./nsmb.js";
import {obs} from "./obs.js";
import {schedule} from "./schedule.js";
import {spreadsheet} from "./spreadsheet.js";
import {timer} from "./timer.js";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
	spreadsheet(nodecg);
	nsmb(nodecg);
	schedule(nodecg);
	timer(nodecg);
	obs(nodecg);
};
