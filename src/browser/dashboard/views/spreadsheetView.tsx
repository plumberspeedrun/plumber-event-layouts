import {
	useSheetCommentators,
	useSheetRunners,
	useSpreadsheetStatus,
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

const sectionStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 4,
	borderTop: "1px solid #5b6e8c",
	paddingTop: 8,
};

const formatSocial = (social?: {
	twitch?: string;
	youtube?: string;
	twitter?: string;
	niconico?: string;
}) => {
	if (social == null) return "";
	return [
		social.twitch && `Twitch: ${social.twitch}`,
		social.youtube && `YouTube: ${social.youtube}`,
		social.twitter && `Twitter: ${social.twitter}`,
		social.niconico && `niconico: ${social.niconico}`,
	]
		.filter(Boolean)
		.join(" / ");
};

const SpreadsheetView = () => {
	const status = useSpreadsheetStatus();
	const sheetRunners = useSheetRunners();
	const sheetCommentators = useSheetCommentators();

	return (
		<div style={containerStyle}>
			<div style={rowStyle}>
				<div style={{flex: 1}}>
					<div>
						状態:{" "}
						{status?.enabled ? (
							<span style={{color: "#8fdc7a"}}>有効</span>
						) : (
							<span style={{color: "#dc7a7a"}}>無効</span>
						)}
					</div>
					<div>最終同期: {status?.lastSynced ?? "未同期"}</div>
					{status?.lastError && (
						<div style={{color: "#dc7a7a"}}>エラー: {status.lastError}</div>
					)}
				</div>
				<button
					style={buttonStyle}
					onClick={() => nodecg.sendMessage("syncSpreadsheet")}
				>
					シート同期
				</button>
			</div>

			<div style={sectionStyle}>
				<strong>ランナー一覧</strong>
				{sheetRunners == null || sheetRunners.length === 0 ? (
					<div>データがありません</div>
				) : (
					sheetRunners.map((runner, index) => (
						<div
							key={`${runner.name}-${index}`}
							style={rowStyle}
						>
							<div style={{flex: 1}}>
								<div>{runner.name}</div>
								<div style={{fontSize: 11, color: "#b9c2d4"}}>
									{formatSocial(runner.social)}
								</div>
							</div>
						</div>
					))
				)}
			</div>

			<div style={sectionStyle}>
				<strong>解説者一覧</strong>
				{sheetCommentators == null || sheetCommentators.length === 0 ? (
					<div>データがありません</div>
				) : (
					sheetCommentators.map((commentator, index) => (
						<div
							key={`${commentator.game}-${commentator.name}-${index}`}
							style={rowStyle}
						>
							<div style={{flex: 1}}>
								<div>
									<strong>{commentator.game}</strong> {commentator.name}
									{commentator.pronouns && ` (${commentator.pronouns})`}
								</div>
								<div style={{fontSize: 11, color: "#b9c2d4"}}>
									{formatSocial(commentator.social)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

render(<SpreadsheetView />);
