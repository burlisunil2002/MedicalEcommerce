import React from "react";
import SpecificationSection from "./SpecificationSection";

export default function VariantCard({
    variant,
    index,
    errors,
    updateVariant,
    updateVariantImages,
    removeVariantImages,
    removeVariant,
    addSpecification,
    removeSpecification,
    updateSpecification
}) {

    const inputClass = (field) => `
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
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }
    `;


    return (

        <div
            className="
                scroll-mt-24
                rounded-3xl
                border
                border-gray-200
                bg-gray-50
                p-4 sm:p-6
                shadow-sm
            "
        >

            {/* Header */}

            <div
                className="
                    flex
                    justify-between
                    items-center
                    mb-6
                "
            >

                <div>

                    <h3
                        className="
                            text-xl
                            font-bold
                            text-gray-800
                        "
                    >

                        Variant {index + 1}

                    </h3>

                    <p
                        className="
                            text-gray-500
                            text-sm
                        "
                    >

                        Configure this product variation

                    </p>

                </div>

                <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="
                        px-4
                        py-2
                        rounded-xl
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        font-semibold
                    "
                >

                    Remove

                </button>

            </div>

            {/* First Row */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    lg:grid-cols-4
                    gap-5
                "
            >
                <div>

                    <label htmlFor={`model_${index}`} className="font-semibold mb-2 block">

                        Model

                        <span className="text-red-500">*</span>

                    </label>

                    <input
                        id={`model_${index}`}
                        name={`Variants[${index}].Model`}
                        aria-invalid={Boolean(errors[`model_${index}`])}
                        value={variant.model}

                        onChange={(e) =>

                            updateVariant(
                                index,
                                "model",
                                e.target.value
                            )

                        }

                        className={inputClass(
                            `model_${index}`
                        )}

                        placeholder="Model"

                    />


                </div>
                <div>

                    <label className="font-semibold mb-2 block">

                        Size

                    </label>

                    <input

                        value={variant.size}

                        onChange={(e) =>

                            updateVariant(
                                index,
                                "size",
                                e.target.value
                            )

                        }

                        className={inputClass("size")}

                        placeholder="Large"

                    />

                </div>
                <div>

                    <label className="font-semibold mb-2 block">

                        Unit

                    </label>

                    <input

                        value={variant.unit}

                        onChange={(e) =>

                            updateVariant(
                                index,
                                "unit",
                                e.target.value
                            )

                        }

                        className={inputClass("unit")}

                        placeholder="Piece"

                    />

                </div>
                <div>

                    <label className="font-semibold mb-2 block">

                        Pack Size

                    </label>

                    <input

                        value={variant.packSize}

                        onChange={(e) =>

                            updateVariant(
                                index,
                                "packSize",
                                e.target.value
                            )

                        }

                        className={inputClass("packSize")}

                        placeholder="10"

                    />

                </div>

            </div>
            {/* Second Row */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    lg:grid-cols-5
                    gap-5
                    mt-6
                "
            >

                {/* Price */}

                <div>

                    <label htmlFor={`price_${index}`} className="font-semibold mb-2 block">

                        Price

                        <span className="text-red-500">*</span>

                    </label>

                    <input
                        id={`price_${index}`}
                        name={`Variants[${index}].Price`}
                        aria-invalid={Boolean(errors[`price_${index}`])}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={variant.price}

                        onChange={(e) =>
                            updateVariant(
                                index,
                                "price",
                                e.target.value
                            )
                        }

                        className={inputClass(
                            `price_${index}`
                        )}

                        placeholder="0.00"

                    />


                </div>

                {/* Stock */}

                <div>

                    <label htmlFor={`stock_${index}`} className="font-semibold mb-2 block">

                        Stock

                        <span className="text-red-500">*</span>

                    </label>

                    <input
                        id={`stock_${index}`}
                        name={`Variants[${index}].StockQuantity`}
                        aria-invalid={Boolean(errors[`stock_${index}`])}
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stockQuantity}

                        onChange={(e) =>
                            updateVariant(
                                index,
                                "stockQuantity",
                                e.target.value
                            )
                        }

                        className={inputClass(
                            `stock_${index}`
                        )}

                        placeholder="0"

                    />


                </div>

                {/* Min Quantity */}

                <div>

                    <label className="font-semibold mb-2 block">

                        Min Qty

                    </label>

                    <input
                        id={`minQuantity_${index}`}
                        name={`Variants[${index}].MinQuantity`}
                        type="number"
                        value={variant.minQuantity}

                        onChange={(e) =>
                            updateVariant(
                                index,
                                "minQuantity",
                                e.target.value
                            )
                        }

                        className={inputClass("minQuantity")}

                    />

                </div>

                {/* Max Quantity */}

                <div>

                    <label className="font-semibold mb-2 block">

                        Max Qty

                    </label>

                    <input
                        id={`maxQuantity_${index}`}
                        name={`Variants[${index}].MaxQuantity`}
                        type="number"
                        value={variant.maxQuantity}

                        onChange={(e) =>
                            updateVariant(
                                index,
                                "maxQuantity",
                                e.target.value
                            )
                        }

                        className={inputClass("maxQuantity")}

                    />

                </div>

                {/* Step Quantity */}

                <div>

                    <label className="font-semibold mb-2 block">

                        Step Qty

                    </label>

                    <input
                        id={`stepQuantity_${index}`}
                        name={`Variants[${index}].StepQuantity`}
                        type="number"
                        value={variant.stepQuantity}

                        onChange={(e) =>
                            updateVariant(
                                index,
                                "stepQuantity",
                                e.target.value
                            )
                        }

                        className={inputClass("stepQuantity")}

                    />

                </div>

            </div>

            {/* Variant Summary */}

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
                        grid
                        grid-cols-2
                        md:grid-cols-4
                        gap-4
                    "
                >

                    <div>

                        <p className="text-sm text-gray-500">

                            Price

                        </p>

                        <h4 className="font-bold text-blue-700">

                            ₹ {variant.price || 0}

                        </h4>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">

                            Stock

                        </p>

                        <h4 className="font-bold text-green-600">

                            {variant.stockQuantity || 0}

                        </h4>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">

                            Min Qty

                        </p>

                        <h4 className="font-bold">

                            {variant.minQuantity || 1}

                        </h4>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">

                            Max Qty

                        </p>

                        <h4 className="font-bold">

                            {variant.maxQuantity || "-"}

                        </h4>

                    </div>

                </div>

            </div>
            {/* ================= IMAGE ================= */}

            {/* ================= IMAGE ================= */}

            <div className="mt-8">

                <label className="block font-semibold mb-3">
                    Variant Images
                </label>

                {/* Image Preview */}

                {(variant.imagePreviews?.length > 0) && (

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">

                        {variant.imagePreviews.map((img, idx) => (

                            <div
                                key={idx}
                                className="relative"
                            >

                                <img
                                    src={img}
                                    alt=""
                                    className="w-full h-36 rounded-xl object-cover border"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeVariantImages(index, idx)
                                    }
                                    className="
                            absolute
                            top-2
                            right-2
                            w-7
                            h-7
                            rounded-full
                            bg-red-600
                            text-white
                        "
                                >
                                    ✕
                                </button>

                            </div>

                        ))}

                    </div>

                )}

                {/* Upload */}

                <label
                    htmlFor={`images_${index}`}
                    className={`
            flex
            flex-col
            items-center
            justify-center
            h-52
            border-2
            border-dashed
            border-blue-300
            rounded-2xl
            cursor-pointer
            hover:bg-blue-50
            ${errors[`images_${index}`] ? "border-red-500 bg-red-50 ring-2 ring-red-100" : ""}
        `}
                >

                    <div className="text-5xl">
                        📷
                    </div>

                    <p className="mt-3 font-semibold">
                        Upload Variant Images
                    </p>

                    <p className="text-gray-500 text-sm">
                        PNG / JPG / WEBP
                    </p>

                    <input
                        id={`images_${index}`}
                        name={`Variants[${index}].ImageFiles`}
                        multiple
                        type="file"
                        accept="image/*"
                        aria-invalid={Boolean(errors[`images_${index}`])}
                        className="sr-only"
                        onChange={(e) => {

                            const files = Array.from(e.target.files);
                            if (typeof updateVariantImages !== "function") return;
                            updateVariantImages(index, files);

                        }}
                    />

                </label>


            </div>
            {/* Image Information */}

            <div
                className="
                    mt-6
                    rounded-xl
                    bg-green-50
                    border
                    border-green-100
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
                                text-green-700
                            "
                        >

                            Variant Status

                        </h4>

                        <p
                            className="
                                text-sm
                                text-gray-500
                            "
                        >

                            Current variant configuration.

                        </p>

                    </div>

                    <div>

                        <span
                            className="
                                px-4
                                py-2
                                rounded-full
                                bg-green-600
                                text-white
                                font-semibold
                            "
                        >

                            {variant.status}

                        </span>

                    </div>

                </div>

            </div>

            {/* Specifications */}

            <div
                id={`specifications_${index}`}
                tabIndex={-1}
                className="scroll-mt-24 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
            >


                <SpecificationSection
                    variant={variant}
                    index={index}
                    errors={errors}
                    addSpecification={addSpecification}
                    removeSpecification={removeSpecification}
                    updateSpecification={updateSpecification}
                />
            </div>

        </div>

    );

}