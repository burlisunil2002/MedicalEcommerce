import { BadgeCheck } from "lucide-react";

export default function ProductSpecification({ selectedVariant }) {
    const specifications = Array.isArray(selectedVariant?.specifications)
        ? selectedVariant.specifications.filter(
            (spec) => spec && (spec.key || spec.value)
        )
        : [];

    if (specifications.length === 0) return null;

    return (
        <section
            aria-labelledby="product-specifications-heading"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <header className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 sm:text-xs">
                    Technical details
                </p>
                <h2
                    id="product-specifications-heading"
                    className="mt-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg"
                >
                    Technical specifications
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Product details and specifications for the selected variant
                </p>
            </header>

            <dl className="divide-y divide-slate-100">
                {specifications.map((spec, index) => {
                    const label = String(spec.key ?? "").trim();
                    const value = String(spec.value ?? "").trim();

                    return (
                        <div
                            key={`${label || "specification"}-${index}`}
                            className="grid grid-cols-1 gap-1.5 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] sm:gap-5 sm:px-6"
                        >
                            <dt className="flex min-w-0 items-start gap-2 text-xs font-semibold text-slate-800 sm:text-sm">
                                <BadgeCheck
                                    size={16}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                    className="mt-0.5 shrink-0 text-indigo-500"
                                />
                                <span className="break-words">{label || "Specification"}</span>
                            </dt>

                            <dd className="min-w-0 whitespace-pre-wrap break-words pl-6 text-xs leading-6 text-slate-600 sm:pl-0 sm:text-sm">
                                {value || "—"}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </section>
    );
}
