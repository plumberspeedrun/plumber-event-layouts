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

const SCREEN_W = 576;
const SCREEN_H = 432;
const GAP_Y = 16;
const NAMEPLATE_H = 48;
const NAMEPLATE_GAP = 0;
const ROW_H = SCREEN_H + NAMEPLATE_GAP + NAMEPLATE_H;
const MARGIN_SIDE = 130;
const FOOTER_H = 50;

const LEFT_X = MARGIN_SIDE;
const RIGHT_X = 1920 - MARGIN_SIDE - SCREEN_W;
const TOP_Y = (1080 - FOOTER_H - ROW_H * 2 - GAP_Y) / 2;

const screenPositions = [
	{x: LEFT_X, y: TOP_Y},
	{x: RIGHT_X, y: TOP_Y},
	{x: LEFT_X, y: TOP_Y + ROW_H + GAP_Y},
	{x: RIGHT_X, y: TOP_Y + ROW_H + GAP_Y},
];

const clipPath = `path(evenodd, "${[
	`M0 0 H1920 V1080 H0 Z`,
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

const LOGO_W = 400;
const LOGO_X = (1920 - LOGO_W) / 2;
const LOGO_Y = 60;

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
			{visibleFeeds[0] && (
				<CameraFeed
					url={visibleFeeds[0].url}
					style={{
						position: "absolute",
						left: 718,
						top: 300,
						width: 480,
						height: 270,
					}}
				/>
			)}
			<Logo
				width={LOGO_W}
				x={LOGO_X}
				y={LOGO_Y}
			/>
			<GameInfo
				fontSize={40}
				style={{
					position: "absolute",
					top: 600,
					left: 0,
					width: "1920px",
				}}
			/>
			{commentators.length > 0 && (
				<div
					style={{
						position: "absolute",
						top: 700,
						left: 0,
						width: "1920px",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
					}}
				>
					{commentators.map((commentator) => (
						<Commentator
							key={commentator.name}
							commentator={commentator}
							slideIndex={slideIndex}
							style={{
								width: 460,
								height: 42,
								fontSize: 26,
							}}
						/>
					))}
				</div>
			)}
			<TimerAndEstimate
				fontSize={84}
				style={{
					position: "absolute",
					top: 800,
					left: 0,
					width: "1920px",
				}}
			/>
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
						}}
					/>
				);
			})}
		</BaseLayout>
	);
};

render(<App />);
