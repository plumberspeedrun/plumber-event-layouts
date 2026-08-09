import {useBackgroundAsset, useCameraFeeds} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {CameraFeed} from "../components/CameraFeed";
import {Logo} from "../components/Logo";
import {ScheduleList} from "../components/ScheduleList";
import "../styles/index.scss";

const PANEL_SIZE = {
	left: 30,
	top: 20,
	width: 770,
	bottom: 70,
};

const CAMERA_W = PANEL_SIZE.width;
const CAMERA_H = Math.round((PANEL_SIZE.width * 9) / 16);
const CAMERA_Y_OFFSET = 70;

const LOGO_W = 700;
const LOGO_X = PANEL_SIZE.left + Math.round((PANEL_SIZE.width - LOGO_W) / 2);
const LOGO_Y = PANEL_SIZE.top + CAMERA_H + CAMERA_Y_OFFSET + 48;

const CAMERA_X = PANEL_SIZE.left;
const CAMERA_Y = PANEL_SIZE.top + CAMERA_Y_OFFSET;

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [feeds] = useCameraFeeds();

	const visibleFeeds = (feeds ?? []).filter((f) => f.visible);

	if (!backgroundAsset) {
		return <div>レイアウト画像をアセットにアップロードしてください。</div>;
	}

	return (
		<BaseLayout backgroundUrl={backgroundAsset.url}>
			<Logo
				width={LOGO_W}
				x={LOGO_X}
				y={LOGO_Y}
			/>
			{visibleFeeds[0] && (
				<CameraFeed
					url={visibleFeeds[0].url}
					framed={false}
					style={{
						position: "absolute",
						left: CAMERA_X,
						top: CAMERA_Y,
						width: CAMERA_W,
						height: CAMERA_H,
						borderRadius: 24,
					}}
				/>
			)}
			<ScheduleList />
		</BaseLayout>
	);
};

render(<App />);
