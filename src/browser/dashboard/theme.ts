import {createTheme} from "@mui/material/styles";

export const dashboardTheme = createTheme({
	palette: {
		mode: "light",
		primary: {main: "#4a6382"},
		secondary: {main: "#4c7a4c"},
		success: {main: "#3d7a3d"},
		error: {main: "#c04343"},
		warning: {main: "#b07d2e"},
		background: {
			default: "#ffffff",
			paper: "#ffffff",
		},
		text: {
			primary: "#000000",
			secondary: "#5f6b7a",
		},
		divider: "#d6dce3",
	},
	shape: {borderRadius: 4},
	typography: {
		fontFamily: "sans-serif",
		fontSize: 13,
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {backgroundColor: "#ffffff"},
			},
		},
		MuiButton: {
			defaultProps: {size: "small"},
			styleOverrides: {
				root: {
					textTransform: "none",
					boxShadow: "none",
					"&:hover": {boxShadow: "none"},
				},
			},
			variants: [
				{
					props: {variant: "outlined", color: "error"},
					style: {
						backgroundColor: "#fbe9e9",
						borderColor: "#e3b8b8",
						color: "#a83232",
						"&:hover": {
							backgroundColor: "#f4d5d5",
							borderColor: "#e3b8b8",
						},
					},
				},
				{
					props: {variant: "outlined", color: "success"},
					style: {
						backgroundColor: "#e7f2e7",
						borderColor: "#bad6ba",
						color: "#2f6b2f",
						"&:hover": {
							backgroundColor: "#d8ead8",
							borderColor: "#bad6ba",
						},
					},
				},
				{
					props: {variant: "outlined"},
					style: {
						backgroundColor: "#eef2f7",
						borderColor: "#c9d3de",
						color: "#1a2733",
						"&:hover": {
							backgroundColor: "#e3e9f0",
							borderColor: "#c9d3de",
						},
					},
				},
			],
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					backgroundColor: "#eef2f7",
					"&:hover": {backgroundColor: "#e3e9f0"},
				},
			},
		},
		MuiTextField: {
			defaultProps: {size: "small", variant: "outlined"},
		},
		MuiSelect: {
			defaultProps: {size: "small"},
		},
		MuiPaper: {
			defaultProps: {elevation: 0},
		},
		MuiDialog: {
			defaultProps: {
				maxWidth: "sm",
				fullWidth: true,
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					display: "flex",
					flexDirection: "column",
					gap: 8,
				},
			},
		},
	},
});
