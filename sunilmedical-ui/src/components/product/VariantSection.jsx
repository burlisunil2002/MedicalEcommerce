import React from "react";
import VariantCard from "./VariantCard";

export default function VariantSection({
    variants,
    errors,
    addVariant,
    removeVariant,
    updateVariant,
    updateVariantImages,
    removeVariantImages,
    addSpecification,
    removeSpecification,
    updateSpecification
}) {

    const activeVariants =
        variants.filter(
            x => x.status !== "Inactive"
        );

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

            {/* Header */}

            <div
                className="
                    flex
                    justify-between
                    items-center
                    mb-8
                "
            >

                <div>

                    <h2
                        className="
                            text-2xl
                            font-bold
                            text-gray-800
                        "
                    >
                        Product Variants
                    </h2>

                    <p
                        className="
                            text-gray-500
                            mt-1
                        "
                    >
                        Add different models, sizes and prices.
                    </p>

                </div>

                <button

                    type="button"

                    onClick={addVariant}

                    className="
                        px-5
                        py-3
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-semibold
                        shadow-lg
                    "

                >

                    + Add Variant

                </button>

            </div>

            {/* Validation */}

            {
                errors.variants &&

                <div
                    className="
                        mb-6
                        rounded-xl
                        bg-red-50
                        border
                        border-red-200
                        p-4
                        text-red-600
                    "
                >

                    {errors.variants}

                </div>

            }

            {/* Variant List */}

            <div
                className="
                    space-y-8
                "
            >

                {

                    activeVariants.map(

                        (variant, index) => (

                            <VariantCard

                                key={
                                    variant.productVariantId ||
                                    index
                                }

                                variant={variant}

                                index={index}

                                errors={errors}

                                updateVariant={
                                    updateVariant
                                }

                                updateVariantImages={
                                    updateVariantImages
                                }

                                removeVariantImages={
                                    removeVariantImages
                                }

                                removeVariant={
                                    removeVariant
                                }

                                addSpecification={
                                    addSpecification
                                }

                                removeSpecification={
                                    removeSpecification
                                }

                                updateSpecification={
                                    updateSpecification
                                }

                            />

                        )

                    )

                }

            </div>

        </div>

    );

}