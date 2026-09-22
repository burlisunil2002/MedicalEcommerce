import {
    ArrowRight,
    GitCompareArrows
} from "lucide-react";

import {
    useNavigate
} from "react-router-dom";


const normalize = value =>
    String(value || "")
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();


const money = value =>
    Number(value || 0).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );


export default function CompareSimilarProducts({

    currentProduct,

    products = []

}) {


    const navigate =
        useNavigate();


    if (
        !currentProduct ||
        !Array.isArray(products)
    ) {

        return null;

    }


    const currentName =
        normalize(
            currentProduct.name
        );


    const currentCategory =
        normalize(
            currentProduct.category
        );


    const currentBrand =
        normalize(
            currentProduct.brand
        );


    /*
     * STRICT MATCH:
     *
     * Same product name
     * Same category
     * Different vendor/brand
     */

    const alternatives =
        products.filter(
            item => {

                if (!item)
                    return false;


                const itemId =
                    item.id ??
                    item.Id;


                const itemName =
                    item.name ??
                    item.Name;


                const itemBrand =
                    item.brand ??
                    item.Brand;


                const itemCategory =
                    item.category ??
                    item.Category;


                return (

                    Number(itemId) !==
                    Number(
                        currentProduct.id
                    )

                    &&

                    normalize(
                        itemName
                    ) ===
                    currentName

                    &&

                    normalize(
                        itemCategory
                    ) ===
                    currentCategory

                    &&

                    normalize(
                        itemBrand
                    ) !==
                    currentBrand

                );

            }
        )
            .slice(0, 4);


    /*
     * VERY IMPORTANT:
     *
     * No alternatives =
     * no comparison UI.
     */

    if (!alternatives.length)
        return null;


    const productsToCompare = [

        currentProduct,

        ...alternatives

    ];


    return (

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-white px-5 py-4 sm:px-6">


                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">

                    Buyer comparison

                </p>


                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-950 sm:text-lg">

                    <GitCompareArrows
                        size={18}
                        className="text-indigo-600"
                    />

                    Compare Similar Products

                </h2>


                <p className="mt-1 text-[11px] text-slate-500">

                    Compare the same product from different vendors.

                </p>

            </div>


            {/* =====================================================
                HORIZONTAL COMPARISON
            ====================================================== */}

            <div className="overflow-x-auto">


                <div className="min-w-[850px]">


                    <div className="grid grid-cols-[160px_repeat(5,minmax(180px,1fr))]">


                        {/* HEADER */}

                        <div className="bg-slate-50 px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">

                            Product

                        </div>


                        {productsToCompare.map(
                            (
                                item,
                                index
                            ) => (

                                <div

                                    key={
                                        item?.id ??
                                        item?.Id
                                    }

                                    className={`border-l border-slate-100 px-4 py-3 ${index === 0
                                            ? "bg-indigo-50/40"
                                            : "bg-slate-50"
                                        }`}

                                >

                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">

                                        {index === 0
                                            ? "Current"
                                            : "Alternative"}

                                    </span>

                                </div>

                            )
                        )}


                        {/* VENDOR */}

                        <div className="border-t border-slate-100 px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">

                            Vendor

                        </div>


                        {productsToCompare.map(
                            (
                                item,
                                index
                            ) => (

                                <div

                                    key={`vendor-${item?.id ?? item?.Id}`}

                                    className={`border-l border-t border-slate-100 px-4 py-4 ${index === 0
                                            ? "bg-indigo-50/20"
                                            : ""
                                        }`}

                                >

                                    <span className="text-xs font-bold text-slate-800">

                                        {item?.brand ??
                                            item?.Brand ??
                                            "—"}

                                    </span>

                                </div>

                            )
                        )}


                        {/* MODEL */}

                        <div className="border-t border-slate-100 px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">

                            Model

                        </div>


                        {productsToCompare.map(
                            (
                                item,
                                index
                            ) => (

                                <div

                                    key={`model-${item?.id ?? item?.Id}`}

                                    className="border-l border-t border-slate-100 px-4 py-4"

                                >

                                    <span className="text-xs text-slate-600">

                                        {item?.model ??
                                            item?.Model ??
                                            item?.variants?.[0]?.model ??
                                            "—"}

                                    </span>

                                </div>

                            )
                        )}


                        {/* PRICE */}

                        <div className="border-t border-slate-100 px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">

                            Price

                        </div>


                        {productsToCompare.map(
                            (
                                item,
                                index
                            ) => {

                                const value =
                                    item?.price ??
                                    item?.Price ??
                                    item?.variants?.[0]?.price;


                                return (

                                    <div

                                        key={`price-${item?.id ?? item?.Id}`}

                                        className={`border-l border-t border-slate-100 px-4 py-4 ${index === 0
                                                ? "bg-indigo-50/20"
                                                : ""
                                            }`}

                                    >

                                        <span className="text-sm font-black text-slate-950">

                                            {Number(
                                                value
                                            ) > 0

                                                ? money(
                                                    value
                                                )

                                                : "—"}

                                        </span>

                                    </div>

                                );

                            }
                        )}


                        {/* ACTION */}

                        <div className="border-t border-slate-100 px-4 py-4" />

                        {productsToCompare.map(
                            (
                                item,
                                index
                            ) => (

                                <div

                                    key={`action-${item?.id ?? item?.Id}`}

                                    className="border-l border-t border-slate-100 px-4 py-4"

                                >

                                    {index === 0 ? (

                                        <span className="text-[10px] font-semibold text-slate-400">

                                            Currently viewing

                                        </span>

                                    ) : (

                                        <button

                                            type="button"

                                            onClick={() =>
                                                navigate(
                                                    `/product/${item?.id ?? item?.Id}`
                                                )
                                            }

                                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-extrabold text-indigo-700 transition hover:bg-indigo-50"

                                        >

                                            View Product

                                            <ArrowRight
                                                size={12}
                                            />

                                        </button>

                                    )}

                                </div>

                            )
                        )}

                    </div>

                </div>

            </div>

        </section>

    );

}