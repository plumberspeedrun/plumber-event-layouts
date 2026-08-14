import {useBackgroundAsset, useCameraVisible} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {AdImageOverlay} from "../components/AdImageOverlay";
import {CameraOffIcon} from "../components/CameraOffIcon";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";

// Footer（高さ50px）を除いた領域（縦1030px）に16:9のカメラを配置する。
// 上下marginは10pxとし、カメラは水平中央寄せにする。
const FOOTER_HEIGHT = 50;
const CAMERA_MARGIN = 10;
const CAMERA_H = 1080 - FOOTER_HEIGHT - CAMERA_MARGIN * 2;
const CAMERA_W = Math.round((CAMERA_H * 16) / 9);
const CAMERA_X = Math.round((1920 - CAMERA_W) / 2);
const CAMERA_Y = CAMERA_MARGIN;

const CAMERA_RECT = {
	x: CAMERA_X,
	y: CAMERA_Y,
	w: CAMERA_W,
	h: CAMERA_H,
};

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();

	const cameraOn = cameraVisible !== false;

	if (!backgroundAsset) {
		return <div>レイアウト画像をアセットにアップロードしてください。</div>;
	}

	return (
		<BaseLayout
			backgroundUrl={backgroundAsset.url}
			backgroundClipPath={buildClipPath(cameraOn ? [CAMERA_RECT] : [])}
		>
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<AdImageOverlay />
		</BaseLayout>
	);
};

render(<App />);
