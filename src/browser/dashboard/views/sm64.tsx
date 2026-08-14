import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import {useObsScenes, useSm64Replicant} from "../../hooks";
import {Panel, Section, SectionTitle} from "../components";
import {renderDashboard} from "../index";

const Sm64Panel = () => {
	const [sm64, setSm64] = useSm64Replicant();
	const obsScenes = useObsScenes();

	const scenes = sm64?.scenes ?? [];
	const activeIndex = sm64?.activeIndex ?? 0;

	if (sm64 == null) return null;

	const handleSelect = (index: number) => {
		setSm64({...sm64, activeIndex: index});
	};

	const handleUpdateObsSceneName = (index: number, sceneName: string) => {
		const newScenes = scenes.map((scene, i) => {
			if (i !== index) return scene;
			return sceneName === ""
				? {label: scene.label}
				: {...scene, obsSceneName: sceneName};
		});
		setSm64({...sm64, scenes: newScenes});
	};

	return (
		<Panel>
			<SectionTitle>シーン</SectionTitle>
			<ToggleButtonGroup
				exclusive
				orientation='vertical'
				value={activeIndex}
				onChange={(_e, index) => {
					if (index != null) handleSelect(index);
				}}
				sx={{width: "100%"}}
			>
				{scenes.map((scene, i) => (
					<ToggleButton
						key={scene.label}
						value={i}
						sx={{
							justifyContent: "flex-start",
							"&.Mui-selected": {
								backgroundColor: "#e2f0e2",
								color: "inherit",
							},
						}}
					>
						<Typography sx={{flex: 1, textAlign: "left"}}>
							{scene.label}
						</Typography>
					</ToggleButton>
				))}
			</ToggleButtonGroup>

			<Section>
				<SectionTitle>OBSシーン</SectionTitle>
				<Stack spacing={1}>
					{scenes.map((scene, i) => (
						<FormControl
							key={scene.label}
							size='small'
							fullWidth
						>
							<InputLabel>{scene.label}</InputLabel>
							<Select
								label={scene.label}
								value={scene.obsSceneName ?? ""}
								onChange={(e) => handleUpdateObsSceneName(i, e.target.value)}
							>
								<MenuItem value=''>未設定</MenuItem>
								{(obsScenes ?? []).map((name) => (
									<MenuItem
										key={name}
										value={name}
									>
										{name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					))}
				</Stack>
			</Section>
		</Panel>
	);
};

renderDashboard(<Sm64Panel />);
