import "@fontsource/m-plus-1p/900.css";
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
}

export const BaseLayout = ({children, backgroundUrl}: IProps) => {
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
				}}
			/>
			{children}
			<Footer />
		</div>
	);
};
