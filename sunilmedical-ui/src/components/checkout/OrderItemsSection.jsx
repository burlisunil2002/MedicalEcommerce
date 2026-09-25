
import React, { memo, useMemo } from "react";
import {
    Package,
    ShoppingBag,
    Tag,
} from "lucide-react";

/*
 * OrderItemsSection
 *
 * Mobile-first checkout order item layout.
 *
 * Price hierarchy:
 *
 * Product Name
 * Variant
 * ₹ Unit Price × Quantity
 * Item total ₹ Total
 *
 * This avoids showing the same amount twice without context.
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

    return Number.isFinite(number)
        ? number
        : fallback;
};


/* =========================================================
   PRODUCT IMAGE
========================================================= */

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


/* =========================================================
   PRODUCT NAME
========================================================= */

const getProductName = (item) => {
    return (
        item?.productName ||
        item?.name ||
        item?.product?.name ||
        "Product"
    );
};


/* =========================================================
   VARIANT
========================================================= */

const getVariantName = (item) => {
    return (
        item?.variantName ||
        item?.variant ||
        item?.productVariantName ||
        item?.product?.variantName ||
        ""
    );
};


/* =========================================================
   SELLING PRICE
========================================================= */

const getPrice = (item) => {
    /*
     * productFinalPrice is the checkout selling price.
     */

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

    return Math.max(
        0,
        toNumber(value)
    );
};


/* =========================================================
   ORIGINAL PRICE
========================================================= */

const getOriginalPrice = (item) => {
    const value =
        item?.productPrice ??
        item?.originalPrice ??
        item?.mrp ??
        item?.product?.mrp ??
        item?.product?.price ??
        item?.price ??
        0;

    return Math.max(
        0,
        toNumber(value)
    );
};


/* =========================================================
   QUANTITY
========================================================= */

const getQuantity = (item) => {
    return Math.max(
        1,
        Math.floor(
            toNumber(
                item?.quantity,
                1
            )
        )
    );
};


/* =========================================================
   LINE TOTAL
========================================================= */

