import React from "react";

export default function PricingSection({
    product,
    handleChange,
    errors
}) {
    const inputClass = (field) => `
        w-full rounded-xl border px-4 py-3 bg-white outline-none
        transition-all duration-200
        ${errors[field]
            ? "border-red-500 ring-2 ring-red-200"
            : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        }
    `;

    return (
        <section
            className="mb-8 rounded-3xl bg-white p-5 shadow-lg sm:p-8"
            aria-labelledby="pricing-information-heading"
        >
            <div className="mb-8">
                <h2
                    id="pricing-information-heading"
                    className="text-2xl font-bold text-gray-800"
                >
                    Pricing Information
                </h2>

                <p className="mt-1 text-gray-500">
                    Configure GST and HSN details.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* GST */}
                <div className="min-w-0">
                    <label
                        htmlFor="gstPercentage"
                        className="mb-2 block font-semibold text-gray-700"
                    >
                        GST Percentage
                    </label>

                    <input
                        id="gstPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        name="gstPercentage"
                        value={product.gstPercentage ?? ""}
                        onChange={handleChange}
                        placeholder="18"
                        aria-invalid={Boolean(errors.gstPercentage)}
                        aria-describedby={
                            errors.gstPercentage ? "gstPercentage-error" : undefined
                        }
                        className={inputClass("gstPercentage")}
                    />

                    {errors.gstPercentage && (
                        <p
                            id="gstPercentage-error"
                            role="alert"
                            className="mt-2 text-sm font-medium text-red-600"
                        >
                            {errors.gstPercentage}
                        </p>
                    )}
                </div>

                {/* HSN */}
                <div className="min-w-0">
                    <label
                        htmlFor="hsnCode"
                        className="mb-2 block font-semibold text-gray-700"
                    >
                        HSN Code
                    </label>

                    <input
                        id="hsnCode"
                        type="text"
                        name="hsnCode"
                        value={product.hsnCode ?? ""}
                        onChange={handleChange}
                        placeholder="Enter HSN Code"
                        aria-invalid={Boolean(errors.hsnCode)}
                        aria-describedby={
                            errors.hsnCode ? "hsnCode-error" : undefined
                        }
                        className={inputClass("hsnCode")}
                    />

                    {errors.hsnCode && (
                        <p
                            id="hsnCode-error"
                            role="alert"
                            className="mt-2 text-sm font-medium text-red-600"
                        >
                            {errors.hsnCode}
                        </p>
                    )}
                </div>
            </div>

            {/* Summary Card */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-blue-700">
                            Pricing Summary
                        </h3>
                        <p className="mt-1 text-sm text-blue-600">
                            GST applied to every product variant.
                        </p>
                    </div>

                    <div
                        className="shrink-0 text-2xl font-bold text-blue-700 sm:text-3xl"
                        aria-live="polite"
                    >
                        {product.gstPercentage || 0}%
                    </div>
                </div>
            </div>
        </section>
    );
}
