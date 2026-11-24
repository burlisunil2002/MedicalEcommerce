import React from "react";
export default function PricingSection({ product, handleChange, errors = {} }) {
    const field = "w-full min-w-0 rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-base";
    const input = (key) => `${field} ${errors[key] ? "border-red-500 ring-2 ring-red-100" : "border-slate-300"}`;
    return <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-6 lg:p-8">
        <header className="mb-5"><h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">Pricing & Tax Information</h2><p className="mt-1 text-sm text-slate-500">Enter the applicable GST rate and mandatory HSN classification.</p></header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {[{ key: "gstPercentage", label: "GST Percentage", placeholder: "18", type: "number", min: "0", max: "100" }, { key: "hsnCode", label: "HSN Code", placeholder: "Enter HSN code", type: "text" }].map(f => <div key={f.key} className="min-w-0"><label htmlFor={f.key} className="mb-2 block text-sm font-semibold text-slate-700">{f.label} <span className="text-red-600">*</span></label><input id={f.key} name={f.key} type={f.type} min={f.min} max={f.max} step={f.type === "number" ? "0.01" : undefined} value={product[f.key] ?? ""} onChange={handleChange} placeholder={f.placeholder} aria-invalid={Boolean(errors[f.key])} aria-describedby={errors[f.key] ? `${f.key}-error` : undefined} className={input(f.key)} />{errors[f.key] && <p id={`${f.key}-error`} role="alert" className="mt-2 text-sm font-medium text-red-600">{errors[f.key]}</p>}</div>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"><div><p className="text-sm font-semibold text-blue-900">GST applied to variants</p><p className="mt-1 text-xs text-blue-700">The selected GST rate is used for this product.</p></div><strong className="text-2xl text-blue-800">{product.gstPercentage || 0}%</strong></div>
    </section>;
}
