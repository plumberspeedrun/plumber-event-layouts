import type {RunDataCommentator, RunDataPlayer} from "../../../types/schedule";

export type SnsPlatform = "twitch" | "youtube" | "twitter";

export interface SnsItem {
	platform: SnsPlatform;
	value: string;
}

type Social = RunDataPlayer["social"] | RunDataCommentator["social"];

const snsPlatforms: SnsPlatform[] = ["twitch", "youtube", "twitter"];

export const getSnsItems = (social?: Social): SnsItem[] => {
	if (!social) return [];

	const items: SnsItem[] = [];
	for (const platform of snsPlatforms) {
		const value = social[platform];
		if (value) items.push({platform, value});
	}
	return items;
};
