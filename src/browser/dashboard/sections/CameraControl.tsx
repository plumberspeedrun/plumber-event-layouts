import {Stack, Switch, Typography} from "@mui/material";
import {useCameraVisible} from "../../hooks";
import {Panel} from "../components";

export const CameraControl = () => {
	const [visible, setVisible] = useCameraVisible();

	return (
		<Panel>
			<Stack
				direction='row'
				sx={{justifyContent: "space-between", alignItems: "center"}}
			>
				<Typography variant='h6'>カメラ</Typography>
				<Switch
					checked={visible ?? true}
					onChange={(e) => setVisible(e.target.checked)}
				/>
			</Stack>
			<Typography
				color='text.secondary'
				sx={{fontSize: 12}}
			>
				ON: カメラ領域を透過（OBS下層にカメラソース配置） / OFF:
				カメラオフアイコンを表示
			</Typography>
		</Panel>
	);
};
