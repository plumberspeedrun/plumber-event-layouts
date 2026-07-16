import {type CSSProperties, useEffect, useRef, useState} from "react";
import twitchIcon from "../../assets/icons/twitch.svg";
import twitterIcon from "../../assets/icons/twitter.svg";
import youtubeIcon from "../../assets/icons/youtube.svg";
import type {SnsItem, SnsPlatform} from "../utils/social";

const snsIconUrls: Record<SnsPlatform, string> = {
	twitch: twitchIcon,
	youtube: youtubeIcon,
	twitter: twitterIcon,
};

interface NameplateCardProps {
	name: string;
	snsItems: SnsItem[];
	icon: string;
	iconAlt?: string;
	iconSize?: number;
	iconStyle?: CSSProperties;
	style?: CSSProperties;
	fontSize?: number;
}

const usSnsCycle = (count: number, intervalMs = 5000) => {
	const [index, setIndex] = useState(0);
	const [opacity, setOpacity] = useState(1);
	const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (count <= 1) return;
		const id = setInterval(() => {
			setOpacity(0);
			fadeTimerRef.current = setTimeout(() => {
				setIndex((prev) => (prev + 1) % count);
				setOpacity(1);
			}, 300);
		}, intervalMs);
		return () => {
			clearInterval(id);
			if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
		};
	}, [count, intervalMs]);

	return {index, opacity};
};

export const NameplateCard = ({
	name,
	snsItems,
	icon,
	iconAlt,
	iconSize,
	iconStyle,
	style,
	fontSize = 24,
}: NameplateCardProps) => {
	const {index, opacity} = usSnsCycle(snsItems.length);
	const currentSns = snsItems[index];
	const snsFontSize = fontSize * 0.7;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				borderRadius: 16,
				padding: "8px 16px",
				gap: 22,
				fontFamily: '"Inter Variable", "M PLUS 1p"',
				color: "white",
				...style,
			}}
		>
			<img
				src={icon}
				alt={iconAlt}
				style={{
					width: iconSize ?? fontSize * 1.4,
					height: iconSize ?? fontSize * 1.4,
					flexShrink: 0,
					...iconStyle,
				}}
			/>
			<div
				style={{
					flex: 1,
					minWidth: 0,
					alignSelf: snsItems.length === 0 ? "center" : undefined,
				}}
			>
				<div
					style={{
						fontWeight: 800,
						fontSize,
						paddingLeft: 20,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{name}
				</div>
				{snsItems.length > 0 && (
					<>
						<div
							style={{
								height: 1,
								backgroundColor: "white",
								margin: "10px 0 14px",
							}}
						/>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								opacity,
								transition: "opacity 300ms ease-in-out",
							}}
						>
							{currentSns && (
								<>
									<img
										src={snsIconUrls[currentSns.platform]}
										alt={currentSns.platform}
										style={{
											width: snsFontSize,
											height: snsFontSize,
											flexShrink: 0,
										}}
									/>
									<span
										style={{
											fontWeight: 700,
											fontSize: snsFontSize,
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
										{currentSns.value}
									</span>
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};
