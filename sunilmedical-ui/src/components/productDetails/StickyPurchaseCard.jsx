import {
    Zap,
    FileText    
} from "lucide-react";
import AddToCartButton from "../../components/AddToCartButton";

export default function StickyPurchaseCard({

    product,

    selectedVariant,

    onBuyNow

}) {

    if (!selectedVariant)
        return null;

    const originalPrice =
        Number(selectedVariant.price ?? 0);

    const discount =
        Number(product.discountPercentage ?? 0);

    const finalPrice =
        discount > 0
            ? originalPrice - (originalPrice * discount / 100)
            : originalPrice;

    const image =

        selectedVariant.images?.length > 0

            ?

            selectedVariant.images[0].imageUrl

            :

            product.imageUrl;

    return (

        <aside
            className="
hidden
lg:block
sticky
top-24
w-full
max-w-md
rounded-3xl
border
border-gray-200
bg-white
shadow-xl
p-6
"
        >

            {/* Image */}

            <div
                className="
        rounded-2xl
        bg-gradient-to-br
        from-slate-50
        to-white
        border
        p-6
        flex
        items-center
        justify-center
    "
            
            >

                <img
                    src={image}
                    alt={selectedVariant.model}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = "/images/no-image.png";
                    }}
                    className="
        w-full
        h-56
        object-contain
        transition-transform
        duration-300
        hover:scale-105
    "
                />

            </div>

            {/* Model */}

            <h3
                className="
                    mt-5
                    text-xl
                    font-bold
                    text-gray-900
                "
            >

                {selectedVariant.model}

            </h3>

            {/* Price */}

            <div className="mt-5">

                <div className="flex items-center gap-2">

                    <span
                        className="
                            text-3xl
                            font-bold
                            text-green-700
                        "
                    >

                        ₹{finalPrice.toFixed(0)}

                    </span>

                </div>

                {

                    discount > 0 && (

                        <div
                            className="
                                mt-2
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <span
                                className="
                                    line-through
                                    text-gray-400
                                "
                            >

                                ₹{originalPrice.toFixed(0)}

                            </span>

                            <span
                                className="
                                    px-2
                                    py-1
                                    rounded-full
                                    bg-red-100
                                    text-red-600
                                    text-xs
                                    font-semibold
                                "
                            >

                                {discount}% OFF

                            </span>

                        </div>

                    )

                }

            </div>

            {/* Add To Cart */}

            <div className="mt-6">

                <AddToCartButton

                    productId={product.id}

                    variantId={selectedVariant.id}

                    minQty={selectedVariant.minQuantity}

                    maxQty={selectedVariant.maxQuantity}

                    stepQty={selectedVariant.stepQuantity}

                />

            </div>

            {/* Buy Now */}

            <button

                onClick={onBuyNow}

                className="
        w-full
        mt-3
        h-12
        rounded-xl
        bg-green-600
        text-white
        font-semibold
        flex
        items-center
        justify-center
        gap-2
        hover:bg-green-700
    "

            >

                <Zap size={18} />

                Buy Now

            </button>

            {

                product.priceType !== "Normal" && (

                    <button

                        className="
                            w-full
                            mt-3
                            h-12
                            rounded-xl
                            bg-orange-500
                            text-white
                            flex
                            items-center
                            justify-center
                            gap-2
                            hover:bg-orange-600
                        "

                    >

                        <FileText size={18} />

                        Request Quote

                    </button>

                )

            }

        </aside>

    );

}