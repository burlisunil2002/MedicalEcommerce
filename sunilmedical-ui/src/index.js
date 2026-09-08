import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./index.css";

import { BrowserRouter } from "react-router-dom";

import { LoaderProvider } from "./context/LoaderContext";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <LoaderProvider>
                    <App />
                </LoaderProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();