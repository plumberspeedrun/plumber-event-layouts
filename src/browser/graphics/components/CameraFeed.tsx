import {type CSSProperties, useMemo} from "react";

interface CameraFeedProps {
	url: string;
	style?: CSSProperties;
	framed?: boolean;
}

const cleanUrl = (url: string): string => {
	try {
		const u = new URL(url);
		u.searchParams.set("mute", "");
		u.searchParams.set("nocontrols", "");
		u.searchParams.set("cleanoutput", "");
		return u.toString();
	} catch {
		return url;
	}
};

export const CameraFeed = ({url, style, framed = true}: CameraFeedProps) => {
	const src = useMemo(() => cleanUrl(url), [url]);

	return (
		<div
			style={{
				position: "relative",
				overflow: "hidden",
				background: "#000",
				boxSizing: "border-box",
				border: framed ? "3px solid #fff" : "none",
				borderRadius: framed ? 15 : 0,
				...style,
			}}
		>
			<iframe
				src={src}
				style={{
					position: "absolute",
					top: "-5%",
					left: "-5%",
					width: "110%",
					height: "110%",
					border: "none",
					borderRadius: framed ? 8 : 0,
				}}
				allow='autoplay; camera; microphone'
			/>
		</div>
	);
};
