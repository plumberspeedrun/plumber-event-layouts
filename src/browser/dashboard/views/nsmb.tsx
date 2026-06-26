import {useEffect, useState} from "react";
import {useNsmbReplicant, useSheetCommentators} from "../../hooks";
import {render} from "../../render";

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

const NsmbPanel = () => {
	const [nsmb, setNsmb] = useNsmbReplicant();
	const sheetCommentators = useSheetCommentators();

	const [runnerInput, setRunnerInput] = useState("");
	const [pickedCommentator, setPickedCommentator] = useState("");
	const [newCommentatorName, setNewCommentatorName] = useState("");

	const activeIndex = nsmb?.activeIndex ?? 0;
	const relayData = nsmb?.relayData ?? [];
	const activeRelay = relayData[activeIndex];

	useEffect(() => {
		setRunnerInput(activeRelay?.runner ?? "");
	}, [activeRelay?.runner]);

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
			i === activeIndex ? {...item, runner: runnerInput} : item,
		);
		setNsmb({...nsmb, relayData: newRelayData});
	};

	const handleAddCommentator = (name: string) => {
		if (activeRelay == null) return;
		if ((activeRelay.commentators ?? []).includes(name)) return;
		const newRelayData = relayData.map((item, i) =>
			i === activeIndex
				? {...item, commentators: [...(item.commentators ?? []), name]}
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
						commentators: (item.commentators ?? []).filter((c) => c !== name),
					}
				: item,
		);
		setNsmb({...nsmb, relayData: newRelayData});
	};

	return (
		<div style={containerStyle}>
			<div style={{display: "flex", gap: 8, alignItems: "center"}}>
				<button
					style={buttonStyle}
					disabled={activeIndex <= 0}
					onClick={handlePrev}
				>
					前へ
				</button>
				<button
					style={buttonStyle}
					disabled={activeIndex >= relayData.length - 1}
					onClick={handleNext}
				>
					次へ
				</button>
				<span>
					{activeIndex + 1} / {relayData.length}
				</span>
			</div>

			<div style={{display: "flex", flexDirection: "column", gap: 4}}>
				{relayData.map((relay, i) => (
					<div
						key={i}
						style={i === activeIndex ? activeRowStyle : rowStyle}
						onClick={() => setNsmb({...nsmb, activeIndex: i})}
					>
						<div style={{flex: 1}}>
							{relay.game} / {relay.platform} / {relay.year}
						</div>
					</div>
				))}
			</div>

			{activeRelay != null && (
				<div style={sectionStyle}>
					<div>
						{activeRelay.game} / {activeRelay.platform} / {activeRelay.year}
					</div>

					<div style={{display: "flex", flexDirection: "column", gap: 4}}>
						<strong>走者</strong>
						<div style={{display: "flex", gap: 8}}>
							<input
								style={{...inputStyle, flex: 1}}
								value={runnerInput}
								onChange={(e) => setRunnerInput(e.target.value)}
							/>
							<button
								style={buttonStyle}
								onClick={handleUpdateRunner}
							>
								更新
							</button>
						</div>
					</div>

					<div style={{display: "flex", flexDirection: "column", gap: 4}}>
						<strong>解説者</strong>
						{(activeRelay.commentators ?? []).map((name) => (
							<div
								key={name}
								style={rowStyle}
							>
								<div style={{flex: 1}}>{name}</div>
								<button
									style={buttonStyle}
									onClick={() => handleRemoveCommentator(name)}
								>
									削除
								</button>
							</div>
						))}

						<div style={{display: "flex", gap: 8}}>
							<select
								style={inputStyle}
								value={pickedCommentator}
								onChange={(e) => setPickedCommentator(e.target.value)}
							>
								<option value=''>シートから選択</option>
								{sheetCommentators?.map((c) => (
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
								disabled={pickedCommentator === ""}
								onClick={() => {
									handleAddCommentator(pickedCommentator);
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
									handleAddCommentator(newCommentatorName.trim());
									setNewCommentatorName("");
								}}
							>
								追加
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

render(<NsmbPanel />);
