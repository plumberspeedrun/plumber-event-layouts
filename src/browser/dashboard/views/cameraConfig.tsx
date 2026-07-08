import {useEffect, useState} from "react";
import type {CameraFeeds} from "../../../nodecg/generated/cameraFeeds";
import {useCameraFeeds} from "../../hooks";
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

const rowStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 4,
	padding: 8,
	borderRadius: 4,
	background: "#3a4760",
};

const inputStyle: React.CSSProperties = {
	background: "#1f2937",
	color: "#fff",
	border: "1px solid #5b6e8c",
	borderRadius: 4,
	padding: "4px 6px",
};

const buttonStyle: React.CSSProperties = {
	background: "#475873",
	color: "#fff",
	border: "1px solid #5b6e8c",
	borderRadius: 4,
	padding: "4px 8px",
	cursor: "pointer",
};

const updateButtonStyle: React.CSSProperties = {
	...buttonStyle,
	background: "#3d7a3d",
	borderColor: "#5a9a5a",
	fontWeight: "bold",
};

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
			<div style={containerStyle}>
				<div>読み込み中...</div>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<strong>カメラ設定</strong>
				<button
					style={buttonStyle}
					onClick={handleAdd}
				>
					追加
				</button>
			</div>

			{draft.length === 0 && (
				<div style={{color: "#889", fontSize: 12}}>
					カメラがありません。「追加」ボタンから追加してください。
				</div>
			)}

			{draft.map((feed) => {
				const original = feeds.find((f) => f.id === feed.id);
				const changed =
					original != null &&
					(original.url !== feed.url ||
						original.visible !== feed.visible ||
						original.label !== feed.label);
				const isNew = original == null;

				return (
					<div
						key={feed.id}
						style={rowStyle}
					>
						<div style={{display: "flex", gap: 8, alignItems: "center"}}>
							<input
								style={{...inputStyle, flex: 1}}
								placeholder='ラベル'
								value={feed.label ?? ""}
								onChange={(e) => handleUpdate(feed.id, "label", e.target.value)}
							/>
							<label
								style={{
									display: "flex",
									gap: 4,
									alignItems: "center",
									fontSize: 12,
								}}
							>
								<input
									type='checkbox'
									checked={feed.visible}
									onChange={(e) =>
										handleUpdate(feed.id, "visible", e.target.checked)
									}
								/>
								表示
							</label>
							{(changed || isNew) && (
								<button
									style={updateButtonStyle}
									onClick={() => handleApplyFeed(feed.id)}
								>
									更新
								</button>
							)}
							<button
								style={{
									...buttonStyle,
									background: "#8b3a3a",
									borderColor: "#a55",
								}}
								onClick={() => handleRemove(feed.id)}
							>
								削除
							</button>
						</div>

						<input
							style={inputStyle}
							placeholder='VDO.Ninja URL (例: https://vdo.ninja/?view=XXXX)'
							value={feed.url}
							onChange={(e) => handleUpdate(feed.id, "url", e.target.value)}
						/>
					</div>
				);
			})}
		</div>
	);
};

render(<CameraConfig />);
