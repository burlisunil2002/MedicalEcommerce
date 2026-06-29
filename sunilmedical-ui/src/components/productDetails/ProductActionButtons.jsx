import {
    ShoppingCart,
    Zap,
    FileText,
    Heart,
    Share2,
    ShieldCheck,
    Truck
} from "lucide-react";

export default function ProductActionButtons({

    product,

    selectedVariant,

    quantity,

    addToCart,

    handleBuyNow,

    toggleWishlist,

    wishlisted

}) {

    const isRFQ =
        product?.priceType !== "Normal";

    return (

        <div
            className="
                mt-8
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
            "
        >

            {/* Trust */}

            <div
                className="
                    grid
                    grid-cols-2
                    gap-4
                    mb-6
                "
            >

                <TrustCard

                    icon={<Truck size={18} />}

                    title="Fast Dispatch"

                    value="2 Working Days"

                />

                <TrustCard

                    icon={<ShieldCheck size={18} />}

                    title="GST Invoice"

                    value="Available"

                />

            </div>

            {/* Buttons */}

            {

                !isRFQ ?

                    (

                        <>

                            {/* Add Cart */}

                            <button

                                type="button"

                                onClick={() =>

                                    addToCart(

                                        Number(product.id),

                                        Number(selectedVariant.id),

                                        quantity

                                    )

                                }

                                className="
                                w-full
                                h-14
                                rounded-2xl
                                bg-blue-600
                                hover:bg-blue-700
                                text-white
                                font-semibold
                                flex
                                items-center
                                justify-center
                                gap-3
                                transition
                            "
                            >

                                <ShoppingCart size={22} />

                                Add To Cart

                            </button>

                            {/* Buy */}

                            <button

                                type="button"

                                onClick={handleBuyNow}

                                className="
                                w-full
                                h-14
                                rounded-2xl
                                bg-green-600
                                hover:bg-green-700
                                text-white
                                font-semibold
                                flex
                                items-center
                                justify-center
                                gap-3
                                mt-4
                            "
                            >

                                <Zap size={22} />

                                Buy Now

                            </button>

                        </>

                    )

                    :

                    (

                        <button

                            className="
                            w-full
                            h-14
                            rounded-2xl
                            bg-orange-500
                            hover:bg-orange-600
                            text-white
                            font-semibold
                            flex
                            items-center
                            justify-center
                            gap-3
                        "
                        >

                            <FileText size={22} />

                            Request Quotation

                        </button>

                    )

            }

            {/* Bottom */}

            <div
                className="
                    mt-6
                    grid
                    grid-cols-2
                    gap-3
                "
            >

                <button

                    onClick={toggleWishlist}

                    className="
                        h-12
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-center
                        gap-2
                        hover:bg-red-50
                    "
                >

                    <Heart

                        size={18}

                        fill={
                            wishlisted

                                ? "#ef4444"

                                : "none"
                        }

                        color="#ef4444"

                    />

                    Wishlist

                </button>

                <button

                    className="
                        h-12
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-center
                        gap-2
                        hover:bg-blue-50
                    "
                >

                    <Share2 size={18} />

                    Share

                </button>

            </div>

            {/* Footer */}

            <div
                className="
                    mt-6
                    text-center
                    text-xs
                    text-gray-500
                "
            >

                100% Genuine Product • Secure Payment • GST Invoice

            </div>

        </div>

    );

}

function TrustCard({

    icon,

    title,

    value

}) {

    return (

        <div
            className="
                rounded-xl
                bg-gray-50
                border
                p-4
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-2
                    text-blue-600
                "
            >

                {icon}

                <span
                    className="
                        text-xs
                    "
                >

                    {title}

                </span>

            </div>

            <div
                className="
                    mt-2
                    font-semibold
                "
            >

                {value}

            </div>

        </div>

    );

}