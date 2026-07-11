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

const SCREEN_W = 1024;
const SCREEN_H = 768;
const NAMEPLATE_H = 48;
const FOOTER_H = 50;
const MARGIN_RIGHT = 40;

const SCREEN_X = 1920 - MARGIN_RIGHT - SCREEN_W;
const SCREEN_Y = (1080 - FOOTER_H - (SCREEN_H + NAMEPLATE_H)) / 2;

const clipPath = `path(evenodd, "M0 0 H1920 V1080 H0 Z M${SCREEN_X} ${SCREEN_Y} H${SCREEN_X + SCREEN_W} V${SCREEN_Y + SCREEN_H} H${SCREEN_X} Z")`;

const overlayStyle: CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	width: "1920px",
	height: "1080px",
	clipPath,
};

const INFO_CENTER_X = SCREEN_X / 2;

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
				width={320}
				x={INFO_CENTER_X - 160}
				y={60}
			/>
			<GameInfo
				fontSize={32}
				style={{
					position: "absolute",
					top: 200,
					left: 0,
					width: `${SCREEN_X}px`,
				}}
			/>
			{commentators.length > 0 && (
				<div
					style={{
						position: "absolute",
						top: 310,
						left: 0,
						width: `${SCREEN_X}px`,
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
								width: 380,
								height: 40,
								fontSize: 24,
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
						left: INFO_CENTER_X - 190,
						top: 420,
						width: 380,
						height: 214,
					}}
				/>
			)}
			<TimerAndEstimate
				fontSize={64}
				style={{
					position: "absolute",
					top: 700,
					left: 0,
					width: `${SCREEN_X}px`,
				}}
			/>
			{players[0] && (
				<Nameplate
					items={playerItems[0] ?? []}
					slideIndex={slideIndex}
					result={activeRun?.result?.[players[0].teamId]}
					style={{
						position: "absolute",
						left: SCREEN_X,
						top: SCREEN_Y + SCREEN_H,
						width: SCREEN_W,
						height: NAMEPLATE_H,
						fontSize: 32,
					}}
				/>
			)}
		</BaseLayout>
	);
};

render(<App />);
