import "@fontsource/m-plus-1p/900.css";
import {CSSProperties, ReactNode} from "react";

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

const Footer = () => {
	return (
		<div
			style={{
				position: "absolute",
				top: 1030,
				width: "1920px",
				height: "50px",
				backgroundColor: "#202020",
				display: "flex",
				alignItems: "center",
				fontSize: 32,
				fontFamily: '"M PLUS 1p"',
				fontWeight: 900,
				color: "white",
			}}
		>
			<div>hi</div>
		</div>
	);
};

export const BaseLayout = ({children, backgroundUrl}: IProps) => {
	return (
		<>
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
		</>
	);
};
