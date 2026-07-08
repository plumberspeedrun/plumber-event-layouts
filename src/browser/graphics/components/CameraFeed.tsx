import {type CSSProperties, useMemo} from "react";

interface CameraFeedProps {
	url: string;
	style?: CSSProperties;
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

export const CameraFeed = ({url, style}: CameraFeedProps) => {
	const src = useMemo(() => cleanUrl(url), [url]);

	return (
		<div
			style={{
				position: "relative",
				overflow: "hidden",
				background: "#000",
				border: "3px solid #fff",
				borderRadius: 15,
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
					borderRadius: 8,
				}}
				allow='autoplay; camera; microphone'
			/>
		</div>
	);
};
