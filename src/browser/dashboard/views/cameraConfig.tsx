import {
	Button,
	Checkbox,
	FormControlLabel,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {useEffect, useState} from "react";
import type {CameraFeeds} from "../../../nodecg/generated/cameraFeeds";
import {useCameraFeeds} from "../../hooks";
import {Panel} from "../components";
import {renderDashboard} from "../index";

const CameraConfig = () => {
	const [feeds, setFeeds] = useCameraFeeds();
	const [draft, setDraft] = useState<CameraFeeds>([]);

	useEffect(() => {
		if (feeds != null) {
			setDraft(feeds);
		}
	}, [feeds]);

	const handleAdd = () => {
		setDraft([
			...draft,
			{
				id: crypto.randomUUID(),
				url: "",
				visible: true,
				label: `カメラ${draft.length + 1}`,
			},
		]);
	};

	const handleRemove = (id: string) => {
		if (feeds == null) return;
		const removed = draft.find((f) => f.id === id);
		setDraft(draft.filter((f) => f.id !== id));
		if (removed && feeds.some((f) => f.id === id)) {
			setFeeds(feeds.filter((f) => f.id !== id));
		}
	};

	const handleUpdate = (
		id: string,
		field: string,
		value: string | number | boolean,
	) => {
		setDraft(draft.map((f) => (f.id === id ? {...f, [field]: value} : f)));
	};

	const handleApplyFeed = (id: string) => {
		if (feeds == null) return;
		const updated = draft.find((f) => f.id === id);
		if (updated == null) return;
		const existing = feeds.find((f) => f.id === id);
		if (existing) {
			setFeeds(feeds.map((f) => (f.id === id ? updated : f)));
		} else {
			setFeeds([...feeds, updated]);
		}
	};

	if (feeds == null) {
		return (
			<Panel height={460}>
				<Typography color='text.secondary'>読み込み中...</Typography>
			</Panel>
		);
	}

	return (
		<Panel height={460}>
			<Stack
				direction='row'
				sx={{justifyContent: "space-between", alignItems: "center"}}
			>
				<Typography variant='subtitle1'>カメラ設定</Typography>
				<Button
					variant='contained'
					onClick={handleAdd}
				>
					追加
				</Button>
			</Stack>

			{draft.length === 0 && (
				<Typography
					color='text.secondary'
					sx={{fontSize: 12}}
				>
					カメラがありません。「追加」ボタンから追加してください。
				</Typography>
			)}

			<Stack spacing={0.5}>
				{draft.map((feed) => {
					const original = feeds.find((f) => f.id === feed.id);
					const changed =
						original != null &&
						(original.url !== feed.url ||
							original.visible !== feed.visible ||
							original.label !== feed.label);
					const isNew = original == null;

					return (
						<Paper
							key={feed.id}
							variant='outlined'
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
								p: 1,
								backgroundColor: "background.paper",
								borderColor: "divider",
							}}
						>
							<Stack
								direction='row'
								spacing={1}
								sx={{alignItems: "center"}}
							>
								<TextField
									sx={{flex: 1}}
									placeholder='ラベル'
									value={feed.label ?? ""}
									onChange={(e) =>
										handleUpdate(feed.id, "label", e.target.value)
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											size='small'
											checked={feed.visible}
											onChange={(e) =>
												handleUpdate(feed.id, "visible", e.target.checked)
											}
										/>
									}
									label='表示'
								/>
								{(changed || isNew) && (
									<Button
										variant='contained'
										color='success'
										onClick={() => handleApplyFeed(feed.id)}
									>
										更新
									</Button>
								)}
								<Button
									variant='outlined'
									color='error'
									onClick={() => handleRemove(feed.id)}
								>
									削除
								</Button>
							</Stack>

							<TextField
								fullWidth
								placeholder='VDO.Ninja URL (例: https://vdo.ninja/?view=XXXX)'
								value={feed.url}
								onChange={(e) => handleUpdate(feed.id, "url", e.target.value)}
							/>
						</Paper>
					);
				})}
			</Stack>
		</Panel>
	);
};

renderDashboard(<CameraConfig />);
