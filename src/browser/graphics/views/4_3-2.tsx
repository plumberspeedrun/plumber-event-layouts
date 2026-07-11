import {useReplicant} from "@nodecg/react-hooks";
import type {CSSProperties} from "react";
import type {Assets} from "../../../types/assets";
import {useActiveRun, useCameraFeeds} from "../../hooks";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {CameraFeed} from "../components/CameraFeed";
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

const SCREEN_W = 640;
const SCREEN_H = 480;
const GAP_X = 16;
const NAMEPLATE_H = 48;
const FOOTER_H = 50;
const MARGIN_RIGHT = 40;

const GRID_W = SCREEN_W * 2 + GAP_X;
const GRID_X = 1920 - MARGIN_RIGHT - GRID_W;
const SCREEN_Y = (1080 - FOOTER_H - (SCREEN_H + NAMEPLATE_H)) / 2;

const screenPositions = [
	{x: GRID_X, y: SCREEN_Y},
	{x: GRID_X + SCREEN_W + GAP_X, y: SCREEN_Y},
];

const clipPath = `path(evenodd, "${[
	"M0 0 H1920 V1080 H0 Z",
	...screenPositions.map(
		({x, y}) => `M${x} ${y} H${x + SCREEN_W} V${y + SCREEN_H} H${x} Z`,
	),
].join(" ")}")`;

const overlayStyle: CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	width: "1920px",
	height: "1080px",
	clipPath,
};

const INFO_CENTER_X = GRID_X / 2;

const App = () => {
	const [bgAsset] = useReplicant<Assets[]>("assets:background");
	const [feeds] = useCameraFeeds();
	const activeRun = useActiveRun();

	const players = activeRun?.teams.flatMap((t) => t.players) ?? [];
	const commentators = activeRun?.commentators ?? [];
	const playerItems = players.map(getPlayerDisplayItems);
	const commentatorItems = commentators.map(getCommentatorDisplayItems);
	const maxSlides = Math.max(
		...playerItems.map((items) => items.length),
		...commentatorItems.map((items) => items.length),
		1,
	);
	const slideIndex = useNameplateCycle(maxSlides);

	const visibleFeeds = (feeds ?? []).filter((f) => f.visible);

	if (!bgAsset || bgAsset.length === 0) {
		return <div>レイアウト画像をアセットにアップロードしてください。</div>;
	}

	return (
		<BaseLayout>
			<img
				src={bgAsset[0]?.url}
				alt=''
				style={overlayStyle}
			/>
			<Logo
				width={280}
				x={INFO_CENTER_X - 140}
				y={60}
			/>
			<GameInfo
				fontSize={28}
				style={{
					position: "absolute",
					top: 200,
					left: 0,
					width: `${GRID_X}px`,
				}}
			/>
			{commentators.length > 0 && (
				<div
					style={{
						position: "absolute",
						top: 300,
						left: 0,
						width: `${GRID_X}px`,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 8,
					}}
				>
					{commentators.map((commentator) => (
						<Commentator
							key={commentator.name}
							commentator={commentator}
							slideIndex={slideIndex}
							style={{
								width: 340,
								height: 38,
								fontSize: 22,
							}}
						/>
					))}
				</div>
			)}
			{visibleFeeds[0] && (
				<CameraFeed
					url={visibleFeeds[0].url}
					style={{
						position: "absolute",
						left: INFO_CENTER_X - 170,
						top: 410,
						width: 340,
						height: 191,
					}}
				/>
			)}
			<TimerAndEstimate
				fontSize={56}
				style={{
					position: "absolute",
					top: 660,
					left: 0,
					width: `${GRID_X}px`,
				}}
			/>
			{screenPositions.map((pos, i) => {
				const player = players[i];
				if (!player) return null;
				return (
					<Nameplate
						key={player.id}
						items={playerItems[i] ?? []}
						slideIndex={slideIndex}
						result={activeRun?.result?.[player.teamId]}
						style={{
							position: "absolute",
							left: pos.x,
							top: pos.y + SCREEN_H,
							width: SCREEN_W,
							height: NAMEPLATE_H,
							fontSize: 32,
						}}
					/>
				);
			})}
		</BaseLayout>
	);
};

render(<App />);
