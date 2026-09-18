import React, { memo, useMemo } from "react";
import { Package, ShoppingBag } from "lucide-react";

/*
 * OrderItemsSection
 *
 * API checkout item shape supported:
 * {
 *   id,
 *   quantity,
 *   productId,
 *   productName,
 *   productImage,
 *   variantId,
 *   variantName,
 *   productPrice,
 *   productFinalPrice
 * }
 *
 * Important:
 * - productPrice = original/current product price
 * - productFinalPrice = actual selling price after product discount
 * - The checkout API is the source of truth for Review.
 * - No API call is made from this component.
 */

const formatCurrency = (value) => {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
};

const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const getImageUrl = (item) => {
    return (
        item?.productImage ||
        item?.imageUrl ||
        item?.image ||
        item?.product?.imageUrl ||
        item?.product?.image ||
        "/images/product-placeholder.png"
    );
};

const getProductName = (item) => {
    return (
        item?.productName ||
        item?.name ||
        item?.product?.name ||
        "Product"
    );
};

const getVariantName = (item) => {
    return (
        item?.variantName ||
        item?.variant ||
        item?.productVariantName ||
        item?.product?.variantName ||
        ""
    );
};

/*
 * Your /api/checkout response contains:
 *
 * productPrice: 4449
 * productFinalPrice: 3559.20
 *
 * Therefore productFinalPrice MUST be checked before the older
 * generic frontend field names.
 */
const getPrice = (item) => {
    const value =
        item?.productFinalPrice ??
        item?.finalPrice ??
        item?.sellingPrice ??
        item?.unitPrice ??
        item?.price ??
        item?.product?.finalPrice ??
        item?.product?.sellingPrice ??
        item?.product?.price ??
        item?.productPrice ??
        0;

    return Math.max(0, toNumber(value));
};

const getOriginalPrice = (item) => {
    const value =
        item?.productPrice ??
        item?.originalPrice ??
        item?.mrp ??
        item?.product?.mrp ??
        item?.product?.price ??
        item?.price ??
        0;

    return Math.max(0, toNumber(value));
};

const getQuantity = (item) => {
    return Math.max(1, Math.floor(toNumber(item?.quantity, 1)));
};

const getLineTotal = (item, price, quantity) => {
    /*
     * If the backend later sends lineTotal/subtotal, use it.
     * Otherwise calculate from the actual final unit price.
     */
    const backendLineTotal =
        item?.lineTotal ??
        item?.subtotal ??
        item?.totalPrice;

    if (
        backendLineTotal !== null &&
        backendLineTotal !== undefined &&
        backendLineTotal !== ""
    ) {
        const total = toNumber(backendLineTotal, NaN);

        if (Number.isFinite(total)) {
            return Math.max(0, total);
        }
    }

    return Math.max(0, price * quantity);
};

const getDiscountPercentage = (item, originalPrice, price) => {
    if (originalPrice > price && originalPrice > 0) {
        return Math.round(
            ((originalPrice - price) / originalPrice) * 100
        );
    }

    return Math.max(
        0,
        toNumber(item?.discountPercentage, 0)
    );
};

const OrderItemRow = memo(({ item }) => {
    const quantity = getQuantity(item);
    const price = getPrice(item);
    const originalPrice = getOriginalPrice(item);
    const subtotal = getLineTotal(item, price, quantity);

    const hasDiscount =
        originalPrice > price &&
        originalPrice > 0 &&
        price >= 0;

    const discountPercentage = getDiscountPercentage(
        item,
        originalPrice,
        price
    );

    const productName = getProductName(item);
    const variantName = getVariantName(item);
    const imageUrl = getImageUrl(item);

    return (
        <div className="flex gap-4 p-4 sm:p-5 border-b border-gray-100 last:border-b-0">
            {/* Product Image */}
            <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={productName}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                                "/images/product-placeholder.png";
                        }}
                    />
                </div>
            </div>

            {/* Product Information */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-5 line-clamp-2">
                            {productName}
                        </h3>

                        {variantName && (
                            <p className="mt-1 text-xs sm:text-sm text-gray-500">
                                Variant:{" "}
                                <span className="font-medium text-gray-700">
                                    {variantName}
                                </span>
                            </p>
                        )}

                        {/* Quantity */}
                        <div className="mt-2 inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1">
                            <span className="text-xs font-medium text-gray-600">
                                Qty: {quantity}
                            </span>
                        </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                            {formatCurrency(subtotal)}
                        </p>

                        {quantity > 1 && (
                            <p className="mt-0.5 text-xs text-gray-500">
                                {formatCurrency(price)} × {quantity}
                            </p>
                        )}
                    </div>
                </div>

                {/* Unit Price */}
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(price)}
                    </span>

                    {hasDiscount && (
                        <>
                            <span className="text-xs text-gray-400 line-through">
                                {formatCurrency(originalPrice)}
                            </span>

                            {discountPercentage > 0 && (
                                <span className="text-xs font-semibold text-emerald-600">
                                    {discountPercentage}% off
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Delivery Information */}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                    <Package size={13} />
                    <span>Delivery available</span>
                </div>
            </div>
        </div>
    );
});

OrderItemRow.displayName = "OrderItemRow";

const OrderItemsSection = ({
    items = [],
    loading = false,
    title = "Order Items",
    showHeader = true,
}) => {
    const safeItems = useMemo(() => {
        return Array.isArray(items) ? items : [];
    }, [items]);

    const totalItems = useMemo(() => {
        return safeItems.reduce(
            (total, item) =>
                total + Math.max(0, toNumber(item?.quantity, 0)),
            0
        );
    }, [safeItems]);

    if (loading) {
        return (
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {showHeader && (
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                )}

                <div className="divide-y divide-gray-100">
                    {[1, 2].map((item) => (
                        <div
                            key={item}
                            className="flex gap-4 p-4 sm:p-5"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 animate-pulse" />

                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (safeItems.length === 0) {
        return (
            <section className="bg-white rounded-2xl border border-gray-200">
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <ShoppingBag
                            size={24}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                        No items in your order
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Your cart is currently empty.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            {showHeader && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ShoppingBag
                                size={18}
                                className="text-gray-700"
                            />
                        </div>

                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                {title}
                            </h2>

                            <p className="text-xs sm:text-sm text-gray-500">
                                {totalItems}{" "}
                                {totalItems === 1 ? "item" : "items"}
                            </p>
                        </div>
                    </div>

                    <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Ready to order
                    </span>
                </div>
            )}

            {/* Items */}
            <div>
                {safeItems.map((item, index) => (
                    <OrderItemRow
                        key={
                            item?.id ??
                            item?.cartItemId ??
                            `${item?.productId}-${item?.variantId}-${index}`
                        }
                        item={item}
                    />
                ))}
            </div>
        </section>
    );
};

export default memo(OrderItemsSection);
