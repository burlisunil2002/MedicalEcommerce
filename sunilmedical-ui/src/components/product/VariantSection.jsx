import React from "react";
import VariantCard from "./VariantCard";

export default function VariantSection({
    variants = [],
    errors = {},
    addVariant,
    removeVariant,
    updateVariant,
    updateVariantImages,
    removeVariantImages,
    addSpecification,
    removeSpecification,
    updateSpecification
}) {
    // Preserve original indices because validation errors use keys such as price_1.
    const activeVariants = variants
        .map((variant, originalIndex) => ({ variant, originalIndex }))
        .filter(({ variant }) => variant.status !== "Inactive");

    return (
        <section
            id="variant-section"
            className="mb-8 scroll-mt-24 rounded-3xl bg-white p-5 shadow-lg sm:p-8"
            aria-labelledby="variants-heading"
        >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 id="variants-heading" className="text-2xl font-bold text-gray-800">
                        Product Variants
                    </h2>
                    <p className="mt-1 text-gray-500">
                        Add different models, sizes and prices.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    + Add Variant
                </button>
            </div>

            {/* Validation messages are handled by ProductForm's toast.
                Keep field-level error styling but no summary banner here. */}
            <div className="space-y-6 sm:space-y-8">
                {activeVariants.map(({ variant, originalIndex }) => (
                    <div
                        key={variant.productVariantId || `variant-${originalIndex}`}
                        id={`variant-${originalIndex}`}
                        className="min-w-0 scroll-mt-24"
                        data-variant-index={originalIndex}
                    >
                        <VariantCard
                            variant={variant}
                            index={originalIndex}
                            errors={errors}
                            updateVariant={updateVariant}
                            updateVariantImages={updateVariantImages}
                            removeVariantImages={removeVariantImages}
                            removeVariant={removeVariant}
                            addSpecification={addSpecification}
                            removeSpecification={removeSpecification}
                            updateSpecification={updateSpecification}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
