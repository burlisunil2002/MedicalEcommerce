import {
    CheckCircle2,
    BadgeIndianRupee,
    Package,
    Boxes
} from "lucide-react";

export default function ProductVariantSelector({

    product,

    variants = [],

    selectedVariant,

    onVariantChange

}) {

    //--------------------------------------------------------
    // Hide if only one variant
    //--------------------------------------------------------

    if (!variants || variants.length <= 1)
        return null;

    //--------------------------------------------------------
    // Discount
    //--------------------------------------------------------

    const discount =
        Number(product?.discountPercentage ?? 0);

    //--------------------------------------------------------
    // Render
    //--------------------------------------------------------

    return (

        <section className="mt-12">

            {/* Header */}

            <div className="flex items-center justify-between mb-6">

                <div>

                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">

                        Available Models

                    </h2>

                    <p className="text-gray-500 mt-1">

                        Select your preferred model.

                    </p>

                </div>

                <span
                    className="
                        hidden
                        sm:block
                        text-sm
                        text-gray-400
                    "
                >

                    {variants.length} Models

                </span>

            </div>

            {/* Grid */}


               <div
                className="
        grid
        grid-cols-2
        md:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-3
        gap-6
        w-full
    "
            >

                {

                    variants.map((variant) => {

                        //--------------------------------------------------------

                        // Selected

                        //--------------------------------------------------------

                        const selected =

                            Number(

                                selectedVariant?.productVariantId

                            )

                            ===

                            Number(

                                variant.productVariantId

                            );

                        //--------------------------------------------------------

                        // Price

                        //--------------------------------------------------------

                        const actualPrice =

                            Number(

                                variant.price ?? 0

                            );

                        const finalPrice =

                            discount > 0

                                ?

                                actualPrice -

                                (

                                    actualPrice *

                                    discount /

                                    100

                                )

                                :

                                actualPrice;

                        //--------------------------------------------------------

                        // Image

                        //--------------------------------------------------------

                        const image =

                            variant.images?.[0]?.imageUrl

                            ??

                            product.imageUrl

                            ??

                            "/images/no-image.png";

                        //--------------------------------------------------------

                        // Stock

                        //--------------------------------------------------------

                        const inStock =

                            Number(

                                variant.stockQuantity ?? 0

                            ) > 0;

                        //--------------------------------------------------------

                        // Card

                        //--------------------------------------------------------

                        return (

                            <button
                                key={variant.productVariantId}
                                type="button"
                                onClick={() => {
                                    onVariantChange(variant);

                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth"
                                    });
                                }}
                                className={`
        relative
        flex
        flex-col
        rounded-2xl
        overflow-hidden
        border
        bg-white
        transition-all
        duration-300
        cursor-pointer
        hover:shadow-xl
        hover:-translate-y-1
        w-full
        min-h-[360px]

        ${selected
                                        ? "border-blue-600 ring-4 ring-blue-100 shadow-xl scale-[1.02]"
                                        : "border-gray-200 hover:border-blue-400"
                                    }
    `}
                            >
                                {/* Selected Badge */}

                                {selected && (
                                    <div className="absolute top-3 right-3 z-20">

                                        <CheckCircle2
                                            size={26}
                                            className="text-blue-600"
                                        />

                                    </div>
                                )}

                                {/* Product Image */}

                                <div
                                    className="
            h-48
            bg-gray-50
            flex
            items-center
            justify-center
            border-b
            p-4
        "
                                >

                                    <img
                                        src={image}
                                        alt={variant.model}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.src = product.imageUrl;
                                        }}
                                        className="
                w-full
                h-full
                object-contain
                transition
                duration-300
                hover:scale-105
            "
                                    />

                                </div>

                                {/* Card Body */}

                                <div
                                    className="
            flex
            flex-col
            flex-1
            p-5
        "
                                >

                                    {/* Variant */}

                                    <h3
                                        className="
                text-center
                font-bold
                text-lg
                leading-6
                line-clamp-2
                min-h-[56px]
                text-gray-900
            "
                                    >

                                        {variant.model}

                                    </h3>

                                    {/* Price */}

                                    <div className="mt-4 text-center">

                                        <div
                                            className="
                    flex
                    justify-center
                    items-center
                    gap-2
                "
                                        >

                                            <BadgeIndianRupee
                                                size={20}
                                                className="text-green-600"
                                            />

                                            <span
                                                className="
                        text-2xl
                        font-bold
                        text-green-700
                    "
                                            >

                                                ₹{finalPrice.toFixed(0)}

                                            </span>

                                        </div>

                                        {discount > 0 && (

                                            <div
                                                className="
                        mt-2
                        flex
                        justify-center
                        items-center
                        gap-2
                        flex-wrap
                    "
                                            >

                                                <span
                                                    className="
                            text-gray-400
                            line-through
                            text-sm
                        "
                                                >

                                                    ₹{actualPrice.toFixed(0)}

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

                                        )}

                                    </div>

                                </div>

                            </button>
                            
                        );

                    })

                }

            </div>

        </section>

    );

}