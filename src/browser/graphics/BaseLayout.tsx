import "@fontsource/m-plus-1p/900.css";
import "@fontsource-variable/inter/wght.css";
import type {CSSProperties, ReactNode} from "react";
import {Footer} from "./components/Footer";

const containerStyle: CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	width: "1920px",
	height: "1080px",
};

interface IProps {
	children?: ReactNode;
	backgroundUrl?: string;
	/** 背景画像に適用する clip-path。透過領域を指定する（例: カメラ領域）。 */
	backgroundClipPath?: string;
}

export const BaseLayout = ({
	children,
	backgroundUrl,
	backgroundClipPath,
}: IProps) => {
	return (
		<div style={containerStyle}>
			<img
				src={backgroundUrl}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "1920px",
					height: "1080px",
					...(backgroundClipPath != null && {clipPath: backgroundClipPath}),
				}}
			/>
			{children}
			<Footer />
		</div>
	);
};
