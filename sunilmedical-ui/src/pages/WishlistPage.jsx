import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import {
    Heart,
    ShoppingBag,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WishlistPage() {

    const { wishlist = [] } = useWishlist();
    const navigate = useNavigate();

    const wishlistCount = wishlist.length;

    /* =========================
       EMPTY WISHLIST
    ========================= */

    if (wishlistCount === 0) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:py-16">

                <div className="w-full max-w-md text-center">

                    {/* Icon */}

                    <div
                        className="
                            mx-auto
                            w-20
                            h-20
                            sm:w-24
                            sm:h-24
                            rounded-full
                            bg-pink-50
                            flex
                            items-center
                            justify-center
                            mb-6
                        "
                    >
                        <Heart
                            size={40}
                            strokeWidth={1.6}
                            className="text-pink-500"
                        />
                    </div>

                    {/* Heading */}

                    <h1
                        className="
                            text-2xl
                            sm:text-3xl
                            font-bold
                            text-gray-900
                        "
                    >
                        Your wishlist is empty
                    </h1>

                    <p
                        className="
                            mt-3
                            text-sm
                            sm:text-base
                            leading-6
                            text-gray-500
                        "
                    >
                        Save medical products you are interested in
                        and come back to them anytime.
                    </p>

                    {/* CTA */}

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="
                            mt-7
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            px-6
                            py-3
                            rounded-xl
                            bg-gray-900
                            text-white
                            text-sm
                            font-semibold
                            hover:bg-gray-800
                            active:scale-[0.98]
                            transition
                            w-full
                            sm:w-auto
                        "
                    >
                        Explore Products

                        <ArrowRight size={17} />
                    </button>

                </div>

            </main>
        );
    }

    /* =========================
       WISHLIST PAGE
    ========================= */

    return (
        <main className="w-full overflow-x-hidden bg-slate-50/40">
            <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">

                {/* =================================
                    HEADER
                ================================= */}

                <section
                    className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    sm:rounded-3xl
                    border
                    border-gray-200
                    bg-gradient-to-br
                    from-pink-50
                    via-white
                    to-red-50
                    shadow-sm
                    mb-6
                    sm:mb-8
                "
                >

                    {/* Subtle background */}

                    <div
                        className="
                        absolute
                        -right-20
                        -top-20
                        w-56
                        h-56
                        sm:w-72
                        sm:h-72
                        rounded-full
                        bg-pink-200/30
                        blur-3xl
                        pointer-events-none
                    "
                    />

                    <div
                        className="
                        relative
                        p-5
                        sm:p-7
                        md:p-9
                        lg:p-10
                    "
                    >

                        <div
                            className="
                            flex
                            flex-col
                            gap-6
                            sm:gap-7
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        "
                        >

                            {/* LEFT */}

                            <div className="min-w-0">

                                {/* Badge */}

                                <div
                                    className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-1.5
                                    rounded-full
                                    bg-pink-100
                                    text-pink-600
                                    text-xs
                                    sm:text-sm
                                    font-semibold
                                "
                                >
                                    <Heart
                                        size={15}
                                        fill="currentColor"
                                    />

                                    My Wishlist
                                </div>

                                {/* Heading */}

                                <h1
                                    className="
                                    mt-4
                                    text-2xl
                                    sm:text-3xl
                                    md:text-4xl
                                    lg:text-5xl
                                    font-bold
                                    tracking-tight
                                    text-gray-900
                                "
                                >
                                    Your Favourite Products
                                </h1>

                                {/* Description */}

                                <p
                                    className="
                                    mt-3
                                    max-w-2xl
                                    text-sm
                                    sm:text-base
                                    md:text-lg
                                    leading-6
                                    md:leading-7
                                    text-gray-600
                                "
                                >
                                    Keep your favourite medical products
                                    saved here for quick access whenever
                                    you need them.
                                </p>

                            </div>

                            {/* RIGHT STATS */}

                            <div
                                className="
                                flex
                                w-full
                                items-center
                                justify-between
                                sm:w-auto
                                sm:justify-start
                                gap-3
                                sm:gap-4
                                shrink-0
                            "
                            >

                                {/* Wishlist Count */}

                                <div
                                    className="
                                    flex
                                    items-center
                                    gap-3
                                    sm:gap-4
                                    bg-white
                                    border
                                    border-gray-200
                                    rounded-2xl
                                    shadow-sm
                                    px-4
                                    py-3
                                    sm:px-5
                                    sm:py-4
                                    min-w-0
                                "
                                >

                                    <div
                                        className="
                                        w-11
                                        h-11
                                        sm:w-12
                                        sm:h-12
                                        rounded-xl
                                        bg-pink-100
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0
                                    "
                                    >
                                        <ShoppingBag
                                            size={22}
                                            className="text-pink-600"
                                        />
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================
                PRODUCT SECTION
            ================================= */}

                <section>

                    {/* Section header */}

                    <div
                        className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        mb-4
                        sm:mb-5
                    "
                    >

                        <div>

                            <h2
                                className="
                                text-lg
                                sm:text-xl
                                md:text-2xl
                                font-bold
                                text-gray-900
                            "
                            >
                                Saved Products
                            </h2>

                            <p
                                className="
                                mt-1
                                text-xs
                                sm:text-sm
                                text-gray-500
                            "
                            >
                                {wishlistCount}{" "}
                                {wishlistCount === 1
                                    ? "product"
                                    : "products"}{" "}
                                saved
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="
                            hidden
                            sm:inline-flex
                            items-center
                            gap-1.5
                            text-sm
                            font-semibold
                            text-gray-700
                            hover:text-pink-600
                            transition
                        "
                        >
                            Continue Shopping
                            <ArrowRight size={16} />
                        </button>

                    </div>

                    {/* Product Grid */}

                    <div
                        className="
                        grid
                        grid-cols-2
                        gap-x-3
                        gap-y-4
                        sm:gap-x-5
                        sm:gap-y-5
                        md:grid-cols-3
                        md:gap-5
                        lg:grid-cols-4
                        lg:gap-6
                        xl:grid-cols-5
                    "
                    >

                        {wishlist.map((item) => (

                            <div
                                key={`${item.id}-${item.variantId ?? "default"}`}
                                className="min-w-0"
                            >
                                <ProductCard
                                    p={item}
                                />
                            </div>

                        ))}

                    </div>

                    {/* Mobile Continue Shopping */}

                    <div className="mt-7 sm:hidden">

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="
                            w-full
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            px-5
                            py-3
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            text-gray-800
                            text-sm
                            font-semibold
                            hover:bg-gray-50
                            transition
                        "
                        >
                            Continue Shopping

                            <ArrowRight size={16} />
                        </button>

                    </div>

                </section>

            </div>
        </main>
    );
}