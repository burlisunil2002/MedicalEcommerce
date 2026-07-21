import React from "react";
import "./loader.css";

const themes = {
    blue: {
        glow: "#3B82F6",
        ring: "#2563eb"
    },

    emerald: {
        glow: "#10B981",
        ring: "#059669"
    },

    purple: {
        glow: "#8B5CF6",
        ring: "#7C3AED"
    },

    pink: {
        glow: "#EC4899",
        ring: "#DB2777"
    },

    orange: {
        glow: "#F97316",
        ring: "#EA580C"
    },

    gold: {
        glow: "#FBBF24",
        ring: "#F59E0B"
    }
};

const cubes = [
    {
        letter: "S",
        color: "#3B82F6",
        angle: 0
    },
    {
        letter: "U",
        color: "#8B5CF6",
        angle: 72
    },
    {
        letter: "N",
        color: "#EC4899",
        angle: 144
    },
    {
        letter: "I",
        color: "#10B981",
        angle: 216
    },
    {
        letter: "L",
        color: "#F97316",
        angle: 288
    }
];

export default function GlobalLoader({

    show = true,

    text = "Loading...",

    subText = "Please wait",

    theme = "blue"

}) {

    if (!show) return null;

    const current = themes[theme];

    return (

        <div className="loader-overlay">

            <div className="loader-wrapper">

                <div
                    className="loader-ring"
                    style={{
                        borderColor: current.ring
                    }}
                >

                    {cubes.map((cube, index) => (

                        <div

                            key={index}

                            className="loader-cube"

                            style={{

                                "--angle": `${cube.angle}deg`,

                                "--cube-color": cube.color

                            }}

                        >

                            <div className="cube">

                                {cube.letter}

                            </div>

                        </div>

                    ))}

                </div>

                <div className="loader-content">

                    <h2>{text}</h2>

                    <p>{subText}</p>

                    <div className="loader-dots">

                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>

                    </div>

                </div>

            </div>

        </div>

    );

}