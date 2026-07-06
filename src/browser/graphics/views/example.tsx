import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import "../styles/index.scss";

const App = () => {
	// const upcomingRunData = useUpcomingRunData();
	return (
		<BaseLayout />
		// <div id='container' style={{ left: 0, top: 0, position: "absolute", width: "1920px", height: "1080px", color: 'black' }}>
		//     <div>This is example.</div>
		//     <Timer />
		//     <ScheduleList />
		//     <div>{upcomingRunData?.game}</div>
		// </div>
	);
};

render(<App />);
