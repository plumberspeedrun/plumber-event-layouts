import {useEffect, useState} from "react";
import {
	useActiveRunId,
	useRunDataArray,
	useSheetCommentators,
	useSheetRunners,
} from "../../hooks";
import {render} from "../../render";

declare const nodecg: {
	sendMessage(name: string, cb?: (err: Error | null) => void): void;
	sendMessage(
		name: string,
		data: unknown,
		cb?: (err: Error | null) => void,
	): void;
};

type Commentator = {
	name: string;
	pronouns?: string;
	social?: {
		twitch?: string;
		youtube?: string;
		twitter?: string;
		niconico?: string;
	};
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

const sectionStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 4,
	borderTop: "1px solid #5b6e8c",
	paddingTop: 8,
};

const modalOverlayStyle: React.CSSProperties = {
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.5)",
	zIndex: 1000,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
	background: "#2f3a4f",
	borderRadius: 8,
	padding: 16,
	maxWidth: 500,
	width: "100%",
	maxHeight: "80vh",
	overflowY: "auto",
};

const RunEditModal = ({
	runId,
	onClose,
}: {
	runId: string;
	onClose: () => void;
}) => {
	const runDataArray = useRunDataArray();
	const sheetRunners = useSheetRunners();
	const sheetCommentators = useSheetCommentators();
	const editingRun = runDataArray?.find((r) => r.id === runId);

	const [game, setGame] = useState("");
	const [category, setCategory] = useState("");
	const [system, setSystem] = useState("");
	const [estimate, setEstimate] = useState("");
	const [setupTime, setSetupTime] = useState("");
	const [scheduledStartTime, setScheduledStartTime] = useState("");
	const [pickedRunner, setPickedRunner] = useState("");
	const [newRunnerName, setNewRunnerName] = useState("");
	const [newCommentatorName, setNewCommentatorName] = useState("");
	const [pickedCommentator, setPickedCommentator] = useState("");

	useEffect(() => {
		setGame(editingRun?.game ?? "");
		setCategory(editingRun?.category ?? "");
		setSystem(editingRun?.system ?? "");
		setEstimate(editingRun?.estimate ?? "");
		setSetupTime(editingRun?.setupTime ?? "");
		setScheduledStartTime(
			editingRun?.scheduledStartTime
				? editingRun.scheduledStartTime.slice(0, 16)
				: "",
		);
	}, [editingRun?.id]);

	const candidateCommentators = (sheetCommentators ?? []).filter(
		(c) => c.game === editingRun?.game,
	);

	const handleSave = () => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				game,
				category,
				system,
				estimate,
				setupTime,
				scheduledStartTime: scheduledStartTime
					? new Date(scheduledStartTime).toISOString()
					: null,
			},
		});
	};

	const handleAddRunner = (name: string) => {
		if (editingRun == null) return;
		const allPlayers = editingRun.teams.flatMap((t) => t.players);
		if (allPlayers.some((p) => p.name === name)) return;
		const team = editingRun.teams[0];
		if (team == null) return;
		const sheetRunner = sheetRunners?.find((r) => r.name === name);
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: [
					{
						...team,
						players: [
							...team.players,
							{
								id: crypto.randomUUID(),
								teamId: team.id,
								name,
								...(sheetRunner?.social != null && {
									social: sheetRunner.social,
								}),
							},
						],
					},
					...editingRun.teams.slice(1),
				],
			},
		});
	};

	const handleRemoveRunner = (playerId: string) => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: editingRun.teams.map((team) => ({
					...team,
					players: team.players.filter((p) => p.id !== playerId),
				})),
			},
		});
	};

	const handleAddCommentator = (commentator: Commentator) => {
		if (editingRun == null) return;
		const existing = editingRun.commentators ?? [];
		if (existing.some((c) => c.name === commentator.name)) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				commentators: [...existing, commentator],
			},
		});
	};

	const handleRemoveCommentator = (name: string) => {
		if (editingRun == null) return;
		const existing = editingRun.commentators ?? [];
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				commentators: existing.filter((c) => c.name !== name),
			},
		});
	};

	if (editingRun == null) {
		return (
			<div style={modalOverlayStyle}>
				<div style={modalStyle}>
					<div style={containerStyle}>
						<div>対象の走行が見つかりません</div>
						<button
							style={buttonStyle}
							onClick={onClose}
						>
							閉じる
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={modalOverlayStyle}>
			<div style={modalStyle}>
				<div style={containerStyle}>
					<div style={sectionStyle}>
						<strong>走行情報</strong>
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
							placeholder='セットアップ時間'
							value={setupTime}
							onChange={(e) => setSetupTime(e.target.value)}
						/>
						<label style={{fontSize: 11, color: "#aab"}}>開始時刻</label>
						<input
							style={inputStyle}
							type='datetime-local'
							value={scheduledStartTime}
							onChange={(e) => setScheduledStartTime(e.target.value)}
						/>
					</div>

					<div style={sectionStyle}>
						<strong>走者</strong>
						{editingRun.teams.flatMap((team) =>
							team.players.map((player) => (
								<div
									key={player.id}
									style={rowStyle}
								>
									<div style={{flex: 1}}>{player.name}</div>
									<button
										style={buttonStyle}
										onClick={() => handleRemoveRunner(player.id)}
									>
										削除
									</button>
								</div>
							)),
						)}

						<div style={{display: "flex", gap: 8}}>
							<select
								style={inputStyle}
								value={pickedRunner}
								onChange={(e) => setPickedRunner(e.target.value)}
							>
								<option value=''>シートから選択</option>
								{sheetRunners?.map((r) => (
									<option
										key={r.name}
										value={r.name}
									>
										{r.name}
									</option>
								))}
							</select>
							<button
								style={buttonStyle}
								disabled={pickedRunner === ""}
								onClick={() => {
									handleAddRunner(pickedRunner);
									setPickedRunner("");
								}}
							>
								追加
							</button>
						</div>

						<div style={{display: "flex", gap: 8}}>
							<input
								style={inputStyle}
								placeholder='走者名を直接入力'
								value={newRunnerName}
								onChange={(e) => setNewRunnerName(e.target.value)}
							/>
							<button
								style={buttonStyle}
								disabled={newRunnerName.trim() === ""}
								onClick={() => {
									handleAddRunner(newRunnerName.trim());
									setNewRunnerName("");
								}}
							>
								追加
							</button>
						</div>
					</div>

					<div style={sectionStyle}>
						<strong>解説者</strong>
						{(editingRun.commentators ?? []).length === 0 ? (
							<div>解説者が設定されていません</div>
						) : (
							editingRun.commentators?.map((commentator) => (
								<div
									key={commentator.name}
									style={rowStyle}
								>
									<div style={{flex: 1}}>
										{commentator.name}
										{commentator.pronouns && ` (${commentator.pronouns})`}
									</div>
									<button
										style={buttonStyle}
										onClick={() => handleRemoveCommentator(commentator.name)}
									>
										削除
									</button>
								</div>
							))
						)}

						<div style={{display: "flex", gap: 8}}>
							<select
								style={inputStyle}
								value={pickedCommentator}
								onChange={(e) => setPickedCommentator(e.target.value)}
							>
								<option value=''>シートから選択</option>
								{candidateCommentators.map((c) => (
									<option
										key={c.name}
										value={c.name}
									>
										{c.name}
										{c.pronouns ? ` (${c.pronouns})` : ""}
									</option>
								))}
							</select>
							<button
								style={buttonStyle}
								disabled={pickedCommentator === ""}
								onClick={() => {
									const commentator = candidateCommentators.find(
										(c) => c.name === pickedCommentator,
									);
									if (commentator == null) return;
									handleAddCommentator({
										name: commentator.name,
										...(commentator.pronouns != null && {
											pronouns: commentator.pronouns,
										}),
										...(commentator.social != null && {
											social: commentator.social,
										}),
									});
									setPickedCommentator("");
								}}
							>
								追加
							</button>
						</div>

						<div style={{display: "flex", gap: 8}}>
							<input
								style={inputStyle}
								placeholder='解説者名を直接入力'
								value={newCommentatorName}
								onChange={(e) => setNewCommentatorName(e.target.value)}
							/>
							<button
								style={buttonStyle}
								disabled={newCommentatorName.trim() === ""}
								onClick={() => {
									handleAddCommentator({name: newCommentatorName.trim()});
									setNewCommentatorName("");
								}}
							>
								追加
							</button>
						</div>
					</div>

					<div style={{display: "flex", gap: 8}}>
						<button
							style={buttonStyle}
							onClick={handleSave}
						>
							保存
						</button>
						<button
							style={buttonStyle}
							onClick={onClose}
						>
							閉じる
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const Schedule = () => {
	const runDataArray = useRunDataArray();
	const activeRunId = useActiveRunId();
	const sheetRunners = useSheetRunners();
	const sheetCommentators = useSheetCommentators();

	const [game, setGame] = useState("");
	const [category, setCategory] = useState("");
	const [system, setSystem] = useState("");
	const [estimate, setEstimate] = useState("");
	const [runnerName, setRunnerName] = useState("");
	const [scheduledStartTime, setScheduledStartTime] = useState("");
	const [editingRunId, setEditingRunId] = useState<string | null>(null);
	const [addPickedCommentator, setAddPickedCommentator] = useState("");
	const [addNewCommentatorName, setAddNewCommentatorName] = useState("");
	const [addCommentators, setAddCommentators] = useState<Commentator[]>([]);

	const addCandidateCommentators = (sheetCommentators ?? []).filter(
		(c) => c.game === game,
	);

	const handleAddCommentatorToNew = (commentator: Commentator) => {
		if (addCommentators.some((c) => c.name === commentator.name)) return;
		setAddCommentators([...addCommentators, commentator]);
	};

	const handleRemoveCommentatorFromNew = (name: string) => {
		setAddCommentators(addCommentators.filter((c) => c.name !== name));
	};

	const handleAddRun = () => {
		nodecg.sendMessage("scheduleAddRun", {
			...(game && {game}),
			...(category && {category}),
			...(system && {system}),
			...(estimate && {estimate}),
			...(scheduledStartTime && {
				scheduledStartTime: new Date(scheduledStartTime).toISOString(),
			}),
			...(addCommentators.length > 0 && {commentators: addCommentators}),
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
		setScheduledStartTime("");
		setAddCommentators([]);
		setAddPickedCommentator("");
		setAddNewCommentatorName("");
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
				{runDataArray?.map((runData) => {
					const runnerNames = runData.teams
						.flatMap((t) => t.players.map((p) => p.name))
						.join(", ");
					const isActive = runData.id === activeRunId;

					return (
						<div
							key={runData.id}
							style={isActive ? activeRowStyle : rowStyle}
						>
							<div style={{flex: 1}}>
								<div>
									<strong>{runData.game || "(無題)"}</strong> {runData.category}
								</div>
								<div>
									{runnerNames}
									{runData.estimate ? ` / 予想: ${runData.estimate}` : ""}
								</div>
								{runData.scheduledStartTime && (
									<div style={{fontSize: 11, color: "#aab"}}>
										{new Date(runData.scheduledStartTime).toLocaleString(
											"ja-JP",
											{
												month: "numeric",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											},
										)}
									</div>
								)}
							</div>
							<button
								style={buttonStyle}
								onClick={() => setEditingRunId(runData.id)}
							>
								編集
							</button>
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
					type='datetime-local'
					value={scheduledStartTime}
					onChange={(e) => setScheduledStartTime(e.target.value)}
				/>
				<label style={{fontSize: 11, color: "#aab"}}>走者</label>
				<div style={{display: "flex", gap: 8}}>
					<select
						style={inputStyle}
						value={runnerName}
						onChange={(e) => setRunnerName(e.target.value)}
					>
						<option value=''>シートから選択</option>
						{sheetRunners?.map((r) => (
							<option
								key={r.name}
								value={r.name}
							>
								{r.name}
							</option>
						))}
					</select>
					<input
						style={inputStyle}
						placeholder='または直接入力'
						value={runnerName}
						onChange={(e) => setRunnerName(e.target.value)}
					/>
				</div>

				<label style={{fontSize: 11, color: "#aab"}}>解説者</label>
				{addCommentators.map((c) => (
					<div
						key={c.name}
						style={rowStyle}
					>
						<div style={{flex: 1}}>{c.name}</div>
						<button
							style={buttonStyle}
							onClick={() => handleRemoveCommentatorFromNew(c.name)}
						>
							削除
						</button>
					</div>
				))}
				<div style={{display: "flex", gap: 8}}>
					<select
						style={inputStyle}
						value={addPickedCommentator}
						onChange={(e) => setAddPickedCommentator(e.target.value)}
					>
						<option value=''>シートから選択</option>
						{addCandidateCommentators.map((c) => (
							<option
								key={c.name}
								value={c.name}
							>
								{c.name}
							</option>
						))}
					</select>
					<button
						style={buttonStyle}
						disabled={addPickedCommentator === ""}
						onClick={() => {
							const c = addCandidateCommentators.find(
								(c) => c.name === addPickedCommentator,
							);
							if (c == null) return;
							handleAddCommentatorToNew({
								name: c.name,
								...(c.pronouns != null && {pronouns: c.pronouns}),
								...(c.social != null && {social: c.social}),
							});
							setAddPickedCommentator("");
						}}
					>
						追加
					</button>
				</div>
				<div style={{display: "flex", gap: 8}}>
					<input
						style={inputStyle}
						placeholder='解説者名を直接入力'
						value={addNewCommentatorName}
						onChange={(e) => setAddNewCommentatorName(e.target.value)}
					/>
					<button
						style={buttonStyle}
						disabled={addNewCommentatorName.trim() === ""}
						onClick={() => {
							handleAddCommentatorToNew({
								name: addNewCommentatorName.trim(),
							});
							setAddNewCommentatorName("");
						}}
					>
						追加
					</button>
				</div>

				<button
					style={buttonStyle}
					onClick={handleAddRun}
				>
					追加
				</button>
			</div>

			{editingRunId != null && (
				<RunEditModal
					runId={editingRunId}
					onClose={() => setEditingRunId(null)}
				/>
			)}
		</div>
	);
};

render(<Schedule />);
