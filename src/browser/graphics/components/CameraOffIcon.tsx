import cameraOffIcon from "../../assets/icons/camera-off.svg";
import type {Rect} from "../utils/clipPath";

/** カメラ非表示時にカメラ領域へ表示する「カメラオフ」アイコン。 */
export const CameraOffIcon = ({x, y, w, h}: Rect) => {
	const iconSize = Math.round(Math.min(w, h) * 0.45);

	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: w,
				height: h,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<img
				src={cameraOffIcon}
				alt=''
				width={iconSize}
				height={iconSize}
				style={{filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.6))"}}
			/>
		</div>
	);
};
