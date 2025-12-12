// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import OperatorView from "./pages/OperatorView.jsx";
import ProjectionView from "./pages/ProjectionView.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/operator" element={<OperatorView />} />
                <Route path="/projection" element={<ProjectionView />} />
            </Routes>
        </HashRouter>
    </React.StrictMode>
);
