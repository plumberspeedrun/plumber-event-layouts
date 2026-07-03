import {type CSSProperties, useEffect, useRef, useState} from "react";
import type {RunDataPlayer} from "../../../types/schedule";
import gamepadIcon from "../../assets/icons/gamepad.svg";
import twitchIcon from "../../assets/icons/twitch.svg";
import twitterIcon from "../../assets/icons/twitter.svg";
import youtubeIcon from "../../assets/icons/youtube.svg";
import {formatTime} from "../../utils/formatTime";

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
	marginLeft: "5px",
	flexShrink: 0,
};

const gamepadIconStyle: CSSProperties = {
	...iconStyle,
	width: "1.25em",
	height: "1.25em",
};

const SnsIcon = ({
	platform,
	style,
}: {
	platform: SnsPlatform;
	style?: CSSProperties;
}) => (
	<img
		src={snsIconUrls[platform]}
		alt={platform}
		style={{...iconStyle, ...style}}
	/>
);

const twitterIconStyle: CSSProperties = {
	width: "0.875em",
	height: "0.875em",
};

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

interface NameplateResult {
	time: string;
	state: "completed" | "forfeit";
}

interface NameplateProps {
	items: NameplateDisplayItem[];
	slideIndex: number;
	result?: NameplateResult;
	style?: CSSProperties;
}

const containerStyle: CSSProperties = {
	position: "relative",
	display: "flex",
	alignItems: "center",
	fontFamily: '"Inter Variable", "M PLUS 1p"',
	fontWeight: 800,
	color: "white",
	backgroundColor: "black",
};

const contentStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
	transition: "opacity 300ms ease-in-out",
	flex: 1,
	minWidth: 0,
};

const resultStyle: CSSProperties = {
	marginLeft: "auto",
	flexShrink: 0,
	fontVariantNumeric: "tabular-nums",
	paddingLeft: "12px",
	paddingRight: "8px",
};

export const Nameplate = ({
	items,
	slideIndex,
	result,
	style,
}: NameplateProps) => {
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

		const itemKey = (item: NameplateDisplayItem | null) => {
			if (!item) return null;
			return item.type === "sns"
				? `${item.platform}:${item.value}`
				: item.value;
		};
		const isSameContent = itemKey(displayedItem) === itemKey(newItem);

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
					<SnsIcon
						platform={displayedItem.platform}
						style={
							displayedItem.platform === "twitter"
								? twitterIconStyle
								: undefined
						}
					/>
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
			{result && (
				<span
					style={{
						...resultStyle,
						color: result.state === "completed" ? "gold" : "gray",
					}}
				>
					{formatTime(result.time)}
				</span>
			)}
		</div>
	);
};
