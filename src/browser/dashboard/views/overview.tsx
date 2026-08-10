import {Box, Divider, Stack} from "@mui/material";
import {renderDashboard} from "../index";
import {Schedule} from "../sections/Schedule";
import {TimerControl} from "../sections/TimerControl";

const Overview = () => (
	<Stack
		direction='row'
		spacing={1}
		sx={{minHeight: "100vh"}}
	>
		<Box sx={{flex: 1, minWidth: 0}}>
			<TimerControl />
		</Box>
		<Divider
			orientation='vertical'
			flexItem
		/>
		<Box sx={{flex: 1, minWidth: 0}}>
			<Schedule />
		</Box>
	</Stack>
);

renderDashboard(<Overview />);
