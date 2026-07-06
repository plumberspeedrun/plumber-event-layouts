import type {CSSProperties} from "react";
import type {RunDataCommentator} from "../../../types/schedule";
import commentatorIcon from "../../assets/icons/commentator.svg";
import {Nameplate, type NameplateDisplayItem} from "./Nameplate";

export const getCommentatorDisplayItems = (
	commentator: RunDataCommentator,
): NameplateDisplayItem[] => {
	const items: NameplateDisplayItem[] = [
		{type: "name", value: commentator.name},
	];

	const {social} = commentator;
	if (!social) return items;

	const platforms: Array<"twitch" | "youtube" | "twitter"> = [
		"twitch",
		"youtube",
		"twitter",
	];
	for (const platform of platforms) {
		const value = social[platform];
		if (value) {
			items.push({type: "sns", platform, value});
		}
	}

	return items;
};

interface CommentatorProps {
	commentator: RunDataCommentator;
	slideIndex: number;
	style?: CSSProperties;
}

export const Commentator = ({
	commentator,
	slideIndex,
	style,
}: CommentatorProps) => (
	<Nameplate
		items={getCommentatorDisplayItems(commentator)}
		slideIndex={slideIndex}
		nameIcon={commentatorIcon}
		nameIconAlt='commentator'
		style={style}
	/>
);
