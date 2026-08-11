import type {CSSProperties} from "react";
import {useActiveRun, useBackgroundAsset, useCameraVisible} from "../../hooks";
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
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";

// ゲーム画面を可能な限り拡大し、左右余白を最小化する（4:3厳密比）。
const SCREEN_W = 940;
const SCREEN_H = 705;
const SCREEN_GAP_X = 20;
const NAMEPLATE_H = 48;
const NAMEPLATE_GAP = 0;
const SCREEN_Y = 15;

// 2画面を中央寄せ配置（左右余白 各10px）。
const LEFT_X = 10;
const RIGHT_X = LEFT_X + SCREEN_W + SCREEN_GAP_X;

// 会場カメラ2つを左右のゲーム画面の下（clipPath の左下・右下）に配置する（16:9）。
// 左右のマージンはゲーム画面の画面端との距離（LEFT_X = 10px）にそろえる。
const CAMERA_Y = 783;
const CAMERA_W = 427;
const CAMERA_H = 240;
const LEFT_CAMERA_X = LEFT_X;
const RIGHT_CAMERA_X = 1920 - LEFT_X - CAMERA_W;

const LEFT_CAMERA_RECT = {
	x: LEFT_CAMERA_X,
	y: CAMERA_Y,
	w: CAMERA_W,
	h: CAMERA_H,
};
const RIGHT_CAMERA_RECT = {
	x: RIGHT_CAMERA_X,
	y: CAMERA_Y,
	w: CAMERA_W,
	h: CAMERA_H,
};

// 下部情報帯: ゲーム情報・タイマーをカメラ2つの間の中央に集約する。ロゴは帯の左側に配置する。
const BAR_X = 717;
const BAR_Y = 847;
const BAR_W = 746;
const BAR_H = 176;
const LOGO_H = 128;
const LOGO_COLUMN_W = 260;
const TIMER_COLUMN_W = 320;

// 解説者名を情報表示コンテナと同位置・同幅の固定サイズで、その直上に表示する。
// （ID の長さで幅が変わらないように幅は固定。現状は先頭の 1 名のみ表示。）
// 高さは 48px を基準に上下 5px ずつ拡張して視認性を確保する。
const COMMENTATOR_X = BAR_X;
const COMMENTATOR_W = BAR_W;
const COMMENTATOR_H = 48 + 10;
const COMMENTATOR_Y = SCREEN_Y + SCREEN_H + NAMEPLATE_H + 16 - 5;

const screenPositions = [
	{x: LEFT_X, y: SCREEN_Y},
	{x: RIGHT_X, y: SCREEN_Y},
];

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();
	const activeRun = useActiveRun();

	const players = activeRun?.teams.flatMap((t) => t.players) ?? [];
	const playerItems = players.map(getPlayerDisplayItems);
	const maxSlides = Math.max(...playerItems.map((items) => items.length), 1);
	const slideIndex = useNameplateCycle(maxSlides);

	const commentator = activeRun?.commentators?.[0];
	const commentatorItems = commentator
		? getCommentatorDisplayItems(commentator)
		: [];
	const maxCommentatorSlides = Math.max(commentatorItems.length, 1);
	const commentatorSlideIndex = useNameplateCycle(maxCommentatorSlides);

	const cameraOn = cameraVisible !== false;
	const screenHoles = screenPositions.map(({x, y}) => ({
		x,
		y,
		w: SCREEN_W,
		h: SCREEN_H,
	}));
	const cameraRects = cameraOn ? [LEFT_CAMERA_RECT, RIGHT_CAMERA_RECT] : [];
	const overlayStyle: CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "1920px",
		height: "1080px",
		clipPath: buildClipPath([...screenHoles, ...cameraRects]),
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
			{!cameraOn && <CameraOffIcon {...LEFT_CAMERA_RECT} />}
			{!cameraOn && <CameraOffIcon {...RIGHT_CAMERA_RECT} />}
			<Logo
				height={LOGO_H}
				x={BAR_X - LOGO_COLUMN_W}
				y={CAMERA_Y + (CAMERA_H - LOGO_H) / 2}
			/>
			{commentator && (
				<Commentator
					key={commentator.name}
					commentator={commentator}
					slideIndex={commentatorSlideIndex}
					style={{
						position: "absolute",
						left: COMMENTATOR_X,
						top: COMMENTATOR_Y,
						width: COMMENTATOR_W,
						height: COMMENTATOR_H,
						fontSize: 32,
						padding: "0 18px",
						boxSizing: "border-box",
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						borderRadius: 16,
					}}
				/>
			)}
			<div
				style={{
					position: "absolute",
					left: BAR_X,
					top: BAR_Y,
					width: BAR_W,
					height: BAR_H,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					borderRadius: 24,
					boxSizing: "border-box",
					display: "grid",
					gridTemplateColumns: `1fr 3px ${TIMER_COLUMN_W}px`,
					alignItems: "center",
				}}
			>
				<GameInfo
					style={{justifySelf: "center"}}
					fontSize={38}
					subFontSize={28}
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
					fontSize={60}
					estimateFontSize={26}
					estimateMarginTop={0}
					showEstimateDivider={false}
					style={{justifySelf: "center"}}
				/>
			</div>
			{screenPositions.map((pos, i) => {
				const player = players[i];
				if (!player) return null;
				const playerResult = activeRun?.result?.[player.teamId];
				return (
					<Nameplate
						key={player.id}
						items={playerItems[i] ?? []}
						slideIndex={slideIndex}
						result={playerResult}
						style={{
							position: "absolute",
							left: pos.x,
							top: pos.y + SCREEN_H + NAMEPLATE_GAP,
							width: SCREEN_W,
							height: NAMEPLATE_H,
							fontSize: 32,
							backgroundColor: "rgba(0, 0, 0, 0.5)",
						}}
					/>
				);
			})}
			<AdImageOverlay />
		</BaseLayout>
	);
};

render(<App />);
