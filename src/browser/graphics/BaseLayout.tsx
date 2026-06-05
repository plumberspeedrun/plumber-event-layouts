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
				{children}
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
				<Footer />
			</div>
		</>
	);
};
