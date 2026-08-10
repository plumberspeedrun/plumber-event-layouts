import {Button, Stack, Typography} from "@mui/material";
import {useSheetStaff, useSpreadsheetStatus} from "../../hooks";
import {Panel, Row, Section, SectionTitle} from "../components";
import {renderDashboard} from "../index";

declare const nodecg: {
	sendMessage(name: string, cb?: (err: Error | null) => void): void;
	sendMessage(
		name: string,
		data: unknown,
		cb?: (err: Error | null) => void,
	): void;
};

const formatSocial = (social?: {
	discord?: string;
	twitch?: string;
	youtube?: string;
	twitter?: string;
}) => {
	if (social == null) return "";
	return [
		social.discord && `Discord: ${social.discord}`,
		social.twitch && `Twitch: ${social.twitch}`,
		social.youtube && `YouTube: ${social.youtube}`,
		social.twitter && `Twitter: ${social.twitter}`,
	]
		.filter(Boolean)
		.join(" / ");
};

const SpreadsheetView = () => {
	const status = useSpreadsheetStatus();
	const sheetStaff = useSheetStaff();
	const sheetRunners = sheetStaff?.filter((s) => s.role === "runner");
	const sheetCommentators = sheetStaff?.filter((s) => s.role === "commentator");

	return (
		<Panel height={560}>
			<Row>
				<Stack sx={{flex: 1}}>
					<Typography>
						状態:{" "}
						{status?.enabled ? (
							<Typography
								component='span'
								color='success.main'
							>
								有効
							</Typography>
						) : (
							<Typography
								component='span'
								color='error.main'
							>
								無効
							</Typography>
						)}
					</Typography>
					<Typography color='text.secondary'>
						最終同期: {status?.lastSynced ?? "未同期"}
					</Typography>
					{status?.lastError && (
						<Typography color='error.main'>
							エラー: {status.lastError}
						</Typography>
					)}
				</Stack>
				<Button
					variant='contained'
					onClick={() => nodecg.sendMessage("syncSpreadsheet")}
				>
					シート同期
				</Button>
			</Row>

			<Section>
				<SectionTitle>ランナー一覧</SectionTitle>
				{sheetRunners == null || sheetRunners.length === 0 ? (
					<Typography color='text.secondary'>データがありません</Typography>
				) : (
					<Stack spacing={0.5}>
						{sheetRunners.map((runner, index) => (
							<Row key={`${runner.name}-${index}`}>
								<Stack sx={{flex: 1}}>
									<Typography>{runner.name}</Typography>
									<Typography
										variant='caption'
										color='text.secondary'
									>
										{formatSocial(runner.social)}
									</Typography>
								</Stack>
							</Row>
						))}
					</Stack>
				)}
			</Section>

			<Section>
				<SectionTitle>解説者一覧</SectionTitle>
				{sheetCommentators == null || sheetCommentators.length === 0 ? (
					<Typography color='text.secondary'>データがありません</Typography>
				) : (
					<Stack spacing={0.5}>
						{sheetCommentators.map((commentator, index) => (
							<Row key={`${commentator.game}-${commentator.name}-${index}`}>
								<Stack sx={{flex: 1}}>
									<Typography>
										<strong>{commentator.game}</strong> {commentator.name}
									</Typography>
									<Typography
										variant='caption'
										color='text.secondary'
									>
										{formatSocial(commentator.social)}
									</Typography>
								</Stack>
							</Row>
						))}
					</Stack>
				)}
			</Section>
		</Panel>
	);
};

renderDashboard(<SpreadsheetView />);
