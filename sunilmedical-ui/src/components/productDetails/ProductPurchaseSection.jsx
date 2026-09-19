import {
    Heart,
    Share2,
    Check,
    ShoppingCart,
    Zap,
    FileText,
} from "lucide-react";

import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";

export default function ProductPurchaseSection({
    product,
    selectedVariant,
    onBuyNow,
    setMessage,
    shareProduct,
}) {
    const { toggleWishlist, isWishlisted } = useWishlist();
    const { addToCart, loadCart, getQty } = useCart();

    if (!product) return null;

    const variantId =
        selectedVariant?.productVariantId ??
        selectedVariant?.id ??
        null;

    const price = Number(
        selectedVariant?.price ??
        product?.price ??
        0
    );

    const discount = Math.max(
        0,
        Math.min(
            100,
            Number(product?.discountPercentage ?? 0)
        )
    );

    const finalPrice =
        discount > 0
            ? price - (price * discount) / 100
            : price;

    const stockValue =
        selectedVariant?.stockQuantity ??
        product?.stockQuantity;

    const hasStock =
        stockValue !== null &&
        stockValue !== undefined &&
        stockValue !== "";

    const stock =
        hasStock
            ? Number(stockValue)
            : null;

    const outOfStock =
        stock !== null &&
        !Number.isNaN(stock) &&
        stock <= 0;

    const minQty =
        Number(selectedVariant?.minQuantity) > 0
            ? Number(selectedVariant.minQuantity)
            : 1;

    const cartQuantity = variantId
        ? Number(getQty?.(variantId) || 0)
        : 0;

    const wishlistActive =
        variantId
            ? isWishlisted(product.id, variantId)
            : false;

    const handleWishlist = async () => {
        if (!variantId) {
            setMessage?.("Please select a valid variant.");
            return;
        }

        try {
            await toggleWishlist({
                id: product.id,
                variantId,
                name: product.name,
                brand: product.brand,
                imageUrl:
                    selectedVariant?.images?.[0]?.imageUrl ??
                    product.imageUrl,
                price,
                discountPercentage: discount,
                category: product.category,
                gstPercentage: product.gstPercentage,
                selectedVariant,
            });
        } catch (err) {
            console.error("Wishlist error:", err);
            setMessage?.("Unable to update wishlist.");
        }
    };

    const handleAddToCart = async () => {
        if (outOfStock) {
            setMessage?.("This product is currently out of stock.");
            return;
        }

        if (
            Array.isArray(product.variants) &&
            product.variants.length > 0 &&
            !variantId
        ) {
            setMessage?.("Please select a variant.");
            return;
        }

        try {
            const result = await addToCart(
                product.id,
                variantId,
                minQty
            );

            if (result === false) {
                setMessage?.("Unable to add product to cart.");
                return;
            }

            await loadCart();
            setMessage?.(
                cartQuantity > 0
                    ? `Cart updated • ${cartQuantity + minQty} item${cartQuantity + minQty === 1 ? "" : "s"}`
                    : `Added to cart • ${minQty} item${minQty === 1 ? "" : "s"}`
            );
        } catch (err) {
            console.error("Add to cart error:", err);

            setMessage?.(
                err?.response?.data?.message ||
                "Unable to add product to cart."
            );
        }
    };

    const formatPrice = (value) =>
        Number(value || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        });

    return (
        <article
            className="
                w-full
                rounded-xl
                border border-slate-200
                bg-white
                shadow-sm
                overflow-hidden
            "
        >
            {/* Header */}
            <div className="px-4 py-4 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        {product?.brand && (
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {product.brand}
                            </p>
                        )}

                        <h1 className="mt-1 text-xl font-semibold leading-7 text-slate-900 sm:text-2xl">
                            {product.name}
                        </h1>

                        {selectedVariant?.model && (
                            <p className="mt-1.5 text-sm text-slate-500">
                                Model:{" "}
                                <span className="font-medium text-slate-700">
                                    {selectedVariant.model}
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleWishlist}
                            aria-label={
                                wishlistActive
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"
                            }
                            className={`
                                flex h-9 w-9 items-center justify-center
                                rounded-full border transition
                                ${wishlistActive
                                    ? "border-red-200 bg-red-50 text-red-500"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900"
                                }
                            `}
                        >
                            <Heart
                                size={18}
                                fill={
                                    wishlistActive
                                        ? "currentColor"
                                        : "none"
                                }
                            />
                        </button>

                        <button
                            type="button"
                            onClick={shareProduct}
                            aria-label="Share product"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            <Share2 size={17} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                    {price > 0 ? (
                        <>
                            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {formatPrice(finalPrice)}
                                </span>

                                {discount > 0 && (
                                    <>
                                        <span className="text-sm text-slate-400 line-through">
                                            {formatPrice(price)}
                                        </span>

                                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                            {discount}% OFF
                                        </span>
                                    </>
                                )}
                            </div>

                            {discount > 0 && (
                                <p className="mt-1 text-xs font-medium text-emerald-700">
                                    You save {formatPrice(price - finalPrice)}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-lg font-semibold text-slate-900">
                            Price available on request
                        </p>
                    )}
                </div>

                {/* Stock */}
                <div className="mt-3.5">
                    {outOfStock ? (
                        <p className="text-sm font-semibold text-red-600">
                            Currently unavailable
                        </p>
                    ) : hasStock && stock <= 10 ? (
                        <p className="text-sm font-medium text-amber-700">
                            Only {stock} left in stock
                        </p>
                    ) : (
                        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                            <Check size={15} />
                            In stock
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={outOfStock}
                        className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            border border-slate-300
                            bg-white
                            px-3
                            text-sm
                            font-semibold
                            text-slate-800
                            transition
                            hover:border-slate-400
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <ShoppingCart size={17} />
                        Add to Cart
                    </button>

                    <button
                        type="button"
                        onClick={onBuyNow}
                        disabled={outOfStock}
                        className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-slate-900
                            px-3
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-slate-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <Zap size={17} />
                        Buy Now
                    </button>
                </div>

                {cartQuantity > 0 && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <span className="text-slate-500">
                            In your cart
                        </span>
                        <span className="font-semibold text-slate-800">
                            {cartQuantity} item{cartQuantity === 1 ? "" : "s"}
                        </span>
                    </div>
                )}

                {product?.priceType &&
                    product.priceType !== "Normal" && (
                        <button
                            type="button"
                            onClick={() =>
                                setMessage?.(
                                    "Quotation request option is available for this product."
                                )
                            }
                            className="
                                mt-2.5
                                flex
                                min-h-10
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                border-slate-200
                                bg-slate-50
                                px-3
                                text-sm
                                font-medium
                                text-slate-700
                                transition
                                hover:bg-slate-100
                            "
                        >
                            <FileText size={16} />
                            Request Quote
                        </button>
                    )}
            </div>

            {/* Compact trust row */}
            <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-slate-500">
                    <Check size={14} className="text-emerald-600" />
                    Secure purchase
                </div>

                <div className="border-l border-slate-100 px-3 py-3 text-center text-xs text-slate-500">
                    Delivery available
                </div>
            </div>
        </article>
    );
}
