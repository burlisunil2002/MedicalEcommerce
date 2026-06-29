import React from "react";

export default function MedicalInfoSection({
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
        bg-white
        transition-all
        duration-200

        ${errors[field]
            ? "border-red-500 ring-2 ring-red-200"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                    Medical Information
                </h2>

                <p
                    className="
                        text-gray-500
                        mt-1
                    "
                >
                    Enter medical and inventory details.
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

                {/* Weight */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Weight (Kg)
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        name="weight"
                        value={product.weight}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={inputClass("weight")}
                    />

                    {errors.weight && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.weight}
                        </p>
                    )}

                </div>

                {/* Batch */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Batch Number
                    </label>

                    <input
                        type="text"
                        name="batchNumber"
                        value={product.batchNumber}
                        onChange={handleChange}
                        placeholder="Batch Number"
                        className={inputClass("batchNumber")}
                    />

                    {errors.batchNumber && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.batchNumber}
                        </p>
                    )}

                </div>

                {/* Expiry */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Expiry Date
                    </label>

                    <input
                        type="date"
                        name="expiryDate"
                        value={product.expiryDate}
                        onChange={handleChange}
                        className={inputClass("expiryDate")}
                    />

                    {errors.expiryDate && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.expiryDate}
                        </p>
                    )}

                </div>

                {/* Fragile */}

                <div>

                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                            text-gray-700
                        "
                    >
                        Fragile Product
                    </label>

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            border
                            border-gray-300
                            px-5
                            py-3
                            bg-gray-50
                        "
                    >

                        <div>

                            <p className="font-medium">

                                Handle with Care

                            </p>

                            <p
                                className="
                                    text-sm
                                    text-gray-500
                                "
                            >

                                Enable for delicate products

                            </p>

                        </div>

                        <label
                            className="
                                relative
                                inline-flex
                                cursor-pointer
                            "
                        >

                            <input
                                type="checkbox"
                                name="isFragile"
                                checked={product.isFragile}
                                onChange={handleChange}
                                className="sr-only peer"
                            />

                            <div
                                className="
                                    w-12
                                    h-7
                                    bg-gray-300
                                    rounded-full
                                    peer
                                    peer-checked:bg-blue-600
                                    after:absolute
                                    after:left-1
                                    after:top-1
                                    after:bg-white
                                    after:h-5
                                    after:w-5
                                    after:rounded-full
                                    after:transition-all
                                    peer-checked:after:translate-x-5
                                "
                            />

                        </label>

                    </div>

                </div>

            </div>

            {/* Summary */}

            <div
                className="
                    mt-8
                    bg-indigo-50
                    border
                    border-indigo-100
                    rounded-2xl
                    p-5
                "
            >

                <h4
                    className="
                        font-semibold
                        text-indigo-700
                    "
                >
                    Medical Summary
                </h4>

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-4
                        mt-4
                    "
                >

                    <div>

                        <p className="text-sm text-gray-500">
                            Weight
                        </p>

                        <p className="font-semibold">
                            {product.weight || 0} Kg
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Fragile
                        </p>

                        <p
                            className={
                                product.isFragile
                                    ? "font-semibold text-red-600"
                                    : "font-semibold text-green-600"
                            }
                        >

                            {
                                product.isFragile
                                    ? "Yes"
                                    : "No"
                            }

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}