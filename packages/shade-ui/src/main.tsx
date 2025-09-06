import React from "react";
import ReactDOM from "react-dom/client";
import "./main.css";
import ImageProcessor from "./components/ImageProcessor";

function App() {
	return (
		<div className="h-screen overflow-hidden">
			<ImageProcessor />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
