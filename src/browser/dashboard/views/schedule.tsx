import {useState} from "react";
import {useActiveRunId, useRunDataArray} from "../../hooks";
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
	padding: "2px 6px",
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

const activeRowStyle: React.CSSProperties = {
	...rowStyle,
	background: "#5a7a4f",
};

const inputStyle: React.CSSProperties = {
	background: "#1f2937",
	color: "#fff",
	border: "1px solid #5b6e8c",
	borderRadius: 4,
	padding: "4px 6px",
};

const Schedule = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();

	const [game, setGame] = useState("");
	const [category, setCategory] = useState("");
	const [system, setSystem] = useState("");
	const [estimate, setEstimate] = useState("");
	const [runnerName, setRunnerName] = useState("");

	const handleAddRun = () => {
		nodecg.sendMessage("scheduleAddRun", {
			...(game && {game}),
			...(category && {category}),
			...(system && {system}),
			...(estimate && {estimate}),
			teams: [
				{
					players: [{name: runnerName || "Unknown"}],
				},
			],
		});
		setGame("");
		setCategory("");
		setSystem("");
		setEstimate("");
		setRunnerName("");
	};

	return (
		<div style={containerStyle}>
			<div style={{display: "flex", gap: 8}}>
				<button
					style={buttonStyle}
					onClick={() => nodecg.sendMessage("schedulePreviousRun")}
				>
					前へ
				</button>
				<button
					style={buttonStyle}
					onClick={() => nodecg.sendMessage("scheduleNextRun")}
				>
					次へ
				</button>
				<button
					style={buttonStyle}
					onClick={() => nodecg.sendMessage("syncSpreadsheet")}
				>
					シート同期
				</button>
			</div>

			<div style={{display: "flex", flexDirection: "column", gap: 4}}>
				{runDataArray?.map((runData, index) => {
					const runnerNames = runData.teams
						.flatMap((t) => t.players.map((p) => p.name))
						.join(", ");
					const isActive = runData.id === activeRunId;

					return (
						<div
							key={runData.id}
							style={isActive ? activeRowStyle : rowStyle}
						>
							<div style={{display: "flex", flexDirection: "column"}}>
								<button
									style={buttonStyle}
									disabled={index === 0}
									onClick={() =>
										nodecg.sendMessage("scheduleMoveRun", {
											id: runData.id,
											direction: "up",
										})
									}
								>
									▲
								</button>
								<button
									style={buttonStyle}
									disabled={index === runDataArray.length - 1}
									onClick={() =>
										nodecg.sendMessage("scheduleMoveRun", {
											id: runData.id,
											direction: "down",
										})
									}
								>
									▼
								</button>
							</div>
							<div style={{flex: 1}}>
								<div>
									<strong>{runData.game || "(無題)"}</strong> {runData.category}
								</div>
								<div>
									{runnerNames}
									{runData.estimate ? ` / 予想: ${runData.estimate}` : ""}
								</div>
							</div>
							<button
								style={buttonStyle}
								disabled={isActive}
								onClick={() =>
									nodecg.sendMessage("scheduleSetActiveRun", {id: runData.id})
								}
							>
								Activeに設定
							</button>
							<button
								style={buttonStyle}
								onClick={() =>
									nodecg.sendMessage("scheduleRemoveRun", {id: runData.id})
								}
							>
								削除
							</button>
						</div>
					);
				})}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 4,
					borderTop: "1px solid #5b6e8c",
					paddingTop: 8,
				}}
			>
				<strong>走行を追加</strong>
				<input
					style={inputStyle}
					placeholder='ゲーム名'
					value={game}
					onChange={(e) => setGame(e.target.value)}
				/>
				<input
					style={inputStyle}
					placeholder='カテゴリ'
					value={category}
					onChange={(e) => setCategory(e.target.value)}
				/>
				<input
					style={inputStyle}
					placeholder='システム'
					value={system}
					onChange={(e) => setSystem(e.target.value)}
				/>
				<input
					style={inputStyle}
					placeholder='予想時間'
					value={estimate}
					onChange={(e) => setEstimate(e.target.value)}
				/>
				<input
					style={inputStyle}
					placeholder='ランナー名'
					value={runnerName}
					onChange={(e) => setRunnerName(e.target.value)}
				/>
				<button
					style={buttonStyle}
					onClick={handleAddRun}
				>
					追加
				</button>
			</div>
		</div>
	);
};

render(<Schedule />);
