import React from "react";

export default function PricingSection({
    product,
    handleChange,
    errors
}) {

    const inputClass = (field) =>
        `
        w-full
        rounded-xl
        border
        px-4
        py-3
        bg-white
        outline-none
        transition-all
        duration-200

        ${errors[field]

            ? "border-red-500 ring-2 ring-red-200"

            : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        }
    `;

    return (

        <div
            className="
                bg-white
                rounded-3xl
                shadow-lg
                p-8
                mb-8
            "
        >

            {/* Heading */}

            <div className="mb-8">

                <h2
                    className="
                        text-2xl
                        font-bold
                        text-gray-800
                    "
                >
                    Pricing Information
                </h2>

                <p
                    className="
                        text-gray-500
                        mt-1
                    "
                >
                    Configure GST and HSN details.
                </p>

            </div>

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-6
                "
            >

                {/* GST */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >

                        GST Percentage

                    </label>

                    <input

                        type="number"

                        step="0.01"

                        name="gstPercentage"

                        value={product.gstPercentage}

                        onChange={handleChange}

                        placeholder="18"

                        className={inputClass("gstPercentage")}

                    />

                    {errors.gstPercentage && (

                        <p className="mt-2 text-sm text-red-600">

                            {errors.gstPercentage}

                        </p>

                    )}

                </div>

                {/* HSN */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >

                        HSN Code

                    </label>

                    <input

                        type="text"

                        name="hsnCode"

                        value={product.hsnCode}

                        onChange={handleChange}

                        placeholder="Enter HSN Code"

                        className={inputClass("hsnCode")}

                    />

                    {errors.hsnCode && (

                        <p className="mt-2 text-sm text-red-600">

                            {errors.hsnCode}

                        </p>

                    )}

                </div>

            </div>

            {/* Summary Card */}

            <div
                className="
                    mt-8
                    rounded-2xl
                    bg-blue-50
                    border
                    border-blue-100
                    p-5
                "
            >

                <div
                    className="
                        flex
                        justify-between
                        items-center
                    "
                >

                    <div>

                        <h4
                            className="
                                font-semibold
                                text-blue-700
                            "
                        >
                            Pricing Summary
                        </h4>

                        <p
                            className="
                                text-sm
                                text-blue-500
                            "
                        >
                            GST applied to every product variant.
                        </p>

                    </div>

                    <div
                        className="
                            text-3xl
                            font-bold
                            text-blue-700
                        "
                    >

                        {product.gstPercentage || 0}%

                    </div>

                </div>

            </div>

        </div>

    );

}