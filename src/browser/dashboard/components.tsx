import {Box, Paper, Typography} from "@mui/material";
import type {ReactNode} from "react";

export const Panel = ({
	children,
	height,
}: {
	children: ReactNode;
	height?: number | string;
}) => (
	<Box
		sx={{
			p: 1.5,
			display: "flex",
			flexDirection: "column",
			gap: 1,
			backgroundColor: "background.default",
			...(height != null && {height, overflowY: "auto"}),
		}}
	>
		{children}
	</Box>
);

export const Row = ({
	children,
	active = false,
	onClick,
}: {
	children: ReactNode;
	active?: boolean;
	onClick?: () => void;
}) => (
	<Paper
		variant='outlined'
		sx={(theme) => ({
			display: "flex",
			alignItems: "center",
			flexWrap: "wrap",
			gap: 1,
			p: 0.75,
			backgroundColor: active ? "#e2f0e2" : "background.paper",
			borderColor: "divider",
			...(onClick != null && {
				cursor: "pointer",
				"&:hover": {backgroundColor: theme.palette.action.hover},
			}),
		})}
		onClick={onClick}
	>
		{children}
	</Paper>
);

export const Section = ({children}: {children: ReactNode}) => (
	<Box
		sx={{
			display: "flex",
			flexDirection: "column",
			gap: 0.5,
			borderTop: 1,
			borderColor: "divider",
			pt: 1,
		}}
	>
		{children}
	</Box>
);

export const SectionTitle = ({children}: {children: ReactNode}) => (
	<Typography variant='subtitle2'>{children}</Typography>
);
