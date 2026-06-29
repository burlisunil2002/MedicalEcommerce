import React from "react";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart } from "lucide-react";

export default function RecentlyViewed({

    products = []

}) {

    if (!products.length)
        return null;

    return (

        <section>

            {/* Header */}

            <div className="flex items-center justify-between mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-gray-800">

                        Recently Viewed

                    </h2>

                    <p className="text-gray-500 mt-1">

                        Continue where you left off.

                    </p>

                </div>

                <div className="hidden md:flex items-center gap-2 text-blue-600">

                    <Eye size={18} />

                    <span className="font-medium">

                        {products.length} Products

                    </span>

                </div>

            </div>

            {/* Products */}

            <div
                className="
                    grid
                    grid-cols-2
                    md:grid-cols-3
                    lg:grid-cols-5
                    gap-6
                "
            >

                {

                    products.map(product => {

                        const variant =
                            product.variants?.[0];

                        const price =
                            variant?.price || 0;

                        return (

                            <Link

                                key={product.id}

                                to={`/products/${product.id}`}

                                className="
                                    bg-white
                                    rounded-2xl
                                    shadow
                                    hover:shadow-xl
                                    transition
                                    overflow-hidden
                                    group
                                "

                            >

                                {/* Image */}

                                <div
                                    className="
                                        bg-gray-50
                                        h-48
                                        flex
                                        items-center
                                        justify-center
                                        overflow-hidden
                                    "
                                >

                                    <img

                                        src={

                                            variant?.images?.[0]?.imageUrl ||

                                            product.imageUrl

                                        }

                                        alt={product.name}

                                        className="
                                            h-full
                                            object-contain
                                            group-hover:scale-105
                                            transition
                                        "

                                    />

                                </div>

                                {/* Details */}

                                <div className="p-4">

                                    <p className="text-xs text-blue-600 font-medium">

                                        {product.brand}

                                    </p>

                                    <h3
                                        className="
                                            font-semibold
                                            text-gray-800
                                            mt-1
                                            line-clamp-2
                                            min-h-[48px]
                                        "
                                    >

                                        {product.name}

                                    </h3>

                                    <div className="mt-3">

                                        <span
                                            className="
                                                text-xl
                                                font-bold
                                                text-green-700
                                            "
                                        >

                                            ₹{Number(price).toLocaleString()}

                                        </span>

                                    </div>

                                    <button

                                        className="
                                            mt-4
                                            w-full
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            bg-blue-600
                                            hover:bg-blue-700
                                            text-white
                                            rounded-xl
                                            py-2
                                            transition
                                        "

                                    >

                                        <ShoppingCart size={18} />

                                        View Product

                                    </button>

                                </div>

                            </Link>

                        );

                    })

                }

            </div>

        </section>

    );

}