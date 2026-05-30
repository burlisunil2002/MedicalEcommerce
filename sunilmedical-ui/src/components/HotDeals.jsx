import { useRef } from "react";
import { useNavigate } from "react-router-dom";


export default function HotDeals({ products = [], addToCart }) {

    const scrollRef = useRef();

const navigate = useNavigate();



    if (!products.length) return null;

    return (
        <div className="max-w-7xl mx-auto">
            {/* 🔥 HEADER */}
            <div className="px-4 flex items-center justify-between mb-6">

                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        ⚡ Hot Deals
                    </h2>
                    <p className="text-sm text-gray-500">
                        Limited time offers. Grab them before they're gone!
                    </p>
                </div>

                <button className="text-pink-500 font-semibold text-sm hover:underline">
                    View All →
                </button>

            </div>

            {/* 🎯 SCROLL WRAPPER */}
            <div className="relative -mx-4 px-4">

                <div
                    ref={scrollRef}
                    className="
                        flex gap-5 overflow-x-auto pb-4 no-scrollbar
                        scroll-smooth snap-x snap-mandatory
                    "
                >

                    {products.map((p) => {

                        const id = p.id || p.Id;
                        const name = p.name || p.Name;
                        const brand = p.brand || p.Brand;
                        const image = p.imageUrl || p.ImageUrl;

                        // ✅ FIXED PRICE LOGIC
                        const price =
                            p.price ??
                            p.Price ??
                            p.minPrice ??
                            p.MinPrice ??
                            p.sellingPrice ??
                            p.SellingPrice ??
                            0;

                        // ✅ FIXED DISCOUNT BUG
                        const discount =
                            p.discount ??
                            p.DiscountPercentage ??
                            0;

                        const finalPrice = price - (price * discount) / 100;

                        return (
                            <div
                                key={id}
                                className="min-w-[250px] max-w-[250px] snap-start group"
                            >

                                {/* CARD */}
                                <div className="
                                    rounded-2xl p-[2px]
                                    bg-gradient-to-br from-pink-500 via-orange-400 to-red-400
                                    transition hover:scale-[1.02]
                                ">

                                    <div className="bg-white rounded-2xl p-3 h-full">

                                        {/* IMAGE */}
                                        <div className="relative bg-gray-50 rounded-xl h-40 flex items-center justify-center overflow-hidden">

                                            {/* DISCOUNT */}
                                            {discount > 0 && (
                                                <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full font-bold">
                                                    -{discount}%
                                                </div>
                                            )}

                                            {/* URGENCY */}
                                            <div className="absolute top-2 right-2 text-[10px] bg-pink-500 text-white px-2 py-1 rounded-full animate-pulse">
                                                Hurry
                                            </div>

                                            <img
                                                src={image}
                                                alt={name}
                                                onClick={() =>
                                                    navigate(`/product/${id}`)
                                                }
                                                className="
        max-h-full
        object-contain
        group-hover:scale-110
        transition
        duration-300
        cursor-pointer
    "
                                            />


                                        </div>

                                        {/* CONTENT */}
                                        <div className="mt-3 space-y-1">

                                            {/* BRAND */}
                                            <p className="text-[10px] uppercase text-gray-400 font-semibold">
                                                {brand}
                                            </p>

                                            {/* NAME */}
                                            <p
                                                onClick={() =>
                                                    navigate(`/product/${id}`)
                                                }
                                                className="
        text-sm
        font-semibold
        text-gray-800
        line-clamp-2
        group-hover:text-pink-500
        transition
        cursor-pointer
    "
                                            >
                                                {name}
                                            </p>


                                            {/* PRICE */}
                                            <div className="mt-2">

                                                <span className="text-xl font-extrabold text-gray-900">
                                                    ₹{Math.round(finalPrice).toLocaleString("en-IN")}
                                                </span>

                                                <div className="flex items-center gap-2">

                                                    <span className="text-xs line-through text-gray-400">
                                                        ₹{Math.round(price).toLocaleString("en-IN")}
                                                    </span>

                                                    {discount > 0 && (
                                                        <span className="text-xs text-green-600 font-semibold">
                                                            Save {discount}%
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                            {/* CTA */}
                                            <button
                                            onClick={() =>
                                                navigate(`/product/${id}`)
                                            }
                                                className="
                                                    w-full mt-3 py-2 rounded-lg text-sm font-semibold text-white
                                                    bg-gradient-to-r from-pink-500 to-orange-400
                                                    hover:from-pink-600 hover:to-orange-500
                                                    shadow-md hover:shadow-lg transition
                                                "
                                            >
                                                Grab Deal Now
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}