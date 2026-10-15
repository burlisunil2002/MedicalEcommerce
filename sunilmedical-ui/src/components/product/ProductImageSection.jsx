import React from "react";
import { FileText, Trash2, Image as ImageIcon } from "lucide-react";

export default function ProductImageSection({
    product,
    handleImage,
    handleQuotation,
    removeProductImage,
    errors = {}
}) {
    const productImage = product.imagePreview || product.imageUrl || "";
    const imageHasError = Boolean(errors.imageFile);
    const quotationHasError = Boolean(errors.quotationFile);

    return (
        <section
            id="product-files-section"
            className="mb-8 rounded-3xl bg-white p-5 shadow-lg sm:p-8"
            aria-labelledby="product-files-heading"
        >
            <div className="mb-8">
                <h2
                    id="product-files-heading"
                    className="text-2xl font-bold text-gray-800"
                >
                    Product Files
                </h2>
                <p className="mt-1 text-gray-500">
                    Upload a product image and an optional quotation document.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* PRODUCT IMAGE */}
                <div
                    id="imageFile-section"
                    className="min-w-0 scroll-mt-24"
                    data-validation-field="imageFile"
                >
                    <p className="mb-3 block font-semibold text-gray-700">
                        Product Image <span className="text-red-500">*</span>
                    </p>

                    {productImage ? (
                        <div className="relative">
                            <img
                                src={productImage}
                                alt={`Preview of ${product.name || "product"}`}
                                className={`h-60 w-full rounded-2xl border bg-gray-50 object-contain sm:h-72 ${imageHasError ? "border-red-500 ring-2 ring-red-100" : "border-gray-200"
                                    }`}
                                onError={(event) => {
                                    event.currentTarget.style.visibility = "hidden";
                                }}
                            />

                            <button
                                type="button"
                                onClick={removeProductImage}
                                aria-label="Remove product image"
                                className="absolute right-3 top-3 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                            >
                                <Trash2 size={18} />
                            </button>

                            <label
                                htmlFor="imageFile-input"
                                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-300"
                            >
                                <ImageIcon size={16} />
                                Replace image
                            </label>

                            <input
                                id="imageFile-input"
                                name="imageFile"
                                type="file"
                                accept="image/*"
                                onChange={handleImage}
                                aria-invalid={imageHasError}
                                className="sr-only"
                            />
                        </div>
                    ) : (
                        <label
                            htmlFor="imageFile-input"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    document.getElementById("imageFile-input")?.click();
                                }
                            }}
                            className={`flex h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:h-72 ${imageHasError
                                    ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                                    : "border-gray-300"
                                }`}
                        >
                            <ImageIcon size={46} className="mb-3 text-gray-400" />
                            <p className="font-semibold text-gray-800">
                                Upload Product Image
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                JPG, PNG, WEBP
                            </p>

                            <input
                                id="imageFile-input"
                                name="imageFile"
                                type="file"
                                accept="image/*"
                                onChange={handleImage}
                                aria-invalid={imageHasError}
                                className="sr-only"
                            />
                        </label>
                    )}

                </div>

                {/* OPTIONAL QUOTATION / SPECIFICATION DOCUMENT */}
                <div
                    id="quotationFile-section"
                    className="min-w-0 scroll-mt-24"
                    data-validation-field="quotationFile"
                >
                    <p className="mb-3 block font-semibold text-gray-700">
                        Specification File{" "}
                        <span className="text-sm font-normal text-gray-400">
                            (optional)
                        </span>
                    </p>

                    <label
                        htmlFor="quotationFile"
                        className={`flex h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition hover:border-green-500 hover:bg-green-50 focus-within:ring-2 focus-within:ring-green-200 sm:h-72 ${quotationHasError
                                ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                                : "border-gray-300"
                            }`}
                    >
                        <FileText size={46} className="mb-4 text-green-600" />
                        <p className="font-semibold text-gray-800">
                            Upload Quotation
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            PDF / DOC / DOCX
                        </p>

                        {product.quotationFile && (
                            <p className="mt-3 max-w-full break-all text-sm text-green-700">
                                {product.quotationFile.name}
                            </p>
                        )}

                        {product.quotationUrl && !product.quotationFile && (
                            <p className="mt-3 text-sm text-green-700">
                                Existing document uploaded
                            </p>
                        )}

                        <input
                            id="quotationFile"
                            name="quotationFile"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleQuotation}
                            aria-invalid={quotationHasError}
                            className="sr-only"
                        />
                    </label>

                </div>
            </div>
        </section>
    );
}
