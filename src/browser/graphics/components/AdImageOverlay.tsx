import {useAdImage, useAdImageAssets} from "../../hooks";

const FOOTER_HEIGHT = 50;
const MARGIN = 10;

export const AdImageOverlay = () => {
	const [adImage] = useAdImage();
	const assets = useAdImageAssets();

	const asset = assets.find((a) => a.name === adImage?.name);
	if (adImage?.visible !== true || asset == null) return null;

	return (
		<img
			src={asset.url}
			alt=''
			data-testid='ad-image-overlay'
			style={{
				position: "fixed",
				top: MARGIN,
				left: MARGIN,
				width: 1920 - MARGIN * 2,
				height: 1080 - FOOTER_HEIGHT - MARGIN * 2,
				objectFit: "contain",
				zIndex: 1000,
			}}
		/>
	);
};
