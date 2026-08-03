import type {CSSProperties} from "react";

interface RelayProgressProps {
	/** リレーで走行するゲーム名を順番どおりに並べたもの。 */
	games: string[];
	/** 現在走行中の区間のインデックス。 */
	activeIndex: number;
	/** 1 区間ぶんの行の高さ。 */
	rowHeight?: number;
	/** ゲーム名の文字サイズ。 */
	fontSize?: number;
	style?: CSSProperties;
}

/** 走行済み・走行中区間のドット外周の色。 */
const YELLOW = "#facc15";
/** 走行中区間のドット中心の色。 */
const ACTIVE_CENTER_COLOR = "#ef4444";
/** 走行済み区間のドット中心の色。 */
const DONE_CENTER_COLOR = "#3b82f6";
/** 未走行区間の外周の色。 */
const PENDING_COLOR = "rgba(250, 204, 21, 0.4)";
/** 未走行区間のドット中心の色。 */
const PENDING_CENTER_COLOR = "#000000";

const RAIL_WIDTH = 30;
const LINE_WIDTH = 3;
const DOT_SIZE = 16;
const ACTIVE_DOT_SIZE = 22;

const containerStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	boxSizing: "border-box",
	backgroundColor: "rgba(0, 0, 0, 0.5)",
	borderRadius: 16,
	padding: "12px 16px",
	fontFamily: '"Inter Variable", "M PLUS 1p"',
	color: "white",
	overflow: "hidden",
};

const lineStyle: CSSProperties = {
	position: "absolute",
	left: RAIL_WIDTH / 2 - LINE_WIDTH / 2,
	width: LINE_WIDTH,
	height: "50%",
};

/** ドット中心の小さい円。光源を左上とし、ハイライトを起点にグラデーションを描く。 */
const CenterDot = ({color, size}: {color: string; size: number}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: "50%",
			background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${color} 69%, white) 0%, ${color} 65%, color-mix(in srgb, ${color} 75%, black) 100%)`,
		}}
	/>
);

/**
 * リレーの進行度を縦タイムラインで表示する。
 *
 * 走行済みの区間は中心が青の黄色いドット、走行中の区間は中心が赤の大きな黄色いドット、
 * 未走行の区間は中心が黒の淡いドットで示す。
 */
export const RelayProgress = ({
	games,
	activeIndex,
	rowHeight = 40,
	fontSize = 20,
	style,
}: RelayProgressProps) => {
	if (games.length === 0) return null;

	return (
		<div style={{...containerStyle, ...style}}>
			{games.map((game, i) => {
				const isDone = i < activeIndex;
				const isActive = i === activeIndex;
				const color = isDone || isActive ? YELLOW : PENDING_COLOR;
				const centerColor = isActive
					? ACTIVE_CENTER_COLOR
					: isDone
						? DONE_CENTER_COLOR
						: PENDING_CENTER_COLOR;
				const dotSize = isActive ? ACTIVE_DOT_SIZE : DOT_SIZE;

				return (
					<div
						key={game}
						style={{
							position: "relative",
							display: "flex",
							alignItems: "center",
							gap: 10,
							height: rowHeight,
						}}
					>
						<div
							style={{
								position: "relative",
								width: RAIL_WIDTH,
								height: "100%",
								flexShrink: 0,
							}}
						>
							{i > 0 && (
								<div
									style={{
										...lineStyle,
										top: 0,
										// 直前の区間を走り終えていれば済みの色でつなぐ。
										backgroundColor:
											isDone || isActive ? YELLOW : PENDING_COLOR,
									}}
								/>
							)}
							{i < games.length - 1 && (
								<div
									style={{
										...lineStyle,
										top: "50%",
										backgroundColor: isDone ? YELLOW : PENDING_COLOR,
									}}
								/>
							)}
							<div
								style={{
									position: "absolute",
									left: RAIL_WIDTH / 2 - dotSize / 2,
									top: `calc(50% - ${dotSize / 2}px)`,
									width: dotSize,
									height: dotSize,
									borderRadius: "50%",
									backgroundColor: color,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: isActive ? `0 0 12px ${centerColor}` : undefined,
								}}
							>
								<CenterDot
									color={centerColor}
									size={dotSize * 0.7}
								/>
							</div>
						</div>
						<div
							style={{
								flex: 1,
								minWidth: 0,
								fontSize,
								fontWeight: isActive ? 800 : 700,
								lineHeight: 1.15,
								color: isActive
									? "white"
									: isDone
										? "rgba(255, 255, 255, 0.7)"
										: "rgba(255, 255, 255, 0.5)",
								display: "-webkit-box",
								WebkitBoxOrient: "vertical",
								WebkitLineClamp: 2,
								overflow: "hidden",
								wordBreak: "break-word",
							}}
						>
							{game}
						</div>
					</div>
				);
			})}
		</div>
	);
};
