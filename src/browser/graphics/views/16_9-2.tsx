import type {CSSProperties} from "react";
import type {RunDataCommentator} from "../../../types/schedule";
import commentatorIcon from "../../assets/icons/commentator.svg";
import {useActiveRun, useBackgroundAsset, useCameraVisible} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {AdImageOverlay} from "../components/AdImageOverlay";
import {CameraOffIcon} from "../components/CameraOffIcon";
import {GameInfo} from "../components/GameInfo";
import {Logo} from "../components/Logo";
import {
	getPlayerDisplayItems,
	Nameplate,
	type NameplateDisplayItem,
	useNameplateCycle,
} from "../components/Nameplate";
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";
import {getSnsItems} from "../utils/social";

// ゲーム表示帯: 横幅いっぱい、画面全体の約60%の高さを確保する。
const BAND_TOP = 20;
const BAND_H = 648;

// 各画面は16:9を維持したまま帯の中で中央寄せ（レターボックス）する。
const SCREEN_W = 928;
const SCREEN_H = 522;
const SCREEN_GAP_X = 20;
const NAMEPLATE_H = 48;
const NAMEPLATE_GAP = 0;
const UNIT_H = SCREEN_H + NAMEPLATE_GAP + NAMEPLATE_H;
const SCREEN_Y = BAND_TOP + (BAND_H - UNIT_H) / 2;

const LEFT_X = 22;
const RIGHT_X = LEFT_X + SCREEN_W + SCREEN_GAP_X;

const CAMERA_X = 15;
const CAMERA_Y = 760;
const CAMERA_W = 464;
const CAMERA_H = 261;

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

// 下部情報帯: ロゴ・コメンテーター・ゲーム情報・タイマーを1つの帯に集約する。
const BAR_X = 500;
const BAR_Y = 839;
const BAR_W = 1398;
const BAR_H = 176;
const LOGO_H = 128;
const LOGO_COLUMN_W = 260;

const screenPositions = [
	{x: LEFT_X, y: SCREEN_Y},
	{x: RIGHT_X, y: SCREEN_Y},
];

const getCommentatorItems = (
	commentator: RunDataCommentator,
): NameplateDisplayItem[] => [
	{type: "name", value: commentator.name},
	...getSnsItems(commentator.social).map(
		(item): NameplateDisplayItem => ({type: "sns", ...item}),
	),
];

const App = () => {
	const backgroundAsset = useBackgroundAsset();
	const [cameraVisible] = useCameraVisible();
	const activeRun = useActiveRun();

	const players = activeRun?.teams.flatMap((t) => t.players) ?? [];
	const commentators = activeRun?.commentators ?? [];
	const playerItems = players.map(getPlayerDisplayItems);
	const maxSlides = Math.max(...playerItems.map((items) => items.length), 1);
	const slideIndex = useNameplateCycle(maxSlides);

	const commentatorItems = commentators.map(getCommentatorItems);
	const maxCommentatorSlides = Math.max(
		...commentatorItems.map((items) => items.length),
		1,
	);
	const commentatorSlideIndex = useNameplateCycle(maxCommentatorSlides);

	const cameraOn = cameraVisible !== false;
	const screenHoles = screenPositions.map(({x, y}) => ({
		x,
		y,
		w: SCREEN_W,
		h: SCREEN_H,
	}));
	const overlayStyle: CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "1920px",
		height: "1080px",
		clipPath: buildClipPath([
			...screenHoles,
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
			{!cameraOn && <CameraOffIcon {...CAMERA_RECT} />}
			<Logo
				height={LOGO_H}
				x={BAR_X + 16}
				y={BAR_Y + (BAR_H - LOGO_H) / 2}
			/>
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
					paddingLeft: LOGO_COLUMN_W,
					display: "grid",
					gridTemplateColumns: "300px 3px 1fr 3px 320px",
					alignItems: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: 6,
						height: "100%",
						boxSizing: "border-box",
						padding: "16px 20px",
					}}
				>
					{commentators.map((commentator, i) => (
						<Nameplate
							key={commentator.name}
							items={commentatorItems[i] ?? []}
							slideIndex={commentatorSlideIndex}
							nameIcon={commentatorIcon}
							nameIconAlt='commentator'
							style={{
								height: 48,
								fontSize: 24,
								backgroundColor: "transparent",
							}}
						/>
					))}
				</div>
				<div
					style={{
						width: 3,
						height: 145,
						backgroundColor: "white",
					}}
				/>
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
