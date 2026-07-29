import type {CSSProperties} from "react";
import type {RunDataCommentator} from "../../../types/schedule";
import commentatorIcon from "../../assets/icons/commentator.svg";
import {getSnsItems} from "../utils/social";
import {Nameplate, type NameplateDisplayItem} from "./Nameplate";

export const getCommentatorDisplayItems = (
	commentator: RunDataCommentator,
): NameplateDisplayItem[] => {
	const items: NameplateDisplayItem[] = [
		{type: "name", value: commentator.name},
	];

	for (const snsItem of getSnsItems(commentator.social)) {
		items.push({type: "sns", ...snsItem});
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
