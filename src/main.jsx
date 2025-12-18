// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import OperatorView from "./pages/OperatorView.jsx";
import ProjectionView from "./pages/ProjectionView.jsx";
import EditorCantosHome from "./editor-cantos/EditorCantosHome.jsx";
import EditorCantoEdit from "./editor-cantos/EditorCantoEdit.jsx";

import "./index.css";
import "./styles/cmv-theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/operator" element={<OperatorView />} />
                <Route path="/projection" element={<ProjectionView />} />
                <Route path="/editor-cantos" element={<EditorCantosHome />} />
                <Route path="/editor-cantos/:id" element={<EditorCantoEdit />} />
            </Routes>
        </HashRouter>
    </React.StrictMode>
);
