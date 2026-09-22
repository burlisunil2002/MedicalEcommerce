import { BadgeCheck } from "lucide-react";

export default function ProductSpecification({
    selectedVariant
}) {
    const specifications =
        selectedVariant?.specifications ??
        [];

    if (!specifications.length) {
        return null;
    }

    return (
        <article className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
        ">
            <div className="
                border-b
                border-slate-100
                bg-gradient-to-r
                from-indigo-50
                to-white
                px-5
                sm:px-6
                py-4
            ">
                <p className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-widest
                    text-indigo-500
                ">
                    Technical details
                </p>

                <h2 className="
                    mt-1
                    text-base
                    sm:text-lg
                    font-bold
                    text-slate-900
                ">
                    Technical Specifications
                </h2>
            </div>

            <div className="divide-y divide-slate-100">
                {specifications.map(
                    (spec, index) => (
                        <div
                            key={`${spec.key}-${index}`}
                            className="
                                grid
                                grid-cols-1
                                sm:grid-cols-[minmax(180px,0.8fr)_2fr]
                                gap-2
                                sm:gap-6
                                px-5
                                sm:px-6
                                py-3.5
                                hover:bg-slate-50
                                transition
                            "
                        >
                            <div className="
                                flex
                                items-center
                                gap-2
                                text-xs
                                sm:text-sm
                                font-semibold
                                text-slate-800
                            ">
                                <BadgeCheck
                                    size={15}
                                    className="text-indigo-500 shrink-0"
                                />

                                {spec.key}
                            </div>

                            <div className="
                                text-xs
                                sm:text-sm
                                leading-6
                                text-slate-600
                            ">
                                {spec.value}
                            </div>
                        </div>
                    )
                )}
            </div>
        </article>
    );
}