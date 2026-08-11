import type {CSSProperties} from "react";
import {useBackgroundAsset, useCameraVisible, useNsmb} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {AdImageOverlay} from "../components/AdImageOverlay";
import {CameraOffIcon} from "../components/CameraOffIcon";
import {
	Commentator,
	getCommentatorDisplayItems,
} from "../components/Commentator";
import {GameInfo} from "../components/GameInfo";
import {Logo} from "../components/Logo";
import {
	getPlayerDisplayItems,
	Nameplate,
	useNameplateCycle,
} from "../components/Nameplate";
import {RelayProgress} from "../components/RelayProgress";
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";

const SCREEN_X = 697;
const SCREEN_Y = 25;
const SCREEN_W = 1046;
const SCREEN_H = 784;

const CAMERA_X = 15;
const CAMERA_Y = 737;
const CAMERA_W = 495;
const CAMERA_H = 278;

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

const SCREEN_RECT = {x: SCREEN_X, y: SCREEN_Y, w: SCREEN_W, h: SCREEN_H};

// リレー進行度を置くため、ネームプレートは 1 行の細型にして上に詰める。
const NAMEPLATE_X = 58;
const NAMEPLATE_W = 402;
const NAMEPLATE_H = 64;
const NAMEPLATE_GAP = 10;
const RUNNER_Y = 292;
const COMMENTATOR_Y = RUNNER_Y + NAMEPLATE_H + NAMEPLATE_GAP;

// 進行度はゲーム名を 1 行で収めたいので、カメラと同じ左端・幅にそろえて広く取る。
const PROGRESS_X = CAMERA_X;
const PROGRESS_W = CAMERA_W;
const PROGRESS_Y = 514;

const nameplateStyle: CSSProperties = {
	position: "absolute",
	left: NAMEPLATE_X,
	width: NAMEPLATE_W,
	height: NAMEPLATE_H,
	boxSizing: "border-box",
	backgroundColor: "rgba(0, 0, 0, 0.5)",
	borderRadius: 16,
	padding: "0 18px",
	fontSize: 30,
};

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();
	const nsmb = useNsmb();

	const relayData = nsmb?.relayData ?? [];
	const activeIndex = nsmb?.activeIndex ?? 0;
	const activeRelay = relayData[activeIndex];
	const commentators = activeRelay?.commentators ?? [];

	const runnerItems = activeRelay
		? getPlayerDisplayItems(activeRelay.runner)
		: [];
	const runnerSlideIndex = useNameplateCycle(Math.max(runnerItems.length, 1));

	const commentatorItems = commentators.map(getCommentatorDisplayItems);
	const commentatorSlideIndex = useNameplateCycle(
		Math.max(...commentatorItems.map((items) => items.length), 1),
	);

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
			{runnerItems.length > 0 && (
				<Nameplate
					items={runnerItems}
					slideIndex={runnerSlideIndex}
					style={{...nameplateStyle, top: RUNNER_Y}}
				/>
			)}
			{commentators.map((commentator, i) => (
				<Commentator
					key={commentator.name}
					commentator={commentator}
					slideIndex={commentatorSlideIndex}
					style={{
						...nameplateStyle,
						top: COMMENTATOR_Y + i * (NAMEPLATE_H + NAMEPLATE_GAP),
					}}
				/>
			))}
			<RelayProgress
				games={relayData.map((relay) => relay.game)}
				activeIndex={activeIndex}
				rowHeight={40}
				fontSize={24}
				style={{
					position: "absolute",
					left: PROGRESS_X,
					top: PROGRESS_Y,
					width: PROGRESS_W,
					padding: "8px 14px",
				}}
			/>
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<div
				style={{
					position: "absolute",
					left: 530,
					top: 839,
					width: 1380,
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
