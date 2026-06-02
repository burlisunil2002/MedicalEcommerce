import { useMemo } from "react";
import { useWishlist } from "../context/WishlistContext";
import AddToCartButton from "../components/AddToCartButton";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ p }) {

    const navigate = useNavigate();
    const { toggleWishlist, isWishlisted } = useWishlist();

    const defaultVariant =
        p.defaultVariant ??
        (p.variants && p.variants.length > 0
            ? p.variants[0]
            : null);

    const data = useMemo(() => {
        const id = p.id ?? p.Id;
        const name = p.name ?? p.Name;
        const brand = p.brand ?? p.Brand;

        // ✅ IMAGE FIX
        const imageUrl =
            defaultVariant?.imageUrl ||
            p.imageUrl ||
            p.ImageUrl;


        const price =
            p.price ??
            defaultVariant?.price ??
            0;

        const discount = Number(p.discount ?? p.DiscountPercentage ?? 0);

        const isDeal = discount > 0;

        const finalPrice = isDeal
            ? price - (price * discount) / 100
            : price;

        const priceTypeRaw = p.priceType ?? p.PriceType;

        const isNormal =
            priceTypeRaw &&
            priceTypeRaw.toLowerCase() === "normal";

        const isRFQ = !isNormal;


        return {
            id,
            name,
            brand,
            imageUrl,
            price,
            finalPrice,
            discount,
            isDeal,
            isNormal,
            isRFQ,
            defaultVariant
        };

    }, [p]);

    const wishlisted = isWishlisted(
        data.id,
        defaultVariant?.productVariantId ??
        defaultVariant?.id
    );

    return (
        <div className="group h-full flex flex-col bg-white rounded-2xl border border-gray-100 
        shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

            {/* IMAGE */}
            <div
                onClick={() => navigate(`/product/${data.id}`)}
                className="relative h-44 bg-gray-50 flex items-center justify-center p-4 cursor-pointer overflow-hidden"
            >

                {/* 🔥 DEAL BADGES */}
                {data.isDeal && !data.isRFQ && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">

                        <span className="bg-pink-500 text-white text-[10px] px-2 py-[2px] rounded-full">
                            {data.discount}% OFF
                        </span>

                        <span className="bg-black text-white text-[10px] px-2 py-[2px] rounded-full">
                            🔥 Hurry
                        </span>

                    </div>
                )}

                <img
                    src={data.imageUrl || "/images/no-image.png"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain transition group-hover:scale-105"
                />
            </div>

            {/* CONTENT */}
            <div className="p-3 flex flex-col flex-grow">

                <p className="text-[10px] text-gray-400 uppercase">
                    {data.brand}
                </p>

                <h3
                    onClick={() => navigate(`/product/${data.id}`)}
                    className="text-sm font-medium mt-1 line-clamp-2 cursor-pointer hover:underline"
                >
                    {data.name}
                </h3>

                {/* PRICE + ❤️ */}
                <div className="mt-2 flex justify-between items-start">

                    {data.isRFQ ? (
                        <p className="text-sm font-medium text-orange-500">
                            Price on Request
                        </p>
                    ) : (
                        <div>
                            <p className="text-base font-semibold text-gray-900">
                                ₹{Math.round(data.finalPrice)}
                            </p>

                            {data.isDeal && (
                                <>
                                    <p className="text-xs text-gray-400 line-through">
                                        ₹{Math.round(data.price)}
                                    </p>

                                    <p className="text-[11px] text-green-600">
                                        Save ₹{Math.round(data.price - data.finalPrice)}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() =>
                            toggleWishlist({
                                ...p,

                                id: data.id,

                                variantId:
                                    defaultVariant?.productVariantId ??
                                    defaultVariant?.id,

                                selectedVariant:
                                    defaultVariant
                            })
                        }
                    >
                        {wishlisted ? "❤️" : "🤍"}
                    </button>
                </div>

                {/* DELIVERY */}
                {!data.isRFQ && (
                    <p className="text-[11px] text-gray-500 mt-2">
                        🚚 Delivery in 3–5 days
                    </p>
                )}

                {/* CTA */}
                <div className="mt-auto pt-3">

                    {data.isRFQ ? (
                        <button
                            onClick={() => navigate(`/product/${data.id}`)}
                            className="w-full h-9 text-sm bg-black text-white rounded-lg"
                        >
                            Request Quote
                        </button>
                    ) : defaultVariant && (defaultVariant.productVariantId || defaultVariant.id) ? (
                            <AddToCartButton
                                productId={Number(data.id)}
                                variantId={Number(
                                    defaultVariant?.productVariantId ??
                                    defaultVariant?.id
                                )}

                                minQty={Number(
                                    defaultVariant?.minQuantity ??
                                    defaultVariant?.minQty ??
                                    1
                                )}

                                stepQty={Number(
                                    defaultVariant?.stepQuantity ??
                                    defaultVariant?.stepQty ??
                                    1
                                )}

                                maxQty={
                                    defaultVariant?.maxQuantity ??
                                    defaultVariant?.maxQty ??
                                    null
                                }
                            />
                    ) : (
                        <button
                            onClick={() => navigate(`/product/${data.id}`)}
                            className="w-full h-9 text-sm border rounded-lg"
                        >
                            View Product
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
}