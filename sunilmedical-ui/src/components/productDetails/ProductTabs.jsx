import { useState } from "react";
import { FileText, BadgeCheck, Download, PlayCircle } from "lucide-react";

import ProductDescription from "./ProductDescription";
import ProductSpecification from "./ProductSpecification";
//import ProductDownload from "./ProductDownload";

export default function ProductTabs({ product, selectedVariant }) {
    const [activeTab, setActiveTab] = useState("description");

    const tabs = [
        {
            id: "description",
            label: "Description",
            icon: FileText,
        },
        {
            id: "specifications",
            label: "Specifications",
            icon: BadgeCheck,
        },
    ];

    return (
        <section className="mt-6 w-full sm:mt-8 lg:mt-10">
            <div className="sticky top-16 z-20 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:p-2">
                <div
                    className="flex gap-1 overflow-x-auto scrollbar-none"
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
                                className={`
                  group flex min-w-max items-center justify-center gap-2
                  rounded-xl px-4 py-2.5 text-xs font-bold
                  transition-all duration-200
                  sm:px-6 sm:py-3 sm:text-sm
                  ${active
                                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }
                `}
                            >
                                <Icon
                                    size={16}
                                    strokeWidth={2.2}
                                    className={
                                        active
                                            ? "text-white"
                                            : "text-slate-400 group-hover:text-indigo-500"
                                    }
                                />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 sm:mt-5">
                {activeTab === "description" && (
                    <ProductDescription product={product} />
                )}

                {activeTab === "specifications" && (
                    <ProductSpecification selectedVariant={selectedVariant} />
                )}

            </div>
        </section>
    );
}
