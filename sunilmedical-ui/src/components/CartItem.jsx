import React, {
    memo,
    useCallback,
    useMemo
} from "react";

import { useCart } from "../context/CartContext";

const CartItem = memo(function CartItem({
    item
}) {

    const {
        updateCart,
        removeFromCart,
        getQty,
        itemUpdating,
        removingItems
    } = useCart();

    const productId =
        Number(item?.productId ?? 0);

    const variantId =
        Number(item?.variantId ?? 0);

    const key =
        `${productId}-${variantId}`;

    const qty =
        Number(
            getQty(
                productId,
                variantId
            )
        );

    const step =
        Math.max(
            1,
            Number(
                item?.stepQuantity ?? 1
            )
        );

    const min =
        Math.max(
            1,
            Number(
                item?.minQuantity ?? 1
            )
        );

    const maxValue =
        Number(item?.maxQuantity);

    const max =
        Number.isFinite(maxValue) &&
            maxValue > 0
            ? maxValue
            : null;

    const price =
        Number(item?.price ?? 0);

    const finalPriceValue =
        Number(item?.finalPrice);

    const finalPrice =
        Number.isFinite(
            finalPriceValue
        )
            ? finalPriceValue
            : price;

    const discount =
        Number(
            item?.discountPercentage ?? 0
        );

    const subtotal =
        finalPrice * qty;

    const isUpdating =
        Boolean(
            itemUpdating?.[key]
        );

    const isRemoving =
        Boolean(
            removingItems?.[key]
        );

    const canIncrease =
        !max ||
        qty + step <= max;

    const canDecrease =
        qty - step >= min;

    const increase = useCallback(
        () => {

            if (
                !productId ||
                !canIncrease ||
                isUpdating ||
                isRemoving
            ) {
                return;
            }

            updateCart(
                productId,
                variantId,
                qty + step
            );

        },
        [
            productId,
            variantId,
            qty,
            step,
            canIncrease,
            isUpdating,
            isRemoving,
            updateCart
        ]
    );

    const decrease = useCallback(
        () => {

            if (
                !productId ||
                isUpdating ||
                isRemoving
            ) {
                return;
            }

            const nextQty =
                qty - step;

            if (nextQty < min) {

                removeFromCart(
                    productId,
                    variantId
                );

                return;
            }

            updateCart(
                productId,
                variantId,
                nextQty
            );

        },
        [
            productId,
            variantId,
            qty,
            step,
            min,
            isUpdating,
            isRemoving,
            updateCart,
            removeFromCart
        ]
    );

    const handleRemove =
        useCallback(
            () => {

                if (
                    !productId ||
                    isRemoving
                ) {
                    return;
                }

                removeFromCart(
                    productId,
                    variantId
                );

            },
            [
                productId,
                variantId,
                isRemoving,
                removeFromCart
            ]
        );

    const image =
        item?.image ||
        item?.imageUrl ||
        "/images/no-image.png";

    const savings =
        useMemo(
            () =>
                Math.max(
                    0,
                    (price - finalPrice) * qty
                ),
            [
                price,
                finalPrice,
                qty
            ]
        );

    return (
        <article
            className={`
                relative
                bg-white
                border
                border-gray-200
                rounded-2xl
                p-4
                sm:p-5
                transition-all
                duration-200
                ${isRemoving
                    ? "opacity-60"
                    : "hover:border-gray-300"
                }
            `}
        >

            {/* PRODUCT */}
            <div className="flex gap-4">

                {/* IMAGE */}
                <div
                    className="
                        w-24 h-24
                        sm:w-32 sm:h-32
                        shrink-0
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-100
                        flex items-center
                        justify-center
                        overflow-hidden
                    "
                >

                    <img
                        src={image}
                        alt={
                            item?.name ||
                            "Product"
                        }
                        loading="lazy"
                        decoding="async"
                        className="
                            w-full
                            h-full
                            object-contain
                            p-2
                        "
                    />

                </div>

                {/* DETAILS */}
                <div className="min-w-0 flex-1">

                    <div className="flex justify-between gap-3">

                        <div className="min-w-0">

                            <h3
                                className="
                                    text-base
                                    sm:text-lg
                                    font-semibold
                                    text-gray-900
                                    leading-6
                                    line-clamp-2
                                "
                            >
                                {item?.name ||
                                    "Product"}
                            </h3>

                            {item?.brand && (
                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        sm:text-sm
                                        text-gray-500
                                    "
                                >
                                    {item.brand}
                                </p>
                            )}

                            {item?.variantName && (
                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-gray-500
                                    "
                                >
                                    {item.variantName}
                                </p>
                            )}

                        </div>

                        {/* PRICE */}
                        <div
                            className="
                                text-right
                                shrink-0
                            "
                        >

                            <div
                                className="
                                    text-lg
                                    sm:text-xl
                                    font-bold
                                    text-gray-900
                                    tabular-nums
                                "
                            >
                                ₹{finalPrice.toFixed(2)}
                            </div>

                            {price >
                                finalPrice && (
                                    <div
                                        className="
                                        text-xs
                                        sm:text-sm
                                        text-gray-400
                                        line-through
                                        tabular-nums
                                    "
                                    >
                                        ₹{price.toFixed(2)}
                                    </div>
                                )}

                        </div>

                    </div>

                    {/* STOCK */}
                    <div className="mt-2">

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-medium
                                text-emerald-600
                            "
                        >
                            <span
                                className="
                                    w-1.5 h-1.5
                                    rounded-full
                                    bg-emerald-500
                                "
                            />

                            In Stock
                        </span>

                    </div>

                    {/* SAVINGS */}
                    {savings > 0 && (
                        <p
                            className="
                                mt-2
                                text-xs
                                font-medium
                                text-emerald-600
                            "
                        >
                            You save ₹
                            {savings.toFixed(2)}
                        </p>
                    )}

                    {/* ACTIONS */}
                    <div
                        className="
                            mt-4
                            flex
                            flex-wrap
                            items-center
                            gap-3
                        "
                    >

                        {/* QUANTITY */}
                        <div
                            className="
                                inline-flex
                                items-center
                                border
                                border-gray-300
                                rounded-lg
                                overflow-hidden
                                bg-white
                            "
                        >

                            <button
                                type="button"
                                onClick={decrease}
                                disabled={
                                    isUpdating ||
                                    isRemoving
                                }
                                aria-label="Decrease quantity"
                                className="
                                    w-9 h-9
                                    flex
                                    items-center
                                    justify-center
                                    text-lg
                                    text-gray-700
                                    hover:bg-gray-50
                                    disabled:opacity-40
                                    transition
                                "
                            >
                                −
                            </button>

                            <div
                                className="
                                    relative
                                    w-10
                                    text-center
                                    font-semibold
                                    text-sm
                                    text-gray-900
                                "
                            >
                                {qty}

                                {isUpdating && (
                                    <span
                                        className="
                                            absolute
                                            inset-0
                                            flex
                                            items-center
                                            justify-center
                                            bg-white
                                        "
                                    >
                                        <span
                                            className="
                                                w-3.5 h-3.5
                                                border-2
                                                border-gray-300
                                                border-t-gray-800
                                                rounded-full
                                                animate-spin
                                            "
                                        />
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={increase}
                                disabled={
                                    !canIncrease ||
                                    isUpdating ||
                                    isRemoving
                                }
                                aria-label="Increase quantity"
                                className="
                                    w-9 h-9
                                    flex
                                    items-center
                                    justify-center
                                    text-lg
                                    text-gray-700
                                    hover:bg-gray-50
                                    disabled:opacity-40
                                    transition
                                "
                            >
                                +
                            </button>

                        </div>

                        <span
                            className="
                                hidden
                                sm:block
                                h-5
                                w-px
                                bg-gray-200
                            "
                        />

                        {/* REMOVE */}
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={
                                isRemoving ||
                                isUpdating
                            }
                            className="
                                text-sm
                                font-medium
                                text-gray-600
                                hover:text-red-600
                                disabled:opacity-50
                                transition
                            "
                        >
                            {isRemoving
                                ? "Removing..."
                                : "Remove"}
                        </button>

                    </div>

                    {/* LINE TOTAL */}
                    <div
                        className="
                            mt-4
                            flex
                            items-center
                            justify-between
                            border-t
                            border-gray-100
                            pt-3
                        "
                    >

                        <span
                            className="
                                text-xs
                                text-gray-500
                            "
                        >
                            {qty} × ₹
                            {finalPrice.toFixed(2)}
                        </span>

                        <span
                            className="
                                text-base
                                font-bold
                                text-gray-900
                                tabular-nums
                            "
                        >
                            ₹{subtotal.toFixed(2)}
                        </span>

                    </div>

                </div>

            </div>

        </article>
    );
});

export default CartItem;