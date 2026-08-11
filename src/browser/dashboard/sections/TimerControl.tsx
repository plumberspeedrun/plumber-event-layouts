import "@fontsource/m-plus-1p/400.css";
import {Box, Button, Chip, Divider, Stack, Typography} from "@mui/material";
import {Fragment} from "react";
import {useActiveRun, useTimer} from "../../hooks";

declare const nodecg: {
	sendMessage(name: string, cb?: (err: Error | null) => void): void;
	sendMessage(
		name: string,
		data: unknown,
		cb?: (err: Error | null) => void,
	): void;
};

export const TimerControl = () => {
	const timer = useTimer();
	const activeRun = useActiveRun();

	const state = timer?.state;
	const canStart = state === "stopped" || state === "paused";
	const canPause = state === "running";
	const canReset =
		state === "finished" || state === "paused" || state === "stopped";

	const stateColor =
		state === "running"
			? "success.main"
			: state === "paused"
				? "warning.main"
				: state === "finished"
					? "primary.main"
					: "text.primary";

	const teams = activeRun?.teams ?? [];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1,
				p: 1.5,
			}}
		>
			<Typography
				sx={{
					fontSize: 52,
					fontWeight: 400,
					fontFamily: '"M PLUS 1p"',
					textAlign: "center",
					fontVariantNumeric: "tabular-nums",
				}}
				color={stateColor}
			>
				{timer?.time ?? "00:00:00"}
			</Typography>

			<Stack
				direction='row'
				spacing={1}
				sx={{justifyContent: "center"}}
			>
				<Button
					variant='contained'
					color='success'
					disabled={!canStart}
					onClick={() => nodecg.sendMessage("timerStart")}
				>
					開始/再開
				</Button>
				<Button
					variant='contained'
					color='warning'
					disabled={!canPause}
					onClick={() => nodecg.sendMessage("timerPause")}
				>
					一時停止
				</Button>
				<Button
					variant='outlined'
					disabled={!canReset}
					onClick={() => nodecg.sendMessage("timerReset")}
				>
					リセット
				</Button>
			</Stack>

			{teams.length > 0 && (
				<>
					<Divider />
					<Stack>
						{teams.map((team, index) => {
							const result = activeRun?.result?.[team.id];
							return (
								<Fragment key={team.id}>
									{index > 0 && <Divider />}
									<Stack
										direction='row'
										spacing={1}
										sx={{alignItems: "center", py: 1}}
									>
										<Typography sx={{flex: 1}}>
											{team.name ?? team.players.map((p) => p.name).join(", ")}
										</Typography>
										{result != null ? (
											<>
												<Chip
													size='small'
													color={
														result.state === "completed" ? "success" : "default"
													}
													label={result.state === "completed" ? "完走" : "棄権"}
												/>
												<Typography color='text.secondary'>
													{result.time}
												</Typography>
												<Button
													variant='outlined'
													color='error'
													size='small'
													onClick={() =>
														nodecg.sendMessage("timerUndoSplit", {
															teamId: team.id,
														})
													}
												>
													取り消し
												</Button>
											</>
										) : (
											<>
												<Button
													variant='contained'
													color='success'
													onClick={() =>
														nodecg.sendMessage("timerSplit", {
															teamId: team.id,
															state: "completed",
														})
													}
												>
													完走
												</Button>
												<Button
													variant='outlined'
													color='error'
													onClick={() =>
														nodecg.sendMessage("timerSplit", {
															teamId: team.id,
															state: "forfeit",
														})
													}
												>
													棄権
												</Button>
											</>
										)}
									</Stack>
								</Fragment>
							);
						})}
					</Stack>
				</>
			)}
		</Box>
	);
};
