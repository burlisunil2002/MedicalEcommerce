import React from "react";
import SpecificationSection from "./SpecificationSection";

export default function VariantCard({
    variant,
    index,
    errors = {},
    updateVariant,
    updateVariantImages,
    removeVariantImages,
    removeVariant,
    addSpecification,
    removeSpecification,
    updateSpecification,
}) {
    const fieldError = (field) => errors?.[field];

    const inputClass = (field) => `
        block w-full min-w-0 rounded-xl border bg-white px-3.5 py-3
        text-sm text-gray-900 shadow-sm outline-none transition
        placeholder:text-gray-400
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100
        ${fieldError(field)
            ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
            : "border-gray-200 hover:border-gray-300"}
    `;

    const FieldError = ({ field }) => fieldError(field) ? (
        <p id={`${field}_error`} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {fieldError(field)}
        </p>
    ) : null;

    const update = (field, value) => updateVariant(index, field, value);
    const imagePreviews = variant.imagePreviews || [];

    return (
        <section
            id={`variant_${index}`}
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            aria-labelledby={`variant_heading_${index}`}
        >
            <header className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                        {index + 1}
                    </span>
                    <div className="min-w-0">
                        <h3 id={`variant_heading_${index}`} className="text-base font-bold text-gray-900 sm:text-lg">
                            Variant {index + 1}
                        </h3>
                        <p className="text-xs text-gray-500 sm:text-sm">
                            Set model, pricing, inventory and product options
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 sm:self-auto"
                    aria-label={`Remove variant ${index + 1}`}
                >
                    <span aria-hidden="true">×</span>
                    Remove variant
                </button>
            </header>

            <div className="space-y-6 p-4 sm:p-6">
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-gray-800">Variant details</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label htmlFor={`model_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">
                                Model <span className="text-red-500">*</span>
                            </label>
                            <input
                                id={`model_${index}`}
                                name={`Variants[${index}].Model`}
                                value={variant.model ?? ""}
                                onChange={(e) => update("model", e.target.value)}
                                className={inputClass(`model_${index}`)}
                                placeholder="Enter model name"
                                aria-invalid={Boolean(fieldError(`model_${index}`))}
                                aria-describedby={fieldError(`model_${index}`) ? `model_${index}_error` : undefined}
                            />
                            <FieldError field={`model_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`size_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Size</label>
                            <input
                                id={`size_${index}`}
                                value={variant.size ?? ""}
                                onChange={(e) => update("size", e.target.value)}
                                className={inputClass(`size_${index}`)}
                                placeholder="e.g. Large"
                            />
                            <FieldError field={`size_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`unit_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Unit</label>
                            <input
                                id={`unit_${index}`}
                                value={variant.unit ?? ""}
                                onChange={(e) => update("unit", e.target.value)}
                                className={inputClass(`unit_${index}`)}
                                placeholder="e.g. Piece"
                            />
                            <FieldError field={`unit_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`packSize_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Pack size</label>
                            <input
                                id={`packSize_${index}`}
                                value={variant.packSize ?? ""}
                                onChange={(e) => update("packSize", e.target.value)}
                                className={inputClass(`packSize_${index}`)}
                                placeholder="e.g. 10"
                            />
                            <FieldError field={`packSize_${index}`} />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 text-sm font-semibold text-gray-800">Pricing & inventory</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <div>
                            <label htmlFor={`price_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id={`price_${index}`}
                                name={`Variants[${index}].Price`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={variant.price ?? ""}
                                onChange={(e) => update("price", e.target.value)}
                                className={inputClass(`price_${index}`)}
                                placeholder="0.00"
                                aria-invalid={Boolean(fieldError(`price_${index}`))}
                                aria-describedby={fieldError(`price_${index}`) ? `price_${index}_error` : undefined}
                            />
                            <FieldError field={`price_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`stock_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">
                                Stock quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                id={`stock_${index}`}
                                name={`Variants[${index}].StockQuantity`}
                                type="number"
                                min="0"
                                step="1"
                                value={variant.stockQuantity ?? ""}
                                onChange={(e) => update("stockQuantity", e.target.value)}
                                className={inputClass(`stock_${index}`)}
                                placeholder="0"
                                aria-invalid={Boolean(fieldError(`stock_${index}`))}
                                aria-describedby={fieldError(`stock_${index}`) ? `stock_${index}_error` : undefined}
                            />
                            <FieldError field={`stock_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`minQuantity_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Minimum qty</label>
                            <input
                                id={`minQuantity_${index}`}
                                name={`Variants[${index}].MinQuantity`}
                                type="number"
                                min="1"
                                value={variant.minQuantity ?? ""}
                                onChange={(e) => update("minQuantity", e.target.value)}
                                className={inputClass(`minQuantity_${index}`)}
                                placeholder="1"
                            />
                            <FieldError field={`minQuantity_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`maxQuantity_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Maximum qty</label>
                            <input
                                id={`maxQuantity_${index}`}
                                name={`Variants[${index}].MaxQuantity`}
                                type="number"
                                min="1"
                                value={variant.maxQuantity ?? ""}
                                onChange={(e) => update("maxQuantity", e.target.value)}
                                className={inputClass(`maxQuantity_${index}`)}
                                placeholder="No limit"
                            />
                            <FieldError field={`maxQuantity_${index}`} />
                        </div>

                        <div>
                            <label htmlFor={`stepQuantity_${index}`} className="mb-1.5 block text-sm font-medium text-gray-700">Step qty</label>
                            <input
                                id={`stepQuantity_${index}`}
                                name={`Variants[${index}].StepQuantity`}
                                type="number"
                                min="1"
                                value={variant.stepQuantity ?? ""}
                                onChange={(e) => update("stepQuantity", e.target.value)}
                                className={inputClass(`stepQuantity_${index}`)}
                                placeholder="1"
                            />
                            <FieldError field={`stepQuantity_${index}`} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-4 sm:gap-4">
                    <div>
                        <p className="text-xs font-medium text-blue-700">Selling price</p>
                        <p className="mt-1 break-words text-lg font-bold text-gray-900">₹ {variant.price || "0.00"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-blue-700">Available stock</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{variant.stockQuantity || "0"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-blue-700">Minimum order</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{variant.minQuantity || "1"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-blue-700">Maximum order</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{variant.maxQuantity || "—"}</p>
                    </div>
                </div>

                <div>
                    <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-800">Variant images</h4>
                        <p className="mt-1 text-xs text-gray-500">Upload clear product photos in PNG, JPG or WEBP format.</p>
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {imagePreviews.map((img, imageIndex) => (
                                <div key={`${index}-${imageIndex}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                    <img
                                        src={img}
                                        alt={`Variant ${index + 1} image ${imageIndex + 1}`}
                                        className="h-32 w-full object-cover sm:h-36"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeVariantImages(index, imageIndex)}
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-lg text-white shadow transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
                                        aria-label={`Remove image ${imageIndex + 1}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <label
                        htmlFor={`images_${index}`}
                        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition hover:bg-blue-50/60 ${fieldError(`images_${index}`)
                                ? "border-red-400 bg-red-50/50"
                                : "border-gray-300 bg-gray-50/70 hover:border-blue-400"
                            }`}
                    >
                        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700" aria-hidden="true">＋</span>
                        <span className="text-sm font-semibold text-gray-800">Choose variant images</span>
                        <span className="mt-1 text-xs text-gray-500">You can select multiple images</span>
                        <input
                            id={`images_${index}`}
                            name={`Variants[${index}].ImageFiles`}
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            aria-invalid={Boolean(fieldError(`images_${index}`))}
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (typeof updateVariantImages === "function") updateVariantImages(index, files);
                                e.target.value = "";
                            }}
                        />
                    </label>
                    <FieldError field={`images_${index}`} />
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Variant status</p>
                        <p className="text-xs text-gray-500">Current availability status for this variant</p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${String(variant.status || "Active").toLowerCase() === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}>
                        {variant.status || "Active"}
                    </span>
                </div>

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
        </section>
    );
}
