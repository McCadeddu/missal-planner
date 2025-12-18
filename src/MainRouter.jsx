import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import OperatorView from "./pages/OperatorView.jsx";
import ProjectionView from "./pages/ProjectionView.jsx";
import EditorCantosHome from "./editor-cantos/EditorCantosHome";

export default function MainRouter() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/editor-cantos" element={<EditorCantosHome />} />
                <Route path="/operator" element={<OperatorView />} />
                <Route path="/projection" element={<ProjectionView />} />
            </Routes>
        </HashRouter>
    );
}
