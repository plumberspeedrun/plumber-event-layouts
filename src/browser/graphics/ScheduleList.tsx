import {useRunDataArray} from "../hooks";

export const ScheduleList = () => {
	const runDataArray = useRunDataArray();

	return (
		<div>
			{runDataArray?.map((runData) => (
				<div key={runData.id}>
					<span>{runData.game}</span>
					<span>{runData.system}</span>
					<span>{runData.category}</span>
					<span>
						{runData.teams
							.flatMap((t) => t.players.map((p) => p.name))
							.join(", ")}
					</span>
					<span>
						{runData.teams
							.flatMap((t) => t.players.map((p) => p.social?.twitch))
							.join(", ")}
					</span>
				</div>
			))}
		</div>
	);
};
