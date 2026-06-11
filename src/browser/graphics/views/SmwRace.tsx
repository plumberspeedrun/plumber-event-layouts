import {useReplicant} from "@nodecg/react-hooks";
import {Assets} from "../../../types/assets";
import {render} from "../../render";
import {BaseLayout} from "../BaseLayout";
import {Logo} from "../components/Logo";

const App = () => {
	const [bgAsset] = useReplicant<Assets[]>("assets:background");
	if (!bgAsset || bgAsset.length === 0) {
		return (
			<>
				<div>レイアウト画像をアセットにアップロードしてください。</div>
			</>
		);
	}

	return (
		<>
			<BaseLayout backgroundUrl={bgAsset[0]?.url}>
				<Logo
					width={500}
					x={0}
					y={0}
				/>
			</BaseLayout>
		</>
	);
};

render(<App />);
