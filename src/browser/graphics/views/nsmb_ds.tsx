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

// 2 画面ぶんの領域を確保するため、左カラムを 390px まで狭めている。
const SCREEN_LEFT = 410;
const SCREEN_RIGHT = 1910;
const SCREEN_BOTTOM = 809;

// DS は上下とも 256x192 (4:3)。上画面を高さいっぱいまで拡大し、下画面をその右下に
// 隙間なく並べて、双方の下辺を SCREEN_BOTTOM に揃える。
const MAIN_SCREEN_W = 1044;
const MAIN_SCREEN_H = 783;
const MAIN_SCREEN_X = SCREEN_LEFT;
const MAIN_SCREEN_Y = SCREEN_BOTTOM - MAIN_SCREEN_H;

const SUB_SCREEN_X = MAIN_SCREEN_X + MAIN_SCREEN_W;
const SUB_SCREEN_W = SCREEN_RIGHT - SUB_SCREEN_X;
const SUB_SCREEN_H = (SUB_SCREEN_W * 3) / 4;
const SUB_SCREEN_Y = SCREEN_BOTTOM - SUB_SCREEN_H;

const CAMERA_X = 12;
const CAMERA_W = 368;
const CAMERA_H = 207;
const CAMERA_Y = 1015 - CAMERA_H;

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

const MAIN_SCREEN_RECT = {
	x: MAIN_SCREEN_X,
	y: MAIN_SCREEN_Y,
	w: MAIN_SCREEN_W,
	h: MAIN_SCREEN_H,
};

const SUB_SCREEN_RECT = {
	x: SUB_SCREEN_X,
	y: SUB_SCREEN_Y,
	w: SUB_SCREEN_W,
	h: SUB_SCREEN_H,
};

// リレー進行度を置くため、ネームプレートは 1 行の細型にして上に詰める。
const NAMEPLATE_X = 44;
const NAMEPLATE_W = 320;
const NAMEPLATE_H = 56;
const NAMEPLATE_GAP = 10;
const RUNNER_Y = 285;
const COMMENTATOR_Y = RUNNER_Y + NAMEPLATE_H + NAMEPLATE_GAP;

// 進行度はゲーム名を 1 行で収めたいので、左カラムの幅いっぱいまで広く取る。
const PROGRESS_X = CAMERA_X;
const PROGRESS_W = 386;
const PROGRESS_Y = 540;

const nameplateStyle: CSSProperties = {
	position: "absolute",
	left: NAMEPLATE_X,
	width: NAMEPLATE_W,
	height: NAMEPLATE_H,
	boxSizing: "border-box",
	backgroundColor: "rgba(0, 0, 0, 0.5)",
	borderRadius: 16,
	padding: "0 14px",
	fontSize: 26,
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
		clipPath: buildClipPath([
			MAIN_SCREEN_RECT,
			SUB_SCREEN_RECT,
			...(cameraOn ? [CAMERA_RECT] : []),
		]),
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
				width={340}
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
				rowHeight={38}
				fontSize={18}
				style={{
					position: "absolute",
					left: PROGRESS_X,
					top: PROGRESS_Y,
					width: PROGRESS_W,
					padding: "8px 12px",
				}}
			/>
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<div
				style={{
					position: "absolute",
					left: SCREEN_LEFT,
					top: 839,
					width: SCREEN_RIGHT - SCREEN_LEFT,
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
