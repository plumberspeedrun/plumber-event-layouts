import type {CSSProperties, ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/m-plus-1p/900.css";
import "../styles/index.scss";

interface NowPlayingProps {
	style?: CSSProperties;
	/** 再生中の曲。null の場合は何も描画しない。 */
	track?: {
		name: string;
		artists?: string[];
		albumImageUrl?: string;
		durationMs?: number;
	} | null;
	isPlaying?: boolean;
	progressMs?: number;
	showArtwork?: boolean;
	artworkSize?: number;
	showProgress?: boolean;
	/** 背景（パネル）を透明にする。 */
	transparent?: boolean;
	/** 再生中/一時停止を示すドットを表示する。 */
	showStatusDot?: boolean;
	/** 左端に表示するアイコン。 */
	icon?: ReactNode;
	fontSize?: number;
	subFontSize?: number;
}

/** マーキーでループする際にテキスト間に空ける幅（px）。 */
const MARQUEE_GAP = 48;

const textStyle = (fontSize: number): CSSProperties => ({
	fontFamily: '"Inter Variable", "M PLUS 1p"',
	fontSize,
	color: "white",
	lineHeight: 1.2,
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
});

/** テキストがコンテナからはみ出す場合に左右スクロール（マーキー）で表示する。 */
const MarqueeText = ({
	children,
	style,
}: {
	children: string;
	style?: CSSProperties;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const [textWidth, setTextWidth] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const measure = () => {
			const container = containerRef.current;
			const text = textRef.current;
			if (container == null || text == null) return;
			setTextWidth(text.scrollWidth);
			setContainerWidth(container.clientWidth);
		};
		measure();
		const observer = new ResizeObserver(measure);
		if (containerRef.current != null) observer.observe(containerRef.current);
		if (textRef.current != null) observer.observe(textRef.current);
		// フォント読み込み後に文字幅が変わるため、読み込み完了時にも再計測する。
		if (document.fonts != null) {
			void document.fonts.ready.then(() => {
				if (!cancelled) measure();
			});
		}
		return () => {
			cancelled = true;
			observer.disconnect();
		};
	}, []);

	const overflowing = textWidth > containerWidth && containerWidth > 0;
	// テキスト 1 コピー分＋ループ間の空白を右から左へ流す（シームレスループ）。
	const loopDistance = textWidth + MARQUEE_GAP;
	const duration = Math.max(4, loopDistance / 20);

	return (
		<div
			ref={containerRef}
			style={{
				overflow: "hidden",
				whiteSpace: "nowrap",
				minWidth: 0,
				...style,
			}}
		>
			<div
				style={{
					display: "inline-block",
					whiteSpace: "nowrap",
					...(overflowing
						? {
								animation: `now-playing-marquee ${duration}s linear infinite`,
								"--now-playing-distance": `${-loopDistance}px`,
							}
						: {}),
				}}
			>
				<span
					ref={textRef}
					style={{display: "inline-block"}}
				>
					{children}
				</span>
				{overflowing && (
					<>
						<span
							aria-hidden='true'
							style={{display: "inline-block", width: MARQUEE_GAP}}
						/>
						<span
							aria-hidden='true'
							style={{display: "inline-block"}}
						>
							{children}
						</span>
					</>
				)}
			</div>
		</div>
	);
};

export const NowPlaying = ({
	style,
	track,
	isPlaying = false,
	progressMs = 0,
	showArtwork = true,
	artworkSize = 64,
	showProgress = true,
	transparent = false,
	showStatusDot = true,
	icon,
	fontSize = 28,
	subFontSize = 20,
}: NowPlayingProps) => {
	if (!track) return null;

	const progressRatio =
		track.durationMs != null && track.durationMs > 0
			? Math.min(100, Math.max(0, (progressMs / track.durationMs) * 100))
			: 0;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 16,
				boxSizing: "border-box",
				padding: "12px 16px",
				backgroundColor: transparent ? "transparent" : "rgba(0, 0, 0, 0.55)",
				borderRadius: 16,
				...style,
			}}
		>
			{icon != null && (
				<div
					style={{
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "white",
					}}
				>
					{icon}
				</div>
			)}
			{showArtwork && track.albumImageUrl && (
				<img
					src={track.albumImageUrl}
					alt=''
					width={artworkSize}
					height={artworkSize}
					style={{
						borderRadius: 12,
						objectFit: "cover",
						flexShrink: 0,
						display: "block",
					}}
				/>
			)}
			<div
				style={{
					flex: 1,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<MarqueeText
					style={{
						...textStyle(fontSize),
						fontWeight: 800,
						textOverflow: "clip",
					}}
				>
					{track.name}
				</MarqueeText>
				{track.artists != null && track.artists.length > 0 && (
					<div
						style={{
							...textStyle(subFontSize),
							fontWeight: 500,
							color: "rgba(255, 255, 255, 0.75)",
							marginTop: 2,
						}}
					>
						{track.artists.join(", ")}
					</div>
				)}
				{showProgress && track.durationMs != null && (
					<div
						style={{
							height: 4,
							backgroundColor: "rgba(255, 255, 255, 0.25)",
							borderRadius: 2,
							overflow: "hidden",
							marginTop: 8,
						}}
					>
						<div
							style={{
								height: "100%",
								width: `${progressRatio}%`,
								backgroundColor: isPlaying
									? "#1db954"
									: "rgba(255, 255, 255, 0.6)",
								borderRadius: 2,
							}}
						/>
					</div>
				)}
			</div>
			{showStatusDot && (
				<div
					style={{
						flexShrink: 0,
						width: 14,
						height: 14,
						borderRadius: "50%",
						backgroundColor: isPlaying ? "#1db954" : "rgba(255, 255, 255, 0.4)",
					}}
					aria-label={isPlaying ? "再生中" : "一時停止"}
				/>
			)}
		</div>
	);
};
