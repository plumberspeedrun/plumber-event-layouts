import type {CSSProperties} from "react";
import commentatorIcon from "../../assets/icons/commentator.svg";
import gamepadIcon from "../../assets/icons/gamepad.svg";
import {useActiveRun, useBackgroundAsset, useCameraFeeds} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {CameraFeed} from "../components/CameraFeed";
import {GameInfo} from "../components/GameInfo";
import {Logo} from "../components/Logo";
import {NameplateCard} from "../components/NameplateCard";
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {getSnsItems} from "../utils/social";

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

const NAMEPLATE_X = 44;
const NAMEPLATE_W = 320;
const NAMEPLATE_H = 100;

const nameplateStyle: CSSProperties = {
	position: "absolute",
	left: NAMEPLATE_X,
	width: NAMEPLATE_W,
	height: NAMEPLATE_H,
	boxSizing: "border-box",
	alignItems: "flex-start",
	padding: "6px 8px 6px 18px",
};

const hole = (x: number, y: number, w: number, h: number) =>
	`M${x} ${y} H${x + w} V${y + h} H${x} Z`;

const clipPath = `path(evenodd, "M0 0 H1920 V1080 H0 Z ${hole(MAIN_SCREEN_X, MAIN_SCREEN_Y, MAIN_SCREEN_W, MAIN_SCREEN_H)} ${hole(SUB_SCREEN_X, SUB_SCREEN_Y, SUB_SCREEN_W, SUB_SCREEN_H)}")`;

const overlayStyle: CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	width: "1920px",
	height: "1080px",
	clipPath,
};

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [feeds] = useCameraFeeds();
	const activeRun = useActiveRun();

	const players = activeRun?.teams.flatMap((t) => t.players) ?? [];
	const commentators = activeRun?.commentators ?? [];
	const visibleFeeds = (feeds ?? []).filter((f) => f.visible);

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
			{players[0] && (
				<NameplateCard
					name={players[0].name}
					snsItems={getSnsItems(players[0].social)}
					icon={gamepadIcon}
					iconAlt='runner'
					fontSize={28}
					iconSize={40}
					iconStyle={{alignSelf: "center"}}
					style={{...nameplateStyle, top: 285}}
				/>
			)}
			{commentators.map((commentator, i) => (
				<NameplateCard
					key={commentator.name}
					name={commentator.name}
					snsItems={getSnsItems(commentator.social)}
					icon={commentatorIcon}
					iconAlt='commentator'
					fontSize={28}
					iconSize={40}
					iconStyle={{alignSelf: "center"}}
					style={{...nameplateStyle, top: 420 + i * 110}}
				/>
			))}
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
					}}
				/>
			)}
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
		</BaseLayout>
	);
};

render(<App />);
