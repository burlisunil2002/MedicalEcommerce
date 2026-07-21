import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LoaderProvider } from "./context/LoaderContext";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <BrowserRouter>
        <LoaderProvider>
            <App />
        </LoaderProvider>
    </BrowserRouter>
);

reportWebVitals();