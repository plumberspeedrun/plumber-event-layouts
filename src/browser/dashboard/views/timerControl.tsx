import {useActiveRun, useTimer} from "../../hooks";
import {render} from "../../render";

declare const nodecg: {
	sendMessage(name: string, cb?: (err: Error | null) => void): void;
	sendMessage(
		name: string,
		data: unknown,
		cb?: (err: Error | null) => void,
	): void;
};

const containerStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 8,
	background: "#2f3a4f",
	color: "#fff",
	padding: 12,
	fontFamily: "sans-serif",
	fontSize: 13,
};

const buttonStyle: React.CSSProperties = {
	background: "#475873",
	color: "#fff",
	border: "1px solid #5b6e8c",
	borderRadius: 4,
	padding: "4px 8px",
	cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 8,
	padding: 6,
	borderRadius: 4,
	background: "#3a4760",
};

const TimerControl = () => {
	const timer = useTimer();
	const activeRun = useActiveRun();

	const state = timer?.state;
	const canStart = state === "stopped" || state === "paused";
	const canPause = state === "running";
	const canStop = state === "running" || state === "paused";
	const canReset =
		state === "finished" || state === "paused" || state === "stopped";

	return (
		<div style={containerStyle}>
			<div>
				<div style={{fontSize: 24}}>{timer?.time ?? "00:00:00"}</div>
				<div>状態: {state ?? "unknown"}</div>
			</div>

			<div style={{display: "flex", gap: 8}}>
				<button
					style={buttonStyle}
					disabled={!canStart}
					onClick={() => nodecg.sendMessage("timerStart")}
				>
					開始/再開
				</button>
				<button
					style={buttonStyle}
					disabled={!canPause}
					onClick={() => nodecg.sendMessage("timerPause")}
				>
					一時停止
				</button>
				<button
					style={buttonStyle}
					disabled={!canStop}
					onClick={() => nodecg.sendMessage("timerStop")}
				>
					停止
				</button>
				<button
					style={buttonStyle}
					disabled={!canReset}
					onClick={() => nodecg.sendMessage("timerReset")}
				>
					リセット
				</button>
			</div>

			<div
				style={{
					borderTop: "1px solid #5b6e8c",
					paddingTop: 8,
				}}
			>
				<strong>
					現在の走行: {activeRun?.game ?? "(未設定)"} {activeRun?.category}
				</strong>
			</div>

			<div style={{display: "flex", flexDirection: "column", gap: 4}}>
				{activeRun?.teams.map((team) => {
					const result = activeRun.result?.[team.id];
					return (
						<div
							key={team.id}
							style={rowStyle}
						>
							<div style={{flex: 1}}>
								{team.name ?? team.players.map((p) => p.name).join(", ")}
							</div>
							{result != null ? (
								<div>
									{result.state} / {result.time}
								</div>
							) : (
								<>
									<button
										style={buttonStyle}
										onClick={() =>
											nodecg.sendMessage("timerSplit", {
												teamId: team.id,
												state: "completed",
											})
										}
									>
										完走
									</button>
									<button
										style={buttonStyle}
										onClick={() =>
											nodecg.sendMessage("timerSplit", {
												teamId: team.id,
												state: "forfeit",
											})
										}
									>
										棄権
									</button>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

render(<TimerControl />);
