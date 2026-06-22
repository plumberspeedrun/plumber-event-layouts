import "@fontsource/m-plus-1p/900.css";
import {useActiveRunId, useRunDataArray} from "../hooks";

const containerStyle: React.CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	width: 1920,
	height: 1080,
	background: "#1a1a2e",
	display: "flex",
	flexDirection: "column",
	padding: "40px 60px",
	fontFamily: '"M PLUS 1p"',
	fontWeight: 900,
	color: "white",
	overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
	fontSize: 36,
	marginBottom: 20,
	borderBottom: "3px solid #e94560",
	paddingBottom: 10,
};

const rowStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 16,
	padding: "10px 16px",
	borderRadius: 8,
	background: "#16213e",
	marginBottom: 6,
	fontSize: 22,
};

const activeRowStyle: React.CSSProperties = {
	...rowStyle,
	background: "#e94560",
};

const timeStyle: React.CSSProperties = {
	width: 80,
	textAlign: "center",
	fontSize: 24,
	flexShrink: 0,
};

const gameStyle: React.CSSProperties = {
	flex: 1,
	fontSize: 24,
};

const detailStyle: React.CSSProperties = {
	fontSize: 18,
	color: "#a0a0c0",
	flex: 1,
};

const estimateStyle: React.CSSProperties = {
	width: 100,
	textAlign: "right",
	fontSize: 20,
	flexShrink: 0,
};

export const ScheduleList = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();

	return (
		<div style={containerStyle}>
			<div style={headerStyle}>Schedule</div>
			{runDataArray?.map((runData) => {
				const isActive = runData.id === activeRunId;
				const runners = runData.teams
					.flatMap((t) => t.players.map((p) => p.name))
					.join(", ");

				return (
					<div
						key={runData.id}
						style={isActive ? activeRowStyle : rowStyle}
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
							{runData.game}
							{runData.category ? ` - ${runData.category}` : ""}
						</div>
						<div
							style={{
								...detailStyle,
								...(isActive && {color: "#f0d0d8"}),
							}}
						>
							{runners}
						</div>
						<div style={estimateStyle}>{runData.estimate}</div>
					</div>
				);
			})}
		</div>
	);
};
