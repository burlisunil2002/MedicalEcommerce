import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import {
    Heart,
    ShoppingBag
} from "lucide-react";

export default function WishlistPage() {

    const { wishlist } = useWishlist();

    if (wishlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-5xl animate-bounce mb-4">💔</div>

                <h2 className="text-xl font-semibold">
                    Your wishlist is empty
                </h2>

                <p className="text-gray-500 text-sm mt-2">
                    Save products to see them here
                </p>

                <button
                    onClick={() => window.location.href = "/"}
                    className="mt-6 px-5 py-2 bg-black text-white rounded-lg text-sm"
                >
                    Explore Products
                </button>
            </div>
        );
    }

    return (

        <>

    {/* Wishlist Header */ }

<div
    className="
        relative
        overflow-hidden
        rounded-3xl
        border
        bg-gradient-to-r
        from-pink-50
        via-white
        to-red-50
        shadow-sm
        p-6
        md:p-8
        lg:p-10
        mb-8
    "
>

    {/* Background Decorations */}

    <div
        className="
            absolute
            -right-16
            -top-16
            w-72
            h-72
            rounded-full
            bg-pink-200/30
            blur-3xl
        "
    />

    <div
        className="
            absolute
            right-20
            top-10
            text-pink-300
            text-6xl
            animate-pulse
        "
    >
        ❤
    </div>

    <div
        className="
            absolute
            right-40
            bottom-6
            text-red-300
            text-3xl
            animate-bounce
        "
    >
        ❤
    </div>

    <div
        className="
            relative
            flex
            flex-col
            lg:flex-row
            items-center
            justify-between
            gap-8
        "
    >

        {/* Left */}

        <div>

            <div
                className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    bg-pink-100
                    text-pink-600
                    font-semibold
                    mb-5
                "
            >

                <Heart
                    size={18}
                    fill="currentColor"
                />

                Your Wishlist

            </div>

            <h1
                className="
                    text-3xl
                    md:text-5xl
                    font-bold
                    text-gray-900
                "
            >
                My Wishlist
            </h1>

            <p
                className="
                    mt-4
                    text-gray-600
                    text-base
                    md:text-lg
                    max-w-xl
                "
            >
                Keep all your favourite medical products in one place.
                Add them to your cart anytime and never lose track of
                products you love.
            </p>

        </div>

        {/* Right */}

        <div
            className="
                flex
                items-center
                gap-5
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-4
                    bg-white/90
                    backdrop-blur-md
                    border
                    rounded-2xl
                    shadow-md
                    px-6
                    py-5
                "
            >

                <div
                    className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-pink-100
                        flex
                        items-center
                        justify-center
                    "
                >

                    <ShoppingBag
                        size={28}
                        className="text-pink-600"
                    />

                </div>

            </div>

        </div>

    </div>

</div>
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-5">
            {wishlist.map(item => (
                <ProductCard
                    key={`${item.id}-${item.variantId}`}
                    p={item}
                />            ))}
            </div>

            </>
    );
}