const getLineTotal = (
    item,
    price,
    quantity
) => {
    /*
     * Prefer backend calculated total.
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
        const total = toNumber(
            backendLineTotal,
            NaN
        );

        if (Number.isFinite(total)) {
            return Math.max(
                0,
                total
            );
        }
    }

    return Math.max(
        0,
        price * quantity
    );
};


/* =========================================================
   DISCOUNT
========================================================= */

const getDiscountPercentage = (
    item,
    originalPrice,
    price
) => {
    if (
        originalPrice > price &&
        originalPrice > 0
    ) {
        return Math.round(
            (
                (originalPrice - price) /
                originalPrice
            ) * 100
        );
    }

    return Math.max(
        0,
        toNumber(
            item?.discountPercentage,
            0
        )
    );
};


/* =========================================================
   ORDER ITEM
========================================================= */

const OrderItemRow = memo(
    ({ item }) => {
        const quantity =
            getQuantity(item);

        const price =
            getPrice(item);

        const originalPrice =
            getOriginalPrice(item);

        const subtotal =
            getLineTotal(
                item,
                price,
                quantity
            );

        const productName =
            getProductName(item);

        const variantName =
            getVariantName(item);

        const imageUrl =
            getImageUrl(item);

        const discountPercentage =
            getDiscountPercentage(
                item,
                originalPrice,
                price
            );

        const hasDiscount =
            originalPrice > price &&
            originalPrice > 0;

        return (
            <article
                className="
                    border-b
                    border-slate-100
                    last:border-b-0
                    bg-white
                "
            >
                <div
                    className="
                        flex
                        gap-3
                        p-3
                        sm:gap-4
                        sm:p-5
                    "
                >

                    {/* =================================================
                        PRODUCT IMAGE
                    ================================================= */}

                    <div className="shrink-0">
                        <div
                            className="
                                flex
                                h-[76px]
                                w-[76px]
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50

                                sm:h-24
                                sm:w-24
                            "
                        >
                            <img
                                src={imageUrl}
                                alt={productName}
                                className="
                                    h-full
                                    w-full
                                    object-contain
                                    p-2
                                "
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.onerror =
                                        null;

                                    e.currentTarget.src =
                                        "/images/product-placeholder.png";
                                }}
                            />
                        </div>
                    </div>


                    {/* =================================================
                        PRODUCT CONTENT
                    ================================================= */}

                    <div
                        className="
                            min-w-0
                            flex-1
                        "
                    >

                        {/* =============================================
                            PRODUCT NAME + TOTAL
                        ============================================== */}

                        <div
                            className="
                                flex
                                items-start
                                justify-between
                                gap-2
                            "
                        >

                            {/* PRODUCT NAME */}

                            <div className="min-w-0 flex-1">

                                <h3
                                    className="
                                        line-clamp-2
                                        text-sm
                                        font-bold
                                        leading-5
                                        text-slate-900

                                        sm:text-base
                                        sm:leading-6
                                    "
                                >
                                    {productName}
                                </h3>

                                {/* VARIANT */}

                                {variantName && (
                                    <p
                                        className="
                                            mt-1
                                            line-clamp-1
                                            text-xs
                                            text-slate-500

                                            sm:text-sm
                                        "
                                    >
                                        {variantName}
                                    </p>
                                )}

                            </div>


                            {/* =========================================
                                ITEM TOTAL — DESKTOP / TABLET
                            ========================================== */}

                            <div
                                className="
                                    hidden
                                    shrink-0
                                    text-right
                                    sm:block
                                "
                            >
                                <span
                                    className="
                                        text-base
                                        font-bold
                                        text-slate-950
                                    "
                                >
                                    {formatCurrency(
                                        subtotal
                                    )}
                                </span>
                            </div>

                        </div>


                        {/* =================================================
                            PRICE ROW
                        ================================================= */}

                        <div
                            className="
                                mt-2
                                flex
                                flex-wrap
                                items-center
                                gap-x-2
                                gap-y-1
                            "
                        >

                            {/* UNIT PRICE */}

                            <span
                                className="
                                    text-base
                                    font-bold
                                    text-slate-950

                                    sm:text-lg
                                "
                            >
                                {formatCurrency(
                                    price
                                )}
                            </span>


                            {/* MULTIPLICATION */}

                            <span
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-500

                                    sm:text-base
                                "
                            >
                                × {quantity}
                            </span>


                            {/* ORIGINAL PRICE */}

                            {hasDiscount && (
                                <span
                                    className="
                                        text-xs
                                        text-slate-400
                                        line-through

                                        sm:text-sm
                                    "
                                >
                                    {formatCurrency(
                                        originalPrice
                                    )}
                                </span>
                            )}


                            {/* DISCOUNT */}

                            {discountPercentage > 0 && (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1
                                        rounded-full
                                        bg-emerald-50
                                        px-2
                                        py-0.5
                                        text-[10px]
                                        font-bold
                                        text-emerald-700

                                        sm:text-xs
                                    "
                                >
                                    <Tag size={11} />

                                    {discountPercentage}% OFF
                                </span>
                            )}

                        </div>


                        {/* =================================================
                            MOBILE ITEM TOTAL
                        ================================================= */}

                        <div
                            className="
                                mt-2
                                flex
                                items-center
                                justify-between
                                rounded-lg
                                bg-slate-50
                                px-3
                                py-2

                                sm:hidden
                            "
                        >
                            <span
                                className="
                                    text-xs
                                    font-medium
                                    text-slate-500
                                "
                            >
                                Item total
                            </span>

                            <span
                                className="
                                    text-sm
                                    font-bold
                                    text-slate-950
                                "
                            >
                                {formatCurrency(
                                    subtotal
                                )}
                            </span>
                        </div>


                        {/* =================================================
                            QUANTITY + DELIVERY
                        ================================================= */}

                        <div
                            className="
                                mt-2.5
                                flex
                                flex-wrap
                                items-center
                                gap-2
                            "
                        >

                            {/* QUANTITY */}

                            <span
                                className="
                                    inline-flex
                                    items-center
                                    rounded-md
                                    bg-slate-100
                                    px-2.5
                                    py-1
                                    text-[11px]
                                    font-semibold
                                    text-slate-600

                                    sm:text-xs
                                "
                            >
                                Qty: {quantity}
                            </span>


                            {/* DELIVERY */}

                            <span
                                className="
                                    inline-flex
                                    items-center
                                    gap-1
                                    text-[11px]
                                    font-medium
                                    text-emerald-600

                                    sm:text-xs
                                "
                            >
                                <Package
                                    size={13}
                                />

                                Delivery available
                            </span>

                        </div>

                    </div>
                </div>
            </article>
        );
    }
);

OrderItemRow.displayName =
    "OrderItemRow";


/* =========================================================
   MAIN ORDER ITEMS SECTION
========================================================= */

