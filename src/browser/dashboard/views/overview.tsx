import {Box, Divider, Stack, useMediaQuery} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import {renderDashboard} from "../index";
import {AdImageControl} from "../sections/AdImageControl";
import {CameraControl} from "../sections/CameraControl";
import {Schedule} from "../sections/Schedule";
import {TimerControl} from "../sections/TimerControl";

const Overview = () => {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
	return (
		<Stack
			direction={{xs: "column", md: "row"}}
			spacing={1}
			sx={{minHeight: "100vh"}}
		>
			<Box sx={{flex: 1, minWidth: 0}}>
				<TimerControl />
			</Box>
			{isDesktop && (
				<Divider
					orientation='vertical'
					flexItem
				/>
			)}
			<Box sx={{flex: 1, minWidth: 0}}>
				<Schedule />
			</Box>
			{isDesktop && (
				<Divider
					orientation='vertical'
					flexItem
				/>
			)}
			<Box sx={{flex: 1, minWidth: 0}}>
				<CameraControl />
				<Divider />
				<AdImageControl />
			</Box>
		</Stack>
	);
};

renderDashboard(<Overview />);
