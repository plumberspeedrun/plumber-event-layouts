import "@fontsource/m-plus-1p/900.css";
import type {CSSProperties} from "react";
import {useActiveRunId, useRunDataArray} from "../../hooks";

const containerStyle: CSSProperties = {
	position: "absolute",
	left: 810,
	top: 20,
	width: 1080,
	bottom: 70,
	boxSizing: "border-box",
	padding: "20px 0 20px 28px",
	fontFamily: '"M PLUS 1p"',
	fontWeight: 900,
	color: "white",
	overflow: "hidden",
};

const headerStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	marginBottom: 16,
	borderBottom: "3px solid rgba(255, 255, 255, 0.6)",
	paddingBottom: 10,
};

const titleStyle: CSSProperties = {
	fontSize: 44,
};

const rowStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 16,
	padding: "10px 16px",
	background: "rgba(45, 85, 115, 0.65)",
	marginBottom: 6,
	fontSize: 26,
	color: "white",
};

const timeStyle: CSSProperties = {
	width: 90,
	textAlign: "center",
	fontSize: 30,
	flexShrink: 0,
	fontVariantNumeric: "tabular-nums",
	color: "white",
};

const gameStyle: CSSProperties = {
	flex: 1,
	fontSize: 32,
	display: "flex",
	flexDirection: "column",
};

const gameTitleRowStyle: CSSProperties = {
	display: "flex",
	alignItems: "baseline",
	gap: 12,
};

const hyphenStyle: CSSProperties = {
	color: "white",
};

const categoryStyle: CSSProperties = {
	fontSize: 24,
	color: "white",
};

const runnerStyle: CSSProperties = {
	fontSize: 24,
	color: "white",
};

export const ScheduleList = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();

	const runs = runDataArray ?? [];
	const activeIndex =
		activeRunId != null ? runs.findIndex((run) => run.id === activeRunId) : -1;
	const upcoming = activeIndex >= 0 ? runs.slice(activeIndex + 1) : runs;

	return (
		<div style={containerStyle}>
			<div style={headerStyle}>
				<div style={titleStyle}>イベントスケジュール</div>
			</div>
			{upcoming.map((runData) => {
				const runners = runData.teams
					.map((t) => t.name ?? t.players.map((p) => p.name).join(", "))
					.join(", ");

				return (
					<div
						key={runData.id}
						style={rowStyle}
					>
						<div style={timeStyle}>
							{runData.scheduledStartTime
								? new Date(runData.scheduledStartTime).toLocaleTimeString(
										"ja-JP",
										{
											hour: "2-digit",
											minute: "2-digit",
										},
									)
								: "--:--"}
						</div>
						<div style={gameStyle}>
							<div style={gameTitleRowStyle}>
								<div>{runData.game}</div>
								{runData.category != null && (
									<>
										<div style={hyphenStyle}>-</div>
										<div style={categoryStyle}>{runData.category}</div>
									</>
								)}
							</div>
							<div style={runnerStyle}>{runners}</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};
