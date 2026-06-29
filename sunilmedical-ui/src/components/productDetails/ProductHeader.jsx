import {
    Heart,
    Share2,
    BadgeCheck,
    Truck,
    ShieldCheck
} from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";

export default function ProductHeader({

    product,

    selectedVariant,

    shareProduct

}) {

    const discount = Number(product?.discountPercentage ?? 0);

    const actualPrice = Number(selectedVariant?.price ?? 0);

    const finalPrice =
        discount > 0
            ? actualPrice - (actualPrice * discount) / 100
            : actualPrice;

    const {

        toggleWishlist: toggleWishlistItem,

        isWishlisted

    } = useWishlist();

    const wishlisted = isWishlisted(

        product.id,

        selectedVariant.id

    );

    return (

        <div className="bg-white rounded-3xl border shadow-sm p-6 lg:p-8 space-y-6">

            {/* Top */}

            <div className="flex
flex-col
sm:flex-row
justify-between
items-start
gap-6
items-start gap-4">

                <div>

                    <div className="flex flex-wrap gap-2 mb-3">

                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">

                            {product.brand}

                        </span>

                        {

                            product.isHotDeal && (

                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">

                                    🔥 Hot Deal

                                </span>

                            )

                        }

                    </div>

                    <h1 className="text-2xl lg:text-4xl font-bold text-gray-900">

                        {product.name}

                    </h1>

                    <p className="mt-2 text-gray-500">

                        {product.category}

                    </p>

                </div>

                <div className="flex gap-3">

                    <button

                        onClick={() =>

                    toggleWishlistItem({

                        id: product.id,

                    variantId:

                    selectedVariant.id,

                    name: product.name,

                    brand: product.brand,

                    category: product.category,

                    priceType: product.priceType,


                    price: selectedVariant.price,

                    imageUrl:

                    selectedVariant.images?.[0]?.imageUrl ??

                    product.imageUrl

})

}
                        className="w-11 h-11 rounded-full border flex items-center justify-center hover:bg-red-50"

                    >

                        <Heart

                            size={22}

                            color="#ef4444"

                            fill={wishlisted ? "#ef4444" : "none"}

                        />

                    </button>

                    <button

                        onClick={shareProduct}

                        className="w-11 h-11 rounded-full border flex items-center justify-center hover:bg-blue-50"

                    >

                        <Share2 size={20} />

                    </button>

                </div>

            </div>

            {/* Price */}

            <div>

                <div className="flex flex-wrap items-center gap-3">

                    <span className="text-4xl font-bold text-green-700">

                        ₹{finalPrice.toFixed(0)}

                    </span>

                    {

                        discount > 0 && (

                            <>

                                <span className="text-xl line-through text-gray-400">

                                    ₹{actualPrice.toFixed(0)}

                                </span>

                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-semibold">

                                    {discount}% OFF

                                </span>

                                <span className="text-green-700">

                                    Save ₹{Math.round(actualPrice - finalPrice)}

                                </span>

                            </>

                        )

                    }

                </div>

            </div>

            {/* Variant */}

            <div
                className="
        grid
        grid-cols-1
        sm:grid-cols-2
        gap-4
    "
            >
                <InfoCard

                    icon={<BadgeCheck size={18} />}

                    title="Model"

                    value={selectedVariant?.model ?? "-"}

                />

                <InfoCard

                    icon={<BadgeCheck size={18} />}

                    title="GST"

                    value={`${product.gstPercentage}%`}

                />

            </div>

            {/* Quick Info */}

            <div className="grid grid-cols-2 gap-4">

                <InfoCard

                    icon={<Truck size={18} />}

                    title="Dispatch"

                    value="Within 2 Working Days"

                />

                <InfoCard

                    icon={<ShieldCheck size={18} />}

                    title="GST Invoice"

                    value="Available"

                />

            </div>

            </div>

    );

}

function InfoCard({ icon, title, value }) {

    return (

        <div className="rounded-2xl border bg-gray-50 p-4">

            <div className="flex items-center gap-2 text-blue-600 mb-2">

                {icon}

                <span className="text-xs font-medium">

                    {title}

                </span>

            </div>

            <div className="font-semibold text-gray-800">

                {value}

            </div>

        </div>

    );

}