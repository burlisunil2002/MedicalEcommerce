import React from "react";

export default function DealSection({
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
        outline-none
        transition-all
        duration-200

        ${errors[field]
            ? "border-red-500 ring-2 ring-red-200"
            : "border-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
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
                    🔥 Deal Information
                </h2>

                <p
                    className="
                        text-gray-500
                        mt-1
                    "
                >
                    Configure promotional offers for this product.
                </p>

            </div>

            {/* Hot Deal */}

            <div
                className="
                    rounded-2xl
                    border
                    border-orange-100
                    bg-orange-50
                    p-5
                    mb-6
                "
            >

                <div className="flex justify-between items-center">

                    <div>

                        <h3
                            className="
                                font-semibold
                                text-orange-700
                            "
                        >
                            Hot Deal
                        </h3>

                        <p
                            className="
                                text-sm
                                text-orange-500
                            "
                        >
                            Show this product inside the Hot Deals section.
                        </p>

                    </div>

                    <label className="relative inline-flex cursor-pointer">

                        <input
                            type="checkbox"
                            name="isHotDeal"
                            checked={product.isHotDeal}
                            onChange={handleChange}
                            className="sr-only peer"
                        />

                        <div
                            className="
                                w-14
                                h-8
                                bg-gray-300
                                rounded-full
                                peer
                                peer-checked:bg-orange-600
                                after:absolute
                                after:left-1
                                after:top-1
                                after:bg-white
                                after:h-6
                                after:w-6
                                after:rounded-full
                                after:transition-all
                                peer-checked:after:translate-x-6
                            "
                        />

                    </label>

                </div>

            </div>

            {/* Discount & Date */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-6
                "
            >

                {/* Discount */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Discount Percentage
                    </label>

                    <input
                        type="number"
                        name="discountPercentage"
                        value={product.discountPercentage}
                        onChange={handleChange}
                        placeholder="10"
                        className={inputClass("discountPercentage")}
                    />

                    {errors.discountPercentage && (

                        <p className="mt-2 text-sm text-red-600">

                            {errors.discountPercentage}

                        </p>

                    )}

                </div>

                {/* Deal End */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Deal End Date
                    </label>

                    <input
                        type="datetime-local"
                        name="dealEndDate"
                        value={product.dealEndDate}
                        onChange={handleChange}
                        className={inputClass("dealEndDate")}
                    />

                    {errors.dealEndDate && (

                        <p className="mt-2 text-sm text-red-600">

                            {errors.dealEndDate}

                        </p>

                    )}

                </div>

            </div>

            {/* Preview */}

            <div
                className="
                    mt-8
                    rounded-2xl
                    bg-gradient-to-r
                    from-orange-500
                    via-red-500
                    to-pink-500
                    text-white
                    p-6
                "
            >

                <div className="flex justify-between items-center">

                    <div>

                        <h3
                            className="
                                text-xl
                                font-bold
                            "
                        >
                            Live Deal Preview
                        </h3>

                        <p className="text-orange-100">

                            This is how customers will see your offer.

                        </p>

                    </div>

                    <div
                        className="
                            text-right
                        "
                    >

                        <div
                            className="
                                text-4xl
                                font-bold
                            "
                        >

                            {product.discountPercentage || 0}%

                        </div>

                        <div className="text-sm">

                            OFF

                        </div>

                    </div>

                </div>

                <div
                    className="
                        mt-6
                        flex
                        justify-between
                        text-sm
                    "
                >

                    <span>

                        Hot Deal :
                        <strong>

                            {
                                product.isHotDeal
                                    ? " YES"
                                    : " NO"
                            }

                        </strong>

                    </span>

                    <span>

                        Ends :

                        <strong>

                            {
                                product.dealEndDate
                                    ? product.dealEndDate
                                    : "Not Selected"
                            }

                        </strong>

                    </span>

                </div>

            </div>

        </div>

    );

}