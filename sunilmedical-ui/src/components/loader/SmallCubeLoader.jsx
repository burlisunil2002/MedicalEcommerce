import React from "react";
import "./smallloader.css";

export default function SmallCubeLoader({
    title = "Loading...",
    subtitle = "Please wait..."
}) {

    const letters = "SUNIL".split("");

    return (

        <div className="spinner-loader">

            <div className="sunil-spinner">

                {/* Spinner Ring */}
                <div className="spinner-ring"></div>

                {/* Glow */}
                <div className="spinner-glow"></div>

                {/* Letters */}
                {letters.map((letter, index) => (

                    <div
                        key={letter}
                        className="letter-holder"
                        style={{
                            "--angle": `${index * (360 / letters.length)}deg`
                        }}
                    >

                        <div className="spinner-letter">

                            {letter}

                        </div>

                    </div>

                ))}

            </div>

            <div className="spinner-content">

                <h3>{title}</h3>

                <p>{subtitle}</p>

                <div className="spinner-dots">

                    <span></span>

                    <span></span>

                    <span></span>

                </div>

            </div>

        </div>

    );

}