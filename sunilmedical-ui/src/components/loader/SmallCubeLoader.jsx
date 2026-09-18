import React from "react";
import "./smallloader.css";

export default function SmallCubeLoader({
    title = "Loading...",
    subtitle = "Please wait..."
}) {
    return (
        <div
            className="small-loader-container"
            role="status"
            aria-live="polite"
        >
            <div className="small-spinner" />

            <div className="small-loader-title">
                {title}
            </div>

            <div className="small-loader-subtitle">
                {subtitle}
            </div>
        </div>
    );
}