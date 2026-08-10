import EditIcon from "@mui/icons-material/Edit";
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {useEffect, useState} from "react";
import {
	useActiveRun,
	useObsConfig,
	useObsScenes,
	useRunDataArray,
	useSheetCommentators,
	useSheetRunners,
} from "../../hooks";
import {Row, Section, SectionTitle} from "../components";

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
const FieldLabel = ({children}: {children: React.ReactNode}) => (
	<Typography
		variant='caption'
		color='text.secondary'
	>
		{children}
	</Typography>
);
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
	const obsScenes = useObsScenes();
	const editingRun = runDataArray?.find((r) => r.id === runId);
	const [game, setGame] = useState("");
	const [category, setCategory] = useState("");
	const [system, setSystem] = useState("");
	const [estimate, setEstimate] = useState("");
	const [setupTime, setSetupTime] = useState("");
	const [runType, setRunType] = useState<"ffa" | "team">("ffa");
	const [obsSceneName, setObsSceneName] = useState("");
	const [pickedRunner, setPickedRunner] = useState("");
	const [newRunnerName, setNewRunnerName] = useState("");
	const [newCommentatorName, setNewCommentatorName] = useState("");
	const [pickedCommentator, setPickedCommentator] = useState("");
	const [pickedTeamRunner, setPickedTeamRunner] = useState<
		Record<string, string>
	>({});
	const [newTeamRunnerName, setNewTeamRunnerName] = useState<
		Record<string, string>
	>({});
	const [teamNameDrafts, setTeamNameDrafts] = useState<Record<string, string>>(
		{},
	);
	useEffect(() => {
		setGame(editingRun?.game ?? "");
		setCategory(editingRun?.category ?? "");
		setSystem(editingRun?.system ?? "");
		setEstimate(editingRun?.estimate ?? "");
		setSetupTime(editingRun?.setupTime ?? "");
		setRunType(editingRun?.runType ?? "ffa");
		setObsSceneName(editingRun?.obsSceneName ?? "");
	}, [
		editingRun?.setupTime,
		editingRun?.estimate,
		editingRun?.system,
		editingRun?.runType,
		editingRun?.game,
		editingRun?.category,
		editingRun?.obsSceneName,
	]);
	const candidateCommentators = (sheetCommentators ?? []).filter(
		(c) => c.game === editingRun?.game,
	);
	const handleSave = () => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {game, category, system, estimate, setupTime, runType, obsSceneName},
		});
	};
	const handleAddRunner = (name: string) => {
		if (editingRun == null) return;
		const allPlayers = editingRun.teams.flatMap((t) => t.players);
		if (allPlayers.some((p) => p.name === name)) return;
		const sheetRunner = sheetRunners?.find((r) => r.name === name);
		const newTeamId = crypto.randomUUID();
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: [
					...editingRun.teams,
					{
						id: newTeamId,
						players: [
							{
								id: crypto.randomUUID(),
								teamId: newTeamId,
								name,
								...(sheetRunner?.social != null && {
									social: sheetRunner.social,
								}),
							},
						],
					},
				],
			},
		});
	};
	const handleRemoveRunner = (playerId: string) => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: editingRun.teams.filter(
					(team) => !team.players.some((p) => p.id === playerId),
				),
			},
		});
	};
	const handleAddTeam = () => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: [
					...editingRun.teams,
					{id: crypto.randomUUID(), name: "新しいチーム", players: []},
				],
			},
		});
	};
	const handleRemoveTeam = (teamId: string) => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {teams: editingRun.teams.filter((team) => team.id !== teamId)},
		});
	};
	const handleUpdateTeamName = (teamId: string, name: string) => {
		if (editingRun == null) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: editingRun.teams.map((team) =>
					team.id === teamId ? {...team, name} : team,
				),
			},
		});
	};
	const handleCommitTeamNameDraft = (teamId: string) => {
		if (editingRun == null) return;
		const draft = teamNameDrafts[teamId];
		if (draft == null) return;
		const team = editingRun.teams.find((t) => t.id === teamId);
		if (team == null) return;
		if (draft !== team.name) {
			handleUpdateTeamName(teamId, draft);
		}
		setTeamNameDrafts((prev) => {
			const next = {...prev};
			delete next[teamId];
			return next;
		});
	};
	const handleAddPlayerToTeam = (teamId: string, name: string) => {
		if (editingRun == null) return;
		const allPlayers = editingRun.teams.flatMap((t) => t.players);
		if (allPlayers.some((p) => p.name === name)) return;
		const sheetRunner = sheetRunners?.find((r) => r.name === name);
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: editingRun.teams.map((team) =>
					team.id === teamId
						? {
								...team,
								players: [
									...team.players,
									{
										id: crypto.randomUUID(),
										teamId,
										name,
										...(sheetRunner?.social != null && {
											social: sheetRunner.social,
										}),
									},
								],
							}
						: team,
				),
			},
		});
	};
	const handleRemovePlayerFromTeam = (teamId: string, playerId: string) => {
		if (editingRun == null) return;
		const team = editingRun.teams.find((t) => t.id === teamId);
		if (team == null) return;
		const remainingPlayers = team.players.filter((p) => p.id !== playerId);
		if (remainingPlayers.length === 0) {
			nodecg.sendMessage("scheduleUpdateRun", {
				id: editingRun.id,
				run: {teams: editingRun.teams.filter((t) => t.id !== teamId)},
			});
			return;
		}
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {
				teams: editingRun.teams.map((t) =>
					t.id === teamId ? {...t, players: remainingPlayers} : t,
				),
			},
		});
	};
	const handleAddCommentator = (commentator: Commentator) => {
		if (editingRun == null) return;
		const existing = editingRun.commentators ?? [];
		if (existing.some((c) => c.name === commentator.name)) return;
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {commentators: [...existing, commentator]},
		});
	};
	const handleRemoveCommentator = (name: string) => {
		if (editingRun == null) return;
		const existing = editingRun.commentators ?? [];
		nodecg.sendMessage("scheduleUpdateRun", {
			id: editingRun.id,
			run: {commentators: existing.filter((c) => c.name !== name)},
		});
	};
	const teamCardStyle = {
		display: "flex",
		flexDirection: "column",
		gap: 0.5,
		p: 1,
		backgroundColor: "background.paper",
		borderColor: "divider",
	};
	return (
		<Dialog
			open
			onClose={onClose}
		>
			<DialogTitle>走行編集</DialogTitle>
			{editingRun == null ? (
				<>
					<DialogContent>
						<Typography>対象の走行が見つかりません</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={onClose}>閉じる</Button>
					</DialogActions>
				</>
			) : (
				<>
					<DialogContent>
						<Section>
							<SectionTitle>走行情報</SectionTitle>
							<TextField
								placeholder='ゲーム名'
								value={game}
								onChange={(e) => setGame(e.target.value)}
							/>
							<TextField
								placeholder='カテゴリ'
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							/>
							<TextField
								placeholder='システム'
								value={system}
								onChange={(e) => setSystem(e.target.value)}
							/>
							<TextField
								placeholder='予想時間'
								value={estimate}
								onChange={(e) => setEstimate(e.target.value)}
							/>
							<TextField
								placeholder='セットアップ時間'
								value={setupTime}
								onChange={(e) => setSetupTime(e.target.value)}
							/>
							<FieldLabel>走行種別</FieldLabel>
							<RadioGroup
								row
								value={runType}
								onChange={(e) =>
									setRunType(e.target.value === "team" ? "team" : "ffa")
								}
							>
								<FormControlLabel
									value='ffa'
									control={<Radio size='small' />}
									label='個人'
								/>
								<FormControlLabel
									value='team'
									control={<Radio size='small' />}
									label='チーム'
								/>
							</RadioGroup>
							<FieldLabel>OBSシーン</FieldLabel>
							<TextField
								select
								value={obsSceneName}
								onChange={(e) => setObsSceneName(e.target.value)}
							>
								<MenuItem value=''>未選択</MenuItem>
								{obsScenes?.map((scene) => (
									<MenuItem
										key={scene}
										value={scene}
									>
										{scene}
									</MenuItem>
								))}
							</TextField>
						</Section>
						<Section>
							<SectionTitle>走者</SectionTitle>
							{runType === "ffa" ? (
								<>
									<Stack spacing={0.5}>
										{editingRun.teams.flatMap((team) =>
											team.players.map((player) => (
												<Row key={player.id}>
													<Typography sx={{flex: 1}}>{player.name}</Typography>
													<Button
														variant='outlined'
														color='error'
														onClick={() => handleRemoveRunner(player.id)}
													>
														削除
													</Button>
												</Row>
											)),
										)}
									</Stack>
									<Stack
										direction='row'
										spacing={1}
									>
										<TextField
											select
											sx={{flex: 1}}
											value={pickedRunner}
											onChange={(e) => setPickedRunner(e.target.value)}
										>
											<MenuItem value=''>シートから選択</MenuItem>
											{sheetRunners?.map((r) => (
												<MenuItem
													key={r.name}
													value={r.name}
												>
													{r.name}
												</MenuItem>
											))}
										</TextField>
										<Button
											variant='contained'
											disabled={pickedRunner === ""}
											onClick={() => {
												handleAddRunner(pickedRunner);
												setPickedRunner("");
											}}
										>
											追加
										</Button>
									</Stack>
									<Stack
										direction='row'
										spacing={1}
									>
										<TextField
											sx={{flex: 1}}
											placeholder='走者名を直接入力'
											value={newRunnerName}
											onChange={(e) => setNewRunnerName(e.target.value)}
										/>
										<Button
											variant='contained'
											disabled={newRunnerName.trim() === ""}
											onClick={() => {
												handleAddRunner(newRunnerName.trim());
												setNewRunnerName("");
											}}
										>
											追加
										</Button>
									</Stack>
								</>
							) : (
								<>
									<Stack spacing={0.5}>
										{editingRun.teams.map((team) => (
											<Paper
												key={team.id}
												variant='outlined'
												sx={teamCardStyle}
											>
												<Stack
													direction='row'
													spacing={1}
												>
													<TextField
														sx={{flex: 1}}
														placeholder='チーム名'
														value={teamNameDrafts[team.id] ?? team.name ?? ""}
														onChange={(e) =>
															setTeamNameDrafts({
																...teamNameDrafts,
																[team.id]: e.target.value,
															})
														}
														onBlur={() => handleCommitTeamNameDraft(team.id)}
													/>
													<Button
														variant='outlined'
														color='error'
														onClick={() => handleRemoveTeam(team.id)}
													>
														チーム削除
													</Button>
												</Stack>
												<Stack spacing={0.5}>
													{team.players.map((player) => (
														<Row key={player.id}>
															<Typography sx={{flex: 1}}>
																{player.name}
															</Typography>
															<Button
																variant='outlined'
																color='error'
																onClick={() =>
																	handleRemovePlayerFromTeam(team.id, player.id)
																}
															>
																削除
															</Button>
														</Row>
													))}
												</Stack>
												<Stack
													direction='row'
													spacing={1}
												>
													<TextField
														select
														sx={{flex: 1}}
														value={pickedTeamRunner[team.id] ?? ""}
														onChange={(e) =>
															setPickedTeamRunner({
																...pickedTeamRunner,
																[team.id]: e.target.value,
															})
														}
													>
														<MenuItem value=''>シートから選択</MenuItem>
														{sheetRunners?.map((r) => (
															<MenuItem
																key={r.name}
																value={r.name}
															>
																{r.name}
															</MenuItem>
														))}
													</TextField>
													<Button
														variant='contained'
														disabled={(pickedTeamRunner[team.id] ?? "") === ""}
														onClick={() => {
															handleAddPlayerToTeam(
																team.id,
																pickedTeamRunner[team.id] ?? "",
															);
															setPickedTeamRunner({
																...pickedTeamRunner,
																[team.id]: "",
															});
														}}
													>
														追加
													</Button>
												</Stack>
												<Stack
													direction='row'
													spacing={1}
												>
													<TextField
														sx={{flex: 1}}
														placeholder='走者名を直接入力'
														value={newTeamRunnerName[team.id] ?? ""}
														onChange={(e) =>
															setNewTeamRunnerName({
																...newTeamRunnerName,
																[team.id]: e.target.value,
															})
														}
													/>
													<Button
														variant='contained'
														disabled={
															(newTeamRunnerName[team.id] ?? "").trim() === ""
														}
														onClick={() => {
															handleAddPlayerToTeam(
																team.id,
																(newTeamRunnerName[team.id] ?? "").trim(),
															);
															setNewTeamRunnerName({
																...newTeamRunnerName,
																[team.id]: "",
															});
														}}
													>
														追加
													</Button>
												</Stack>
											</Paper>
										))}
									</Stack>
									<Button
										variant='outlined'
										onClick={handleAddTeam}
									>
										チーム追加
									</Button>
								</>
							)}
						</Section>
						<Section>
							<SectionTitle>解説者</SectionTitle>
							{(editingRun.commentators ?? []).length === 0 ? (
								<Typography color='text.secondary'>
									解説者が設定されていません
								</Typography>
							) : (
								<Stack spacing={0.5}>
									{editingRun.commentators?.map((commentator) => (
										<Row key={commentator.name}>
											<Typography sx={{flex: 1}}>
												{commentator.name}
												{commentator.pronouns && ` (${commentator.pronouns})`}
											</Typography>
											<Button
												variant='outlined'
												color='error'
												onClick={() =>
													handleRemoveCommentator(commentator.name)
												}
											>
												削除
											</Button>
										</Row>
									))}
								</Stack>
							)}
							<Stack
								direction='row'
								spacing={1}
							>
								<TextField
									select
									sx={{flex: 1}}
									value={pickedCommentator}
									onChange={(e) => setPickedCommentator(e.target.value)}
								>
									<MenuItem value=''>シートから選択</MenuItem>
									{candidateCommentators.map((c) => (
										<MenuItem
											key={c.name}
											value={c.name}
										>
											{c.name}
										</MenuItem>
									))}
								</TextField>
								<Button
									variant='contained'
									disabled={pickedCommentator === ""}
									onClick={() => {
										const commentator = candidateCommentators.find(
											(c) => c.name === pickedCommentator,
										);
										if (commentator == null) return;
										handleAddCommentator({
											name: commentator.name,
											...(commentator.social != null && {
												social: commentator.social,
											}),
										});
										setPickedCommentator("");
									}}
								>
									追加
								</Button>
							</Stack>
							<Stack
								direction='row'
								spacing={1}
							>
								<TextField
									sx={{flex: 1}}
									placeholder='解説者名を直接入力'
									value={newCommentatorName}
									onChange={(e) => setNewCommentatorName(e.target.value)}
								/>
								<Button
									variant='contained'
									disabled={newCommentatorName.trim() === ""}
									onClick={() => {
										handleAddCommentator({name: newCommentatorName.trim()});
										setNewCommentatorName("");
									}}
								>
									追加
								</Button>
							</Stack>
						</Section>
					</DialogContent>
					<DialogActions>
						<Button
							variant='contained'
							onClick={handleSave}
						>
							保存
						</Button>
						<Button onClick={onClose}>閉じる</Button>
					</DialogActions>
				</>
			)}
		</Dialog>
	);
};
const AddRunModal = ({onClose}: {onClose: () => void}) => {
	const sheetRunners = useSheetRunners();
	const sheetCommentators = useSheetCommentators();
	const obsScenes = useObsScenes();
	const [game, setGame] = useState("");
	const [category, setCategory] = useState("");
	const [system, setSystem] = useState("");
	const [estimate, setEstimate] = useState("");
	const [runnerName, setRunnerName] = useState("");
	const [addPickedCommentator, setAddPickedCommentator] = useState("");
	const [addNewCommentatorName, setAddNewCommentatorName] = useState("");
	const [addCommentators, setAddCommentators] = useState<Commentator[]>([]);
	const [runType, setRunType] = useState<"ffa" | "team">("ffa");
	const [newTeams, setNewTeams] = useState<NewTeam[]>([]);
	const [pickedNewTeamRunner, setPickedNewTeamRunner] = useState<
		Record<number, string>
	>({});
	const [newTeamRunnerInput, setNewTeamRunnerInput] = useState<
		Record<number, string>
	>({});
	const [addObsSceneName, setAddObsSceneName] = useState("");
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
	const handleAddTeamToNew = () => {
		setNewTeams([...newTeams, {name: "", players: []}]);
	};
	const handleRemoveTeamFromNew = (index: number) => {
		setNewTeams(newTeams.filter((_, i) => i !== index));
	};
	const handleUpdateNewTeamName = (index: number, name: string) => {
		setNewTeams(
			newTeams.map((team, i) => (i === index ? {...team, name} : team)),
		);
	};
	const handleAddPlayerToNewTeam = (index: number, name: string) => {
		if (name === "") return;
		setNewTeams(
			newTeams.map((team, i) =>
				i === index ? {...team, players: [...team.players, {name}]} : team,
			),
		);
	};
	const handleRemovePlayerFromNewTeam = (
		index: number,
		playerIndex: number,
	) => {
		setNewTeams(
			newTeams.map((team, i) =>
				i === index
					? {
							...team,
							players: team.players.filter((_, pi) => pi !== playerIndex),
						}
					: team,
			),
		);
	};
	const handleAddRun = () => {
		const teams =
			runType === "ffa"
				? [{players: [{name: runnerName || "Unknown"}]}]
				: newTeams
						.filter((team) => team.players.length > 0)
						.map((team) => ({
							...(team.name && {name: team.name}),
							players: team.players,
						}));
		nodecg.sendMessage("scheduleAddRun", {
			...(game && {game}),
			...(category && {category}),
			...(system && {system}),
			...(estimate && {estimate}),
			...(addCommentators.length > 0 && {commentators: addCommentators}),
			...(addObsSceneName && {obsSceneName: addObsSceneName}),
			runType,
			teams,
		});
		onClose();
	};
	const teamCardStyle = {
		display: "flex",
		flexDirection: "column",
		gap: 0.5,
		p: 1,
		backgroundColor: "background.paper",
		borderColor: "divider",
	};
	return (
		<Dialog
			open
			onClose={onClose}
		>
			<DialogTitle>走行を追加</DialogTitle>
			<DialogContent>
				<Section>
					<SectionTitle>走行情報</SectionTitle>
					<TextField
						placeholder='ゲーム名'
						value={game}
						onChange={(e) => setGame(e.target.value)}
					/>
					<TextField
						placeholder='カテゴリ'
						value={category}
						onChange={(e) => setCategory(e.target.value)}
					/>
					<TextField
						placeholder='システム'
						value={system}
						onChange={(e) => setSystem(e.target.value)}
					/>
					<TextField
						placeholder='予想時間'
						value={estimate}
						onChange={(e) => setEstimate(e.target.value)}
					/>
					<FieldLabel>走行種別</FieldLabel>
					<RadioGroup
						row
						value={runType}
						onChange={(e) =>
							setRunType(e.target.value === "team" ? "team" : "ffa")
						}
					>
						<FormControlLabel
							value='ffa'
							control={<Radio size='small' />}
							label='個人'
						/>
						<FormControlLabel
							value='team'
							control={<Radio size='small' />}
							label='チーム'
						/>
					</RadioGroup>
				</Section>
				<Section>
					<SectionTitle>走者</SectionTitle>
					{runType === "ffa" ? (
						<Stack
							direction='row'
							spacing={1}
						>
							<TextField
								select
								sx={{flex: 1}}
								value={runnerName}
								onChange={(e) => setRunnerName(e.target.value)}
							>
								<MenuItem value=''>シートから選択</MenuItem>
								{sheetRunners?.map((r) => (
									<MenuItem
										key={r.name}
										value={r.name}
									>
										{r.name}
									</MenuItem>
								))}
							</TextField>
							<TextField
								sx={{flex: 1}}
								placeholder='または直接入力'
								value={runnerName}
								onChange={(e) => setRunnerName(e.target.value)}
							/>
						</Stack>
					) : (
						<>
							<Stack spacing={0.5}>
								{newTeams.map((team, index) => (
									<Paper
										key={index}
										variant='outlined'
										sx={teamCardStyle}
									>
										<Stack
											direction='row'
											spacing={1}
										>
											<TextField
												sx={{flex: 1}}
												placeholder='チーム名'
												value={team.name}
												onChange={(e) =>
													handleUpdateNewTeamName(index, e.target.value)
												}
											/>
											<Button
												variant='outlined'
												color='error'
												onClick={() => handleRemoveTeamFromNew(index)}
											>
												チーム削除
											</Button>
										</Stack>
										<Stack spacing={0.5}>
											{team.players.map((player, playerIndex) => (
												<Row key={playerIndex}>
													<Typography sx={{flex: 1}}>{player.name}</Typography>
													<Button
														variant='outlined'
														color='error'
														onClick={() =>
															handleRemovePlayerFromNewTeam(index, playerIndex)
														}
													>
														削除
													</Button>
												</Row>
											))}
										</Stack>
										<Stack
											direction='row'
											spacing={1}
										>
											<TextField
												select
												sx={{flex: 1}}
												value={pickedNewTeamRunner[index] ?? ""}
												onChange={(e) =>
													setPickedNewTeamRunner({
														...pickedNewTeamRunner,
														[index]: e.target.value,
													})
												}
											>
												<MenuItem value=''>シートから選択</MenuItem>
												{sheetRunners?.map((r) => (
													<MenuItem
														key={r.name}
														value={r.name}
													>
														{r.name}
													</MenuItem>
												))}
											</TextField>
											<Button
												variant='contained'
												disabled={(pickedNewTeamRunner[index] ?? "") === ""}
												onClick={() => {
													handleAddPlayerToNewTeam(
														index,
														pickedNewTeamRunner[index] ?? "",
													);
													setPickedNewTeamRunner({
														...pickedNewTeamRunner,
														[index]: "",
													});
												}}
											>
												追加
											</Button>
										</Stack>
										<Stack
											direction='row'
											spacing={1}
										>
											<TextField
												sx={{flex: 1}}
												placeholder='走者名を直接入力'
												value={newTeamRunnerInput[index] ?? ""}
												onChange={(e) =>
													setNewTeamRunnerInput({
														...newTeamRunnerInput,
														[index]: e.target.value,
													})
												}
											/>
											<Button
												variant='contained'
												disabled={
													(newTeamRunnerInput[index] ?? "").trim() === ""
												}
												onClick={() => {
													handleAddPlayerToNewTeam(
														index,
														(newTeamRunnerInput[index] ?? "").trim(),
													);
													setNewTeamRunnerInput({
														...newTeamRunnerInput,
														[index]: "",
													});
												}}
											>
												追加
											</Button>
										</Stack>
									</Paper>
								))}
							</Stack>
							<Button
								variant='outlined'
								onClick={handleAddTeamToNew}
							>
								チーム追加
							</Button>
						</>
					)}
				</Section>
				<Section>
					<SectionTitle>解説者</SectionTitle>
					<Stack spacing={0.5}>
						{addCommentators.map((c) => (
							<Row key={c.name}>
								<Typography sx={{flex: 1}}>{c.name}</Typography>
								<Button
									variant='outlined'
									color='error'
									onClick={() => handleRemoveCommentatorFromNew(c.name)}
								>
									削除
								</Button>
							</Row>
						))}
					</Stack>
					<Stack
						direction='row'
						spacing={1}
					>
						<TextField
							select
							sx={{flex: 1}}
							value={addPickedCommentator}
							onChange={(e) => setAddPickedCommentator(e.target.value)}
						>
							<MenuItem value=''>シートから選択</MenuItem>
							{addCandidateCommentators.map((c) => (
								<MenuItem
									key={c.name}
									value={c.name}
								>
									{c.name}
								</MenuItem>
							))}
						</TextField>
						<Button
							variant='contained'
							disabled={addPickedCommentator === ""}
							onClick={() => {
								const c = addCandidateCommentators.find(
									(c) => c.name === addPickedCommentator,
								);
								if (c == null) return;
								handleAddCommentatorToNew({
									name: c.name,
									...(c.social != null && {social: c.social}),
								});
								setAddPickedCommentator("");
							}}
						>
							追加
						</Button>
					</Stack>
					<Stack
						direction='row'
						spacing={1}
					>
						<TextField
							sx={{flex: 1}}
							placeholder='解説者名を直接入力'
							value={addNewCommentatorName}
							onChange={(e) => setAddNewCommentatorName(e.target.value)}
						/>
						<Button
							variant='contained'
							disabled={addNewCommentatorName.trim() === ""}
							onClick={() => {
								handleAddCommentatorToNew({name: addNewCommentatorName.trim()});
								setAddNewCommentatorName("");
							}}
						>
							追加
						</Button>
					</Stack>
				</Section>
				<Section>
					<SectionTitle>OBSシーン</SectionTitle>
					<TextField
						select
						value={addObsSceneName}
						onChange={(e) => setAddObsSceneName(e.target.value)}
					>
						<MenuItem value=''>未選択</MenuItem>
						{obsScenes?.map((scene) => (
							<MenuItem
								key={scene}
								value={scene}
							>
								{scene}
							</MenuItem>
						))}
					</TextField>
				</Section>
			</DialogContent>
			<DialogActions>
				<Button
					variant='contained'
					onClick={handleAddRun}
				>
					追加
				</Button>
				<Button onClick={onClose}>閉じる</Button>
			</DialogActions>
		</Dialog>
	);
};
type NewTeam = {name: string; players: {name: string}[]};
export const Schedule = () => {
	const activeRun = useActiveRun();
	const runDataArray = useRunDataArray();
	const obsScenes = useObsScenes();
	const [obsConfig, setObsConfig] = useObsConfig();
	const [editingRunId, setEditingRunId] = useState<string | null>(null);
	const [addingRun, setAddingRun] = useState(false);
	const [cursorRunId, setCursorRunId] = useState<string | null>(null);
	useEffect(() => {
		if (cursorRunId == null && activeRun != null) {
			setCursorRunId(activeRun.id);
		}
	}, [activeRun, cursorRunId]);
	const displayedRun =
		runDataArray?.find((r) => r.id === cursorRunId) ?? activeRun ?? null;
	const isActive =
		displayedRun?.id != null && displayedRun.id === activeRun?.id;
	const cursorIndex =
		runDataArray?.findIndex((r) => r.id === displayedRun?.id) ?? -1;
	const handleMoveCursor = (delta: -1 | 1) => {
		if (runDataArray == null) return;
		const targetIndex = cursorIndex + delta;
		if (targetIndex >= 0 && targetIndex < runDataArray.length) {
			setCursorRunId(runDataArray[targetIndex]!.id);
		}
	};
	const handleSetActive = () => {
		if (displayedRun == null) return;
		nodecg.sendMessage("scheduleSetActiveRun", {id: displayedRun.id});
	};
	return (
		<Box sx={{display: "flex", flexDirection: "column", gap: 1, p: 1.5}}>
			<Stack
				direction='row'
				spacing={1}
			>
				<Button
					variant='outlined'
					disabled={cursorIndex <= 0}
					onClick={() => handleMoveCursor(-1)}
				>
					前へ
				</Button>
				<Button
					variant='outlined'
					disabled={
						cursorIndex < 0 || cursorIndex >= (runDataArray?.length ?? 0) - 1
					}
					onClick={() => handleMoveCursor(1)}
				>
					次へ
				</Button>
				<Button
					variant='outlined'
					onClick={() => setAddingRun(true)}
				>
					走行を追加
				</Button>
				<Button
					variant='outlined'
					onClick={() => nodecg.sendMessage("syncSpreadsheet")}
				>
					シート同期
				</Button>
				<Button
					variant='contained'
					disabled={!activeRun?.obsSceneName}
					onClick={() =>
						nodecg.sendMessage("obsChangeScene", activeRun?.obsSceneName)
					}
				>
					開始
				</Button>
				<Button
					variant='outlined'
					disabled={!obsConfig?.setupSceneName}
					onClick={() => nodecg.sendMessage("obsSetupScene")}
				>
					セットアップ画面
				</Button>
			</Stack>
			<Stack
				direction='row'
				spacing={1}
				sx={{alignItems: "center"}}
			>
				<FieldLabel>セットアップシーン</FieldLabel>
				<TextField
					select
					sx={{flex: 1}}
					value={obsConfig?.setupSceneName ?? ""}
					onChange={(e) =>
						setObsConfig({
							...obsConfig,
							setupSceneName: e.target.value || undefined,
						})
					}
				>
					<MenuItem value=''>未選択</MenuItem>
					{obsScenes?.map((scene) => (
						<MenuItem
							key={scene}
							value={scene}
						>
							{scene}
						</MenuItem>
					))}
				</TextField>
			</Stack>
			<Stack spacing={0.5}>
				{displayedRun != null ? (
					<Paper
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
							p: 1.5,
							backgroundColor: "background.paper",
						}}
					>
						<Stack
							direction='row'
							spacing={1}
							sx={{justifyContent: "space-between", alignItems: "flex-start"}}
						>
							<Stack>
								<Typography
									variant='h5'
									component='div'
								>
									{displayedRun.game || "(無題)"}
								</Typography>
								{displayedRun.category && (
									<Typography
										variant='h6'
										component='div'
										color='text.secondary'
									>
										{displayedRun.category}
									</Typography>
								)}
							</Stack>
							<Stack
								direction='column'
								spacing={1}
								sx={{alignItems: "flex-end"}}
							>
								{isActive && (
									<Chip
										label='進行中'
										size='small'
										color='success'
									/>
								)}
								<Stack
									direction='row'
									spacing={1}
								>
									<Button
										variant='outlined'
										disabled={isActive}
										onClick={handleSetActive}
									>
										アクティブにする
									</Button>
									<Button
										variant='outlined'
										startIcon={<EditIcon />}
										onClick={() => setEditingRunId(displayedRun.id)}
									>
										編集
									</Button>
									<Button
										variant='outlined'
										color='error'
										onClick={() =>
											nodecg.sendMessage("scheduleRemoveRun", {
												id: displayedRun.id,
											})
										}
									>
										削除
									</Button>
								</Stack>
							</Stack>
						</Stack>
						{(displayedRun.estimate || displayedRun.scheduledStartTime) && (
							<Typography
								variant='body2'
								color='text.secondary'
							>
								{displayedRun.estimate ? `予想: ${displayedRun.estimate}` : ""}
								{displayedRun.estimate && displayedRun.scheduledStartTime
									? " ・ "
									: ""}
								{displayedRun.scheduledStartTime
									? `開始: ${new Date(displayedRun.scheduledStartTime).toLocaleString("ja-JP", {month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"})}`
									: ""}
							</Typography>
						)}
						<Divider />
						<Stack spacing={0.5}>
							<Typography
								variant='subtitle1'
								component='div'
								sx={{fontWeight: 600}}
							>
								走者
							</Typography>
							{displayedRun.runType === "team" ? (
								<Stack
									direction='row'
									spacing={1}
									sx={{flexWrap: "wrap"}}
								>
									{displayedRun.teams.map((team) => (
										<Paper
											key={team.id}
											variant='outlined'
											sx={{
												p: 0.75,
												minWidth: 120,
												backgroundColor: "#f3f5f7",
												borderColor: "divider",
											}}
										>
											<Typography variant='subtitle2'>
												{team.name ?? "チーム"}
											</Typography>
											<Stack spacing={0.25}>
												{team.players.map((player) => (
													<Typography key={player.id}>{player.name}</Typography>
												))}
											</Stack>
										</Paper>
									))}
								</Stack>
							) : (
								<Stack spacing={0.25}>
									{displayedRun.teams
										.flatMap((team) => team.players)
										.map((player) => (
											<Typography key={player.id}>{player.name}</Typography>
										))}
								</Stack>
							)}
						</Stack>
						<Divider />
						<Stack spacing={0.5}>
							<Typography
								variant='subtitle1'
								component='div'
								sx={{fontWeight: 600}}
							>
								解説
							</Typography>
							{(displayedRun.commentators ?? []).length > 0 ? (
								<Stack spacing={0.25}>
									{displayedRun.commentators?.map((commentator) => (
										<Typography key={commentator.name}>
											{commentator.name}
											{commentator.pronouns && ` (${commentator.pronouns})`}
										</Typography>
									))}
								</Stack>
							) : (
								<Typography color='text.secondary'>解説者なし</Typography>
							)}
						</Stack>
					</Paper>
				) : (
					<Typography color='text.secondary'>走行がありません</Typography>
				)}
			</Stack>
			{addingRun && <AddRunModal onClose={() => setAddingRun(false)} />}
			{editingRunId != null && (
				<RunEditModal
					runId={editingRunId}
					onClose={() => setEditingRunId(null)}
				/>
			)}
		</Box>
	);
};
