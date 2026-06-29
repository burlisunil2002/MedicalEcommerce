import React from "react";

export default function ValidationSummary({ errors = {} }) {

    const errorList = Object.values(errors).filter(
        error => error && error.trim() !== ""
    );

    if (errorList.length === 0) {
        return null;
    }

    return (

        <div
            className="
                mb-8
                rounded-2xl
                border
                border-red-200
                bg-red-50
                p-6
                shadow-sm
            "
        >

            <div className="flex items-center gap-3 mb-4">

                <div className="text-3xl">
                    ⚠️
                </div>

                <div>

                    <h2
                        className="
                            text-xl
                            font-bold
                            text-red-700
                        "
                    >
                        Please fix the following errors
                    </h2>

                    <p
                        className="
                            text-red-500
                            text-sm
                        "
                    >
                        Complete all required fields before saving the product.
                    </p>

                </div>

            </div>

            <ul
                className="
                    list-disc
                    ml-6
                    space-y-2
                    text-red-700
                "
            >

                {

                    errorList.map((error, index) => (

                        <li key={index}>

                            {error}

                        </li>

                    ))

                }

            </ul>

        </div>

    );

}