const OrderItemsSection = ({
    items = [],
    loading = false,
    title = "Order Items",
    showHeader = true,
}) => {

    const safeItems = useMemo(
        () =>
            Array.isArray(items)
                ? items
                : [],
        [items]
    );


    const totalItems = useMemo(
        () =>
            safeItems.reduce(
                (total, item) =>
                    total +
                    Math.max(
                        0,
                        toNumber(
                            item?.quantity,
                            0
                        )
                    ),
                0
            ),
        [safeItems]
    );


    /* =====================================================
       LOADING
    ====================================================== */

    if (loading) {
        return (
            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                "
            >
                {showHeader && (
                    <div
                        className="
                            border-b
                            border-slate-100
                            px-4
                            py-4
                            sm:px-5
                        "
                    >
                        <div
                            className="
                                h-5
                                w-32
                                animate-pulse
                                rounded
                                bg-slate-200
                            "
                        />
                    </div>
                )}

                <div>
                    {[1, 2].map(
                        (item) => (
                            <div
                                key={item}
                                className="
                                    flex
                                    gap-3
                                    border-b
                                    border-slate-100
                                    p-3

                                    sm:gap-4
                                    sm:p-5
                                "
                            >
                                <div
                                    className="
                                        h-[76px]
                                        w-[76px]
                                        shrink-0
                                        animate-pulse
                                        rounded-xl
                                        bg-slate-100

                                        sm:h-24
                                        sm:w-24
                                    "
                                />

                                <div
                                    className="
                                        flex-1
                                        space-y-3
                                    "
                                >
                                    <div
                                        className="
                                            h-4
                                            w-3/4
                                            animate-pulse
                                            rounded
                                            bg-slate-200
                                        "
                                    />

                                    <div
                                        className="
                                            h-4
                                            w-1/2
                                            animate-pulse
                                            rounded
                                            bg-slate-100
                                        "
                                    />

                                    <div
                                        className="
                                            h-4
                                            w-1/3
                                            animate-pulse
                                            rounded
                                            bg-slate-100
                                        "
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </section>
        );
    }


    /* =====================================================
       EMPTY
    ====================================================== */

    if (safeItems.length === 0) {
        return (
            <section
                className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                "
            >
                <div
                    className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                    "
                >
                    <div
                        className="
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                        "
                    >
                        <ShoppingBag
                            size={24}
                            className="text-slate-400"
                        />
                    </div>

                    <h3
                        className="
                            mt-4
                            text-base
                            font-semibold
                            text-slate-900
                        "
                    >
                        No items in your order
                    </h3>

                    <p
                        className="
                            mt-1
                            text-sm
                            text-slate-500
                        "
                    >
                        Your cart is currently empty.
                    </p>
                </div>
            </section>
        );
    }


    /* =====================================================
       MAIN
    ====================================================== */

    return (
        <section
            className="
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
            "
        >

            {/* =================================================
                HEADER
            ================================================= */}

            {showHeader && (
                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-slate-100
                        px-3
                        py-3.5

                        sm:px-5
                        sm:py-4
                    "
                >

                    <div
                        className="
                            flex
                            min-w-0
                            items-center
                            gap-2.5
                        "
                    >

                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                            "
                        >
                            <ShoppingBag
                                size={18}
                                className="text-slate-700"
                            />
                        </div>

                        <div className="min-w-0">

                            <h2
                                className="
                                    text-sm
                                    font-bold
                                    text-slate-900

                                    sm:text-lg
                                "
                            >
                                {title}
                            </h2>

                            <p
                                className="
                                    text-[11px]
                                    text-slate-500

                                    sm:text-sm
                                "
                            >
                                {totalItems}{" "}
                                {totalItems === 1
                                    ? "item"
                                    : "items"}
                            </p>

                        </div>

                    </div>


                    <span
                        className="
                            hidden
                            shrink-0
                            rounded-full
                            bg-emerald-50
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-emerald-700

                            sm:inline-flex
                        "
                    >
                        Ready to order
                    </span>

                </div>
            )}


            {/* =================================================
                ITEMS
            ================================================= */}

            <div>
                {safeItems.map(
                    (item, index) => (
                        <OrderItemRow
                            key={
                                item?.id ??
                                item?.cartItemId ??
                                `${ item?.productId } -${ item?.variantId } -${ index } `
                            }
                            item={item}
                        />
                    )
                )}
            </div>

        </section>
    );
};

export default memo(
    OrderItemsSection
);
