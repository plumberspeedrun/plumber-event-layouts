import {CssBaseline, ThemeProvider} from "@mui/material";
import type {ReactNode} from "react";
import {createRoot} from "react-dom/client";
import {dashboardTheme} from "./theme";

export const renderDashboard = (app: ReactNode) => {
	const container = document.getElementById("root");
	if (container) {
		createRoot(container).render(
			<ThemeProvider theme={dashboardTheme}>
				<CssBaseline />
				{app}
			</ThemeProvider>,
		);
	} else {
		throw new Error("#root element not found");
	}
};
