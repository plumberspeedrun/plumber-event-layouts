import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import {
	Button,
	IconButton,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {useEffect, useState} from "react";
import {useNsmbReplicant, useObsScenes} from "../../hooks";
import {Panel, Row, Section, SectionTitle} from "../components";
import {renderDashboard} from "../index";

const NsmbPanel = () => {
	const [nsmb, setNsmb] = useNsmbReplicant();
	const obsScenes = useObsScenes();

	const [runnerInput, setRunnerInput] = useState("");
	const [newCommentatorName, setNewCommentatorName] = useState("");

	const activeIndex = nsmb?.activeIndex ?? 0;
	const relayData = nsmb?.relayData ?? [];
	const activeRelay = relayData[activeIndex];

	useEffect(() => {
		setRunnerInput(activeRelay?.runner?.name ?? "");
	}, [activeRelay?.runner?.name]);

	if (nsmb == null) return null;

	const handlePrev = () => {
		if (activeIndex <= 0) return;
		setNsmb({...nsmb, activeIndex: activeIndex - 1});
	};

	const handleNext = () => {
		if (activeIndex >= relayData.length - 1) return;
		setNsmb({...nsmb, activeIndex: activeIndex + 1});
	};

	const handleUpdateRunner = () => {
		const newRelayData = relayData.map((item, i) =>
			i === activeIndex
				? {...item, runner: {...item.runner, name: runnerInput}}
				: item,
		);
		setNsmb({...nsmb, relayData: newRelayData});
	};

	const handleAddCommentator = (name: string) => {
		if (activeRelay == null) return;
		if ((activeRelay.commentators ?? []).some((c) => c.name === name)) return;
		const newRelayData = relayData.map((item, i) =>
			i === activeIndex
				? {...item, commentators: [...(item.commentators ?? []), {name}]}
				: item,
		);
		setNsmb({...nsmb, relayData: newRelayData});
	};

	const handleRemoveCommentator = (name: string) => {
		if (activeRelay == null) return;
		const newRelayData = relayData.map((item, i) =>
			i === activeIndex
				? {
						...item,
						commentators: (item.commentators ?? []).filter(
							(c) => c.name !== name,
						),
					}
				: item,
		);
		setNsmb({...nsmb, relayData: newRelayData});
	};

	const handleUpdateObsSceneName = (sceneName: string) => {
		const newRelayData = relayData.map((item, i) => {
			if (i !== activeIndex) return item;
			const {obsSceneName: _obsSceneName, ...rest} = item;
			return sceneName === "" ? rest : {...rest, obsSceneName: sceneName};
		});
		setNsmb({...nsmb, relayData: newRelayData});
	};

	return (
		<Panel height={520}>
			<Stack
				direction='row'
				spacing={0.5}
				sx={{alignItems: "center"}}
			>
				<IconButton
					size='small'
					aria-label='前へ'
					disabled={activeIndex <= 0}
					onClick={handlePrev}
				>
					<ChevronLeft fontSize='small' />
				</IconButton>
				<IconButton
					size='small'
					aria-label='次へ'
					disabled={activeIndex >= relayData.length - 1}
					onClick={handleNext}
				>
					<ChevronRight fontSize='small' />
				</IconButton>
				<Typography color='text.secondary'>
					{activeIndex + 1} / {relayData.length}
				</Typography>
			</Stack>

			<Stack spacing={0.5}>
				{relayData.map((relay, i) => (
					<Row
						key={i}
						active={i === activeIndex}
						onClick={() => setNsmb({...nsmb, activeIndex: i})}
					>
						<Typography sx={{flex: 1}}>
							{relay.game} / {relay.category} / {relay.platform} / {relay.year}
						</Typography>
					</Row>
				))}
			</Stack>

			{activeRelay != null && (
				<>
					<Typography>
						{activeRelay.game} / {activeRelay.category} / {activeRelay.platform}{" "}
						/ {activeRelay.year}
					</Typography>

					<Section>
						<SectionTitle>走者</SectionTitle>
						<Stack
							direction='row'
							spacing={1}
						>
							<TextField
								fullWidth
								value={runnerInput}
								onChange={(e) => setRunnerInput(e.target.value)}
							/>
							<Button
								variant='contained'
								onClick={handleUpdateRunner}
							>
								更新
							</Button>
						</Stack>
					</Section>

					<Section>
						<SectionTitle>解説者</SectionTitle>
						<Stack spacing={0.5}>
							{(activeRelay.commentators ?? []).map((c) => (
								<Row key={c.name}>
									<Typography sx={{flex: 1}}>{c.name}</Typography>
									<Button
										variant='outlined'
										color='error'
										onClick={() => handleRemoveCommentator(c.name)}
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
								fullWidth
								placeholder='解説者名を入力'
								value={newCommentatorName}
								onChange={(e) => setNewCommentatorName(e.target.value)}
							/>
							<Button
								variant='contained'
								disabled={newCommentatorName.trim() === ""}
								onClick={() => {
									handleAddCommentator(newCommentatorName.trim());
									setNewCommentatorName("");
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
							value={activeRelay.obsSceneName ?? ""}
							onChange={(e) => handleUpdateObsSceneName(e.target.value)}
						>
							<MenuItem value=''>未設定</MenuItem>
							{(obsScenes ?? []).map((scene) => (
								<MenuItem
									key={scene}
									value={scene}
								>
									{scene}
								</MenuItem>
							))}
						</TextField>
					</Section>
				</>
			)}
		</Panel>
	);
};

renderDashboard(<NsmbPanel />);
