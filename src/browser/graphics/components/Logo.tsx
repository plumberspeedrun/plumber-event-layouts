import {useLogoAsset} from "../../hooks";

interface LogoProps {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
}

export const Logo = (props: LogoProps) => {
	const asset = useLogoAsset();

	if (!asset) return null;
	return (
		<img
			src={asset.url}
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
