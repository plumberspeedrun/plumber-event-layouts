import type {CSSProperties} from "react";
import commentatorIcon from "../../assets/icons/commentator.svg";
import gamepadIcon from "../../assets/icons/gamepad.svg";
import {useActiveRun, useBackgroundAsset, useCameraVisible} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {AdImageOverlay} from "../components/AdImageOverlay";
import {CameraOffIcon} from "../components/CameraOffIcon";
import {GameInfo} from "../components/GameInfo";
import {Logo} from "../components/Logo";
import {NameplateCard} from "../components/NameplateCard";
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";
import {getSnsItems} from "../utils/social";

const SCREEN_X = 500;
const SCREEN_Y = 25;
const SCREEN_W = 1392;
const SCREEN_H = 783;

const CAMERA_X = 15;
const CAMERA_Y = 755;
const CAMERA_W = 464;
const CAMERA_H = 261;

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

const SCREEN_RECT = {x: SCREEN_X, y: SCREEN_Y, w: SCREEN_W, h: SCREEN_H};

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();
	const activeRun = useActiveRun();

	const players = activeRun?.teams.flatMap((t) => t.players) ?? [];
	const commentators = activeRun?.commentators ?? [];
	const cameraOn = cameraVisible !== false;
	const overlayStyle: CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "1920px",
		height: "1080px",
		clipPath: buildClipPath([SCREEN_RECT, ...(cameraOn ? [CAMERA_RECT] : [])]),
	};

	if (!backgroundAsset) {
		return <div>レイアウト画像をアセットにアップロードしてください。</div>;
	}

	return (
		<BaseLayout>
			<img
				src={backgroundAsset.url}
				alt=''
				style={overlayStyle}
			/>
			<Logo
				width={440}
				x={30}
				y={20}
			/>
			{players[0] && (
				<NameplateCard
					name={players[0].name}
					snsItems={getSnsItems(players[0].social)}
					icon={gamepadIcon}
					iconAlt='runner'
					fontSize={32}
					iconSize={48}
					iconStyle={{alignSelf: "center"}}
					style={{
						position: "absolute",
						left: 50,
						top: 297,
						width: 402,
						height: 120,
						boxSizing: "border-box",
						alignItems: "flex-start",
						padding: "8px 10px 8px 22px",
					}}
				/>
			)}
			{commentators.map((commentator, i) => (
				<NameplateCard
					key={commentator.name}
					name={commentator.name}
					snsItems={getSnsItems(commentator.social)}
					icon={commentatorIcon}
					iconAlt='commentator'
					fontSize={32}
					iconSize={48}
					iconStyle={{alignSelf: "center"}}
					style={{
						position: "absolute",
						left: 50,
						top: 456 + i * 130,
						width: 402,
						height: 120,
						boxSizing: "border-box",
						alignItems: "flex-start",
						padding: "8px 10px 8px 22px",
					}}
				/>
			))}
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<div
				style={{
					position: "absolute",
					left: 500,
					top: 839,
					width: 1394,
					height: 176,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					borderRadius: 24,
					boxSizing: "border-box",
					display: "grid",
					gridTemplateColumns: "2.14fr 3px 1fr",
					alignItems: "center",
				}}
			>
				<GameInfo
					style={{width: 895, justifySelf: "center"}}
					fontSize={48}
					subFontSize={36}
					metadataSeparator=' - '
					systemYearSeparator=' '
				/>
				<div
					style={{
						width: 3,
						height: 145,
						backgroundColor: "white",
					}}
				/>
				<TimerAndEstimate
					fontSize={72}
					estimateFontSize={32}
					estimateMarginTop={0}
					showEstimateDivider={false}
					style={{width: 380, justifySelf: "center"}}
				/>
			</div>
			<AdImageOverlay />
		</BaseLayout>
	);
};

render(<App />);
