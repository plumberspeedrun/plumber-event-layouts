import {
	useBackgroundAsset,
	useCameraVisible,
	useSpotifyPlayback,
} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {AdImageOverlay} from "../components/AdImageOverlay";
import {CameraOffIcon} from "../components/CameraOffIcon";
import {Logo} from "../components/Logo";
import {NowPlaying} from "../components/NowPlaying";
import {ScheduleList} from "../components/ScheduleList";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";

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

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();
	const playback = useSpotifyPlayback();

	const cameraOn = cameraVisible !== false;

	const nowPlayingTrack = playback?.track
		? {
				name: [playback.track.artists?.join(", "), playback.track.name]
					.filter(Boolean)
					.join(" - "),
			}
		: null;

	if (!backgroundAsset) {
		return <div>レイアウト画像をアセットにアップロードしてください。</div>;
	}

	return (
		<BaseLayout
			backgroundUrl={backgroundAsset.url}
			backgroundClipPath={buildClipPath(cameraOn ? [CAMERA_RECT] : [])}
		>
			<Logo
				width={LOGO_W}
				x={LOGO_X}
				y={LOGO_Y}
			/>
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<NowPlaying
				track={nowPlayingTrack}
				isPlaying={playback?.isPlaying}
				progressMs={playback?.progressMs}
				showArtwork={false}
				showProgress={false}
				showStatusDot={false}
				transparent
				icon={<span aria-hidden='true'>♪</span>}
				style={{
					position: "absolute",
					left: PANEL_SIZE.left,
					top: 965,
					width: PANEL_SIZE.width,
					borderRadius: 0,
					borderBottom: "3px solid rgba(255, 255, 255, 0.6)",
					padding: "12px 16px 7px 16px",
				}}
			/>
			<ScheduleList />
			<AdImageOverlay />
		</BaseLayout>
	);
};

render(<App />);
