export const formatTime = (time: string): string => {
	return time.replace(/^0+(?=\d:)/, "");
};
