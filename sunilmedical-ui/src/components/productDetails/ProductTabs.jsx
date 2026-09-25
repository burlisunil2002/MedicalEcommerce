import { useState } from "react";
import { BadgeCheck, FileText } from "lucide-react";
import ProductDescription from "./ProductDescription";
import ProductSpecification from "./ProductSpecification";

export default function ProductTabs({ product, selectedVariant }) {
    const [activeTab, setActiveTab] = useState("description");

    const tabs = [
        { id: "description", label: "Description", icon: FileText },
        { id: "specifications", label: "Specifications", icon: BadgeCheck },
    ];

    return (
        <section className="w-full">
            <div className="sticky top-14 z-20 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur-md sm:top-16 sm:p-1.5">
                <div
                    className="flex w-full gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="tablist"
                    aria-label="Product information"
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex min-w-[145px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:min-w-0 sm:py-3 sm:text-sm ${active
                                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 min-w-0 sm:mt-5">
                {activeTab === "description" && <ProductDescription product={product} />}
                {activeTab === "specifications" && (
                    <ProductSpecification selectedVariant={selectedVariant} />
                )}
            </div>
        </section>
    );
}
