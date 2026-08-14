import type NodeCG from "nodecg/types";
import {assets} from "./assets.js";
import {horaro} from "./horaro.js";
import {nsmb} from "./nsmb.js";
import {obs} from "./obs.js";
import {schedule} from "./schedule.js";
import {sm64} from "./sm64.js";
import {spotify} from "./spotify.js";
import {spreadsheet} from "./spreadsheet.js";
import {timer} from "./timer.js";

export default (nodecg: NodeCG.ServerAPI) => {
	nodecg.log.info("plumber bundle loaded.");
	assets(nodecg);
	spreadsheet(nodecg);
	horaro(nodecg);
	nsmb(nodecg);
	schedule(nodecg);
	sm64(nodecg);
	timer(nodecg);
	obs(nodecg);
	spotify(nodecg);
};
