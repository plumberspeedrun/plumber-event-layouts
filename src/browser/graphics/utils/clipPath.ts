/** clip-path (evenodd) の矩形穴を表す。 */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** clip-path (evenodd) 用の矩形穴の SVG path 文字列を返す。 */
export const rectHole = ({x, y, w, h}: Rect): string =>
	`M${x} ${y} H${x + w} V${y + h} H${x} Z`;

/** 1920x1080 の背景画像に穴を開ける clip-path 文字列を組み立てる。 */
export const buildClipPath = (holes: readonly Rect[]): string =>
	`path(evenodd, "M0 0 H1920 V1080 H0 Z ${holes.map(rectHole).join(" ")}")`;
