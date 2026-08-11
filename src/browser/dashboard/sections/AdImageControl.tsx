import {Button, MenuItem, Stack, TextField, Typography} from "@mui/material";
import {useAdImage, useAdImageAssets} from "../../hooks";
import {Panel} from "../components";

export const AdImageControl = () => {
	const [adImage, setAdImage] = useAdImage();
	const assets = useAdImageAssets();

	const name = adImage?.name ?? null;
	const visible = adImage?.visible ?? false;

	const handleSelect = (value: string) => {
		setAdImage({name: value || null, visible});
	};

	const handleShow = () => {
		if (name == null) return;
		setAdImage({name, visible: true});
	};

	const handleHide = () => {
		setAdImage({name, visible: false});
	};

	return (
		<Panel>
			<Typography variant='h6'>宣伝画像</Typography>
			<TextField
				select
				fullWidth
				size='small'
				label='画像'
				value={name ?? ""}
				onChange={(e) => handleSelect(e.target.value)}
			>
				<MenuItem value=''>未選択</MenuItem>
				{assets.map((asset) => (
					<MenuItem
						key={asset.name}
						value={asset.name}
					>
						{asset.name}
					</MenuItem>
				))}
			</TextField>
			{assets.length === 0 && (
				<Typography
					color='text.secondary'
					sx={{fontSize: 12}}
				>
					宣伝画像をアセットにアップロードしてください。
				</Typography>
			)}
			<Stack
				direction='row'
				spacing={1}
			>
				<Button
					variant='contained'
					disabled={name == null}
					onClick={handleShow}
				>
					表示
				</Button>
				<Button
					variant='outlined'
					disabled={!visible}
					onClick={handleHide}
				>
					非表示
				</Button>
			</Stack>
			<Typography
				color='text.secondary'
				sx={{fontSize: 12}}
			>
				{visible ? `表示中: ${name ?? ""}` : "非表示"}
			</Typography>
		</Panel>
	);
};
