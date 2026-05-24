import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import AddToCartButton from "../components/AddToCartButton";
import { useWishlist } from "../context/WishlistContext";
import RecommendedProducts from "../components/RecommendedProducts";

export default function ProductDetails() {

    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [showSpecs, setShowSpecs] = useState(false);

    const { toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        window.scrollTo(0, 0);

        API.get(`/api/products/${id}`)
            .then(res => {
                const data = res.data;
                setProduct(data);

                if (data.variants?.length > 0) {
                    setSelectedVariant(
                        data.defaultVariant || data.variants[0]
                    );
                }
            });
    }, [id]);

    const data = useMemo(() => {

        if (!product) return {};

        const defaultVariant =
            selectedVariant ??
            product?.defaultVariant ??
            (product?.variants?.length > 0
                ? product.variants[0]
                : null);

        const id = product?.id ?? product?.Id;
        const name = product?.name ?? product?.Name;
        const brand = product?.brand ?? product?.Brand;

        const imageUrl =
            defaultVariant?.imageUrl ||
            product?.imageUrl ||
            product?.ImageUrl;

        const price =
            defaultVariant?.price ??
            product?.price ??
            0;

        const discountPercentage = Number(
            product?.discount ??
            product?.DiscountPercentage ??
            product?.discountPercentage ??
            0
        );


        const isHotDeal = product?.isHotDeal ?? product?.IsHotDeal ?? false;

        const isDeal = isHotDeal || discountPercentage > 0;;

        const finalPrice = isDeal
            ? price - (price * discountPercentage) / 100
            : price;

        const priceTypeRaw = product?.priceType ?? product?.PriceType;

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
            discountPercentage,
            isDeal,
            isNormal,
            isRFQ,
            defaultVariant
        };

    }, [product, selectedVariant]);

    // ✅ AFTER hooks
    if (!product) return <div className="p-6">Loading...</div>;

    const wishlisted = isWishlisted(data.id);

    // 🔥 SPEC FALLBACK
    const firstVariant = product.variants?.[0];

    const specifications =
        selectedVariant?.specifications?.length > 0
            ? selectedVariant.specifications
            : firstVariant?.specifications?.length > 0
                ? firstVariant.specifications
                : product.specifications || [];

    return (
        <div className="bg-white min-h-screen select-none">
            <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-12">

                {/* IMAGE */}
                <div className="lg:sticky lg:top-24 self-start">
                    <div className="bg-gray-50 rounded-2xl p-6 relative">

                        {/* 🔥 DEAL BADGES (SYNCED) */}
                        {data.isDeal && !data.isRFQ && (
                            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">

                                <span className="bg-pink-500 text-white text-xs px-3 py-1 rounded-full">
                                    {data.discountPercentage}% OFF
                                </span>

                                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                                    🔥 Hurry
                                </span>

                            </div>
                        )}

                        <img
                            src={data.imageUrl || "/images/no-image.png"}
                            className="w-full h-[350px] object-contain mt-4"
                        />
                    </div>
                </div>

                {/* DETAILS */}
                <div className="flex flex-col">

                    {/* HEADER */}
                    <div className="flex justify-between items-start">

                        <div>
                            <p className="text-xs text-gray-400 uppercase">
                                {data.brand}
                            </p>

                            <h1 className="text-2xl font-semibold mt-1">
                                {data.name}
                            </h1>
                        </div>

                        {/* ❤️ */}
                        <button
                            onClick={() =>
                                toggleWishlist({
    ...product,
    variantId: selectedVariant?.productVariantId ?? selectedVariant?.id,
    selectedVariant: selectedVariant
})
                            }
                            className="text-xl"
                        >
                            {wishlisted ? "❤️" : "🤍"}
                        </button>
                    </div>

                    {/* DESCRIPTION */}
                    <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                        {product.description || "No description available"}
                    </p>

                    {/* PRICE (SYNCED) */}
                    <div className="mt-6">

                        {data.isRFQ ? (
                            <span className="text-orange-500 font-medium">
                                Price on Request
                            </span>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">

                                    <span className="text-2xl font-semibold">
                                        ₹{Math.round(data.finalPrice)}
                                    </span>

                                    {data.isDeal && (
                                        <span className="text-gray-400 line-through">
                                            ₹{Math.round(data.price)}
                                        </span>
                                    )}
                                </div>

                                {data.isDeal && (
                                    <p className="text-sm text-green-600 mt-1">
                                        You save ₹{Math.round(data.price - data.finalPrice)}
                                    </p>
                                )}
                            </>
                        )}

                    </div>

                    {/* VARIANTS */}
                    {product.variants?.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-medium mb-2">
                                Select Model
                            </p>

                            <div className="flex flex-wrap gap-2">

                                {product.variants.map(v => {
                                    const vId = v.productVariantId ?? v.id;
                                    const selectedId = selectedVariant?.productVariantId ?? selectedVariant?.id;

                                    return (
                                        <button
                                            key={vId}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`px-3 py-1 text-sm rounded-full border transition
                                            ${selectedId === vId
                                                    ? "bg-black text-white border-black"
                                                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            {v.model}
                                        </button>
                                    );
                                })}

                            </div>
                        </div>
                    )}

                    {/* ADD TO CART */}
                    <div className="mt-6 max-w-xs">

                        {data.isRFQ ? (
                            <button className="w-full h-10 bg-black text-white rounded-lg text-sm">
                                Request Quote
                            </button>
                        ) : (
                            <AddToCartButton
                                productId={data.id}
                                variantId={data.defaultVariant?.productVariantId ?? data.defaultVariant?.id}
                                minQty={data.defaultVariant?.minQuantity || 1}
                                maxQty={data.defaultVariant?.maxQuantity}
                                stepQty={data.defaultVariant?.stepQuantity || 1}
                            />
                        )}

                    </div>

                    {/* SPECIFICATIONS */}
                    <div className="mt-8">

                        <button
                            onClick={() => setShowSpecs(!showSpecs)}
                            className="text-sm text-blue-600"
                        >
                            {showSpecs ? "Hide Details" : "View Details"}
                        </button>

                        {showSpecs && (
                            <div className="mt-3 border rounded-xl">

                                {selectedVariant?.specifications?.length === 0 && (
                                    <p className="text-xs text-gray-400 px-4 py-2">
                                        Showing default specifications
                                    </p>
                                )}

                                {specifications.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between px-4 py-2 border-b text-sm"
                                    >
                                        <span className="text-gray-500">{s.key}</span>
                                        <span>{s.value}</span>
                                    </div>
                                ))}

                            </div>
                        )}

                    </div>

                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-16">
                <RecommendedProducts currentProduct={product} />
            </div>

        </div>
    );
}