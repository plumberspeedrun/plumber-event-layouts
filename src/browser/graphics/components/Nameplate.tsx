import {type CSSProperties, useEffect, useRef, useState} from "react";
import type {RunDataPlayer} from "../../../types/schedule";
import gamepadIcon from "../../assets/icons/gamepad.svg";
import twitchIcon from "../../assets/icons/twitch.svg";
import twitterIcon from "../../assets/icons/twitter.svg";
import youtubeIcon from "../../assets/icons/youtube.svg";

type SnsPlatform = "twitch" | "youtube" | "twitter";

export type NameplateDisplayItem =
	| {type: "name"; value: string}
	| {type: "sns"; platform: SnsPlatform; value: string};

const snsIconUrls: Record<SnsPlatform, string> = {
	twitch: twitchIcon,
	youtube: youtubeIcon,
	twitter: twitterIcon,
};

const iconStyle: CSSProperties = {
	width: "1em",
	height: "1em",
	flexShrink: 0,
};

const gamepadIconStyle: CSSProperties = {
	...iconStyle,
	width: "1.25em",
	height: "1.25em",
};

const SnsIcon = ({platform}: {platform: SnsPlatform}) => (
	<img
		src={snsIconUrls[platform]}
		alt={platform}
		style={iconStyle}
	/>
);

export const getPlayerDisplayItems = (
	player: RunDataPlayer,
): NameplateDisplayItem[] => {
	const items: NameplateDisplayItem[] = [{type: "name", value: player.name}];

	const {social} = player;
	if (!social) return items;

	const platforms: SnsPlatform[] = ["twitch", "youtube", "twitter"];
	for (const platform of platforms) {
		const value = social[platform];
		if (value) {
			items.push({type: "sns", platform, value});
		}
	}

	return items;
};

export const useNameplateCycle = (
	totalSlides: number,
	intervalMs = 5000,
): number => {
	const [slideIndex, setSlideIndex] = useState(0);

	useEffect(() => {
		setSlideIndex(0);
		if (totalSlides <= 1) return;

		const id = setInterval(() => {
			setSlideIndex((prev) => (prev + 1) % totalSlides);
		}, intervalMs);

		return () => clearInterval(id);
	}, [totalSlides, intervalMs]);

	return slideIndex;
};

interface NameplateProps {
	items: NameplateDisplayItem[];
	slideIndex: number;
	style?: CSSProperties;
}

const containerStyle: CSSProperties = {
	position: "relative",
	display: "flex",
	alignItems: "center",
	fontFamily: '"M PLUS 1p"',
	fontWeight: 900,
	color: "white",
	backgroundColor: "gray",
};

const contentStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
	transition: "opacity 300ms ease-in-out",
};

export const Nameplate = ({items, slideIndex, style}: NameplateProps) => {
	const [opacity, setOpacity] = useState(1);
	const [displayedItem, setDisplayedItem] =
		useState<NameplateDisplayItem | null>(
			items[Math.min(slideIndex, items.length - 1)] ?? null,
		);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevSlideIndexRef = useRef<number | null>(null);

	useEffect(() => {
		const newItem = items[Math.min(slideIndex, items.length - 1)] ?? null;
		const isFirst = prevSlideIndexRef.current === null;
		const slideChanged = prevSlideIndexRef.current !== slideIndex;
		prevSlideIndexRef.current = slideIndex;

		const isSameContent =
			displayedItem?.type === newItem?.type &&
			displayedItem?.value === newItem?.value;

		if (!isFirst && slideChanged && !isSameContent) {
			setOpacity(0);
			timerRef.current = setTimeout(() => {
				setDisplayedItem(newItem);
				setOpacity(1);
			}, 300);
		} else {
			setDisplayedItem(newItem);
		}

		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [slideIndex, items]);

	const textStyle: CSSProperties = {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};

	return (
		<div style={{...containerStyle, ...style}}>
			<div style={{...contentStyle, opacity}}>
				{displayedItem?.type === "sns" && (
					<SnsIcon platform={displayedItem.platform} />
				)}
				{displayedItem?.type === "name" && (
					<img
						src={gamepadIcon}
						alt='name'
						style={gamepadIconStyle}
					/>
				)}
				<span style={textStyle}>{displayedItem?.value ?? ""}</span>
			</div>
		</div>
	);
};
