import {useReplicant} from "@nodecg/react-hooks";
import {Assets} from "../../../types/assets";

interface LogoProps {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
}

export const Logo = (props: LogoProps) => {
	const [assets] = useReplicant<Assets[]>("assets:logo");

	if (!assets || assets.length === 0) return null;
	return (
		<img
			src={assets[0]?.url}
			style={{
				position: "absolute",
				width: props.width,
				height: props.height,
				left: props.x,
				top: props.y,
			}}
		/>
	);
};
