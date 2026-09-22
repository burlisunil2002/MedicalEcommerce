import {
    CheckCircle2,
    BadgeIndianRupee
} from "lucide-react";


const money = value =>
    Number(value || 0).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );


export default function ProductVariantSelector({

    product,

    variants = [],

    selectedVariant,

    onVariantChange

}) {


    if (
        !Array.isArray(variants) ||
        variants.length <= 1
    ) {

        return null;

    }


    const discount =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    product?.discountPercentage ??
                    0
                )
            )
        );


    return (

        <section>


            <div className="mb-3 flex items-end justify-between">


                <div>

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">

                        Choose your option

                    </p>


                    <h2 className="mt-1 text-lg font-extrabold text-slate-950">

                        Available Models

                        <span className="ml-2 text-xs text-slate-400">

                            {variants.length}

                        </span>

                    </h2>


                    <p className="mt-1 text-xs text-slate-500">

                        Choose the model that matches your requirement.

                    </p>

                </div>


                <span className="hidden text-[10px] text-slate-400 sm:block">

                    Swipe to explore

                </span>

            </div>


            <div className="flex gap-3 overflow-x-auto pb-2">


                {variants.map(
                    variant => {

                        const variantId =
                            variant?.productVariantId ??
                            variant?.id;


                        const selected =
                            Number(
                                selectedVariant
                                    ?.productVariantId ??
                                selectedVariant?.id
                            ) ===
                            Number(
                                variantId
                            );


                        const original =
                            Number(
                                variant?.price ??
                                0
                            );


                        const finalPrice =
                            discount > 0
                                ? original -
                                (
                                    original *
                                    discount
                                ) /
                                100
                                : original;


                        const image =
                            variant
                                ?.images?.[0]
                                ?.imageUrl ||
                            product?.imageUrl ||
                            "/images/no-image.png";


                        return (

                            <button

                                key={
                                    variantId
                                }

                                type="button"

                                onClick={() =>
                                    onVariantChange(
                                        variant
                                    )
                                }

                                className={`relative w-[220px] shrink-0 overflow-hidden rounded-2xl border bg-white text-left transition sm:w-[250px] ${selected

                                        ? "border-indigo-500 ring-2 ring-indigo-100 shadow-lg"

                                        : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                                    }`}

                            >


                                {selected && (

                                    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-[9px] font-bold text-white">

                                        <CheckCircle2
                                            size={11}
                                        />

                                        Selected

                                    </span>

                                )}


                                <div className="flex h-[125px] items-center justify-center bg-slate-50 p-3">

                                    <img

                                        src={
                                            image
                                        }

                                        alt={
                                            variant?.model ||
                                            "Product model"
                                        }

                                        className="h-full w-full object-contain"

                                        loading="lazy"

                                    />

                                </div>


                                <div className="border-t border-slate-100 p-3">


                                    <p className="line-clamp-2 min-h-[34px] text-xs font-bold leading-5 text-slate-900">

                                        {variant?.model ||
                                            "Standard Model"}

                                    </p>


                                    <div className="mt-2 flex items-center justify-between">


                                        <span className="flex items-center gap-1 text-sm font-black text-slate-950">

                                            <BadgeIndianRupee
                                                size={13}
                                                className="text-emerald-600"
                                            />

                                            {money(
                                                finalPrice
                                            )}

                                        </span>


                                        {discount >
                                            0 &&
                                            original >
                                            0 && (

                                                <span className="text-[9px] text-slate-400 line-through">

                                                    {money(
                                                        original
                                                    )}

                                                </span>

                                            )}

                                    </div>

                                </div>

                            </button>

                        );

                    }
                )}

            </div>

        </section>

    );

}