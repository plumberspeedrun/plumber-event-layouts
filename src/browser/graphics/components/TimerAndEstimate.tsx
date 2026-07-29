import type {CSSProperties} from "react";
import {useActiveRun, useTimer} from "../../hooks";
import {formatTime} from "../../utils/formatTime";
import "@fontsource-variable/inconsolata/wght.css";
import "@fontsource-variable/inter/wght.css";
import "../styles/index.scss";

interface TimerProps {
	fontSize?: number;
	style?: CSSProperties;
	showEstimateDivider?: boolean;
	estimateFontSize?: number;
	estimateMarginTop?: number;
}

const timerBaseStyle: CSSProperties = {
	fontFamily: '"Inter Variable"',
	fontWeight: 800,
	// fontVariantNumeric: "tabular-nums",
	lineHeight: 1,
	textAlign: "center",
};

const stateColor: Record<string, string> = {
	running: "#4ade80",
	finished: "gold",
	paused: "#facc15",
	stopped: "#ffffff",
};

export const TimerAndEstimate = ({
	fontSize = 200,
	style,
	showEstimateDivider = true,
	estimateFontSize = 28,
	estimateMarginTop = showEstimateDivider ? 8 : 12,
}: TimerProps) => {
	const timer = useTimer();
	const activeRun = useActiveRun();
	if (!timer) return null;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				...style,
			}}
		>
			<div
				style={{
					...timerBaseStyle,
					position: "relative",
					display: "inline-block",
					fontSize,
				}}
			>
				<span
					// className='text-outline-black'
					style={{
						color: stateColor[timer.state] ?? "#ffffff",
					}}
				>
					{formatTime(timer.time)}
				</span>
			</div>
			{activeRun?.estimate && (
				<>
					{showEstimateDivider && (
						<div
							style={{
								width: 400,
								height: 3,
								backgroundColor: "white",
								margin: "12px 0",
								borderRadius: 2,
							}}
						/>
					)}
					<div
						style={{
							fontFamily: '"Inter Variable", "M PLUS 1p"',
							fontWeight: 700,
							fontSize: estimateFontSize,
							color: "white",
							marginTop: estimateMarginTop,
						}}
					>
						予定タイム: {activeRun.estimate}
					</div>
				</>
			)}
		</div>
	);
};
