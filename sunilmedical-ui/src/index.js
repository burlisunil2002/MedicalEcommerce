import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./index.css";

import { BrowserRouter } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import { LoaderProvider } from "./context/LoaderContext";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

root.render(
    <React.StrictMode>
        <HelmetProvider>

            <BrowserRouter>

                <AuthProvider>

                    <LoaderProvider>

                        <App />

                    </LoaderProvider>

                </AuthProvider>

            </BrowserRouter>

        </HelmetProvider>
    </React.StrictMode>
);

reportWebVitals();