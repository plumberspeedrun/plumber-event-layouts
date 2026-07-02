import type {CSSProperties} from "react";

const footerStyle: CSSProperties = {
	position: "absolute",
	bottom: 0,
	width: "1920px",
	height: "50px",
	backgroundColor: "rgba(0, 0, 0, 0.5)",
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "0 16px",
	boxSizing: "border-box",
	fontSize: 32,
	fontFamily: '"M PLUS 1p"',
	fontWeight: 900,
	color: "white",
};

export const Footer = () => {
	return (
		<div style={footerStyle}>
			<div>
				配管工の夏休みはマリオシリーズを対象としたオフラインRTAイベントです。
			</div>
			<div>#配管工の夏休み</div>
		</div>
	);
};
