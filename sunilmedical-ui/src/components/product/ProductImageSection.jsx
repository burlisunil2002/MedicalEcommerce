import React from "react";
import { FileText, Trash2, Image as ImageIcon } from "lucide-react";

export default function ProductImageSection({ product, handleImage, handleQuotation, removeProductImage, errors = {} }) {
    const productImage = product.imagePreview || product.imageUrl || "";
    const imageError = Boolean(errors.imageFile);
    return (
        <section id="product-files-section" className="mb-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-6 lg:p-8" aria-labelledby="product-files-heading">
            <header className="mb-5 sm:mb-7">
                <h2 id="product-files-heading" className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">Product Files</h2>
                <p className="mt-1 text-sm text-slate-500 sm:text-base">Upload a clear product image and optional specification document.</p>
            </header>
            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7">
                <div id="imageFile-section" data-validation-field="imageFile" className="min-w-0 scroll-mt-24">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Product Image <span className="text-red-600">*</span></label>
                    <div className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-3 sm:min-h-64 ${imageError ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-50"}`}>
                        {productImage ? <img src={productImage} alt={`Preview of ${product.name || "product"}`} className="max-h-64 w-full object-contain" onError={e => { e.currentTarget.style.visibility = "hidden"; }} /> :
                            <label htmlFor="imageFile-input" className="flex cursor-pointer flex-col items-center p-5 text-center"><ImageIcon size={38} className="mb-3 text-slate-400" /><span className="text-sm font-semibold text-slate-800">Choose product image</span><span className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP</span></label>}
                        {productImage && <button type="button" onClick={removeProductImage} aria-label="Remove product image" className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white hover:bg-red-700"><Trash2 size={17} /></button>}
                    </div>
                    <input id="imageFile-input" name="imageFile" type="file" accept="image/*" onChange={handleImage} aria-invalid={imageError} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                    {imageError && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.imageFile}</p>}
                </div>
                <div className="min-w-0 scroll-mt-24" id="quotationFile-section" data-validation-field="quotationFile">
                    <label htmlFor="quotationFile" className="mb-2 block text-sm font-semibold text-slate-700">Specification File <span className="font-normal text-slate-400">(optional)</span></label>
                    <label htmlFor="quotationFile" className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:min-h-64">
                        <FileText size={38} className="mb-3 text-blue-600" /><span className="text-sm font-semibold text-slate-800">Upload specification</span><span className="mt-1 text-xs text-slate-500">PDF, DOC or DOCX</span>
                        {product.quotationFile && <span className="mt-3 max-w-full break-all text-sm text-emerald-700">{product.quotationFile.name}</span>}
                        {product.quotationUrl && !product.quotationFile && <span className="mt-3 text-sm text-emerald-700">Existing document uploaded</span>}
                    </label>
                    <input id="quotationFile" name="quotationFile" type="file" accept=".pdf,.doc,.docx" onChange={handleQuotation} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700" />
                    {errors.quotationFile && <p role="alert" className="mt-2 text-sm text-red-600">{errors.quotationFile}</p>}
                </div>
            </div>
        </section>
    );
}
