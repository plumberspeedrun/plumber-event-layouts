import type {CSSProperties} from "react";
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
	useNameplateCycle,
} from "../components/Nameplate";
import {NameplateCard} from "../components/NameplateCard";
import {TimerAndEstimate} from "../components/TimerAndEstimate";
import "../styles/index.scss";
import {buildClipPath} from "../utils/clipPath";
import {getSnsItems} from "../utils/social";

const SCREEN_W = 520;
const SCREEN_H = 390;
const SCREEN_GAP_X = 100;
const SCREEN_GAP_Y = 10;
const NAMEPLATE_H = 48;
const NAMEPLATE_GAP = 0;
const ROW_H = SCREEN_H + NAMEPLATE_GAP + NAMEPLATE_H;

const SCREEN_RIGHT = 1743;
const LEFT_X = SCREEN_RIGHT - SCREEN_W * 2 - SCREEN_GAP_X;
const RIGHT_X = SCREEN_RIGHT - SCREEN_W;
const TOP_Y = 4;

const CAMERA_X = 15;
const CAMERA_Y = 737;
const CAMERA_W = 495;
const CAMERA_H = 278;

const CAMERA_RECT = {x: CAMERA_X, y: CAMERA_Y, w: CAMERA_W, h: CAMERA_H};

const screenPositions = [
	{x: LEFT_X, y: TOP_Y},
	{x: RIGHT_X, y: TOP_Y},
	{x: LEFT_X, y: TOP_Y + ROW_H + SCREEN_GAP_Y},
	{x: RIGHT_X, y: TOP_Y + ROW_H + SCREEN_GAP_Y},
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
			<Logo
				width={440}
				x={30}
				y={20}
			/>
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
						left: 58,
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
					left: 530,
					top: 895,
					width: 1380,
					height: 125,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					borderRadius: 24,
					boxSizing: "border-box",
					display: "grid",
					gridTemplateColumns: "2.14fr 3px 1fr",
					alignItems: "center",
				}}
			>
				<GameInfo
					style={{
						width: 895,
						height: "100%",
						justifySelf: "center",
						justifyContent: "center",
					}}
					fontSize={48}
					subFontSize={36}
					metadataSeparator=' - '
					systemYearSeparator=' '
				/>
				<div
					style={{
						width: 3,
						height: "calc(100% - 20px)",
						backgroundColor: "white",
					}}
				/>
				<TimerAndEstimate
					fontSize={72}
					estimateFontSize={32}
					estimateMarginTop={0}
					showEstimateDivider={false}
					style={{
						width: 380,
						height: "100%",
						justifySelf: "center",
						justifyContent: "center",
					}}
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
