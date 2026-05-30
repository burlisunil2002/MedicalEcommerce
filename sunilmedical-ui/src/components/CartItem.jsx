import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
    const {
        updateCart,
        removeFromCart,
        getQty
    } = useCart();

    const qty =
        getQty(item.variantId);

    const step =
        Number(item.stepQuantity) || 1;

    const min =
        Number(item.minQuantity) || 1;

    const max =
        item.maxQuantity ?? null;

    const price =
        Number(item.price || 0);

    const finalPrice =
        Number(
            item.finalPrice ||
            item.price ||
            0
        );

    const discount =
        Number(
            item.discountPercentage ||
            0
        );

    const gst =
        (finalPrice * qty) *
        (
            Number(item.gstPercentage || 0) /
            100
        );

    const subtotal =
        ((finalPrice * qty) + gst);

    const increase = () => {
        let nextQty =
            qty < min
                ? min
                : qty + step;

        if (
            max &&
            nextQty > max
        )
            return;

        updateCart(
            item.variantId,
            nextQty
        );
    };

    const decrease = () => {
        let nextQty =
            qty - step;

        if (nextQty < min) {
            removeFromCart(
                item.variantId
            );
            return;
        }

        updateCart(
            item.variantId,
            nextQty
        );
    };

    return (
        <div
            className="
                flex
                flex-col
                sm:flex-row
                gap-4
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                hover:shadow-md
                transition
            "
        >
            <img
                src={
                    item.image ||
                    "/images/no-image.png"
                }
                alt={item.name}
                loading="lazy"
                className="
                    w-24
                    h-24
                    sm:w-28
                    sm:h-28
                    object-contain
                    rounded-xl
                    bg-gray-50
                "
            />

            <div className="flex-1">

                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {item.name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                    {item.variantName}
                </p>

                <div className="mt-3 flex items-center gap-3 flex-wrap">

                    <span className="text-lg font-bold text-pink-600">
                        ₹
                        {finalPrice.toFixed(2)}
                    </span>

                    {discount > 0 && (
                        <>
                            <span className="text-sm text-gray-400 line-through">
                                ₹
                                {price.toFixed(2)}
                            </span>

                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {discount}% OFF
                            </span>
                        </>
                    )}

                </div>

                <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                        GST ({item.gstPercentage}%):
                        ₹{gst.toFixed(2)}
                    </p>

                    <p className="font-medium text-gray-800">
                        Subtotal:
                        ₹{subtotal.toFixed(2)}
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-4">

                    <button
                        onClick={decrease}
                        className="
                            w-9
                            h-9
                            rounded-lg
                            border
                            hover:bg-red-50
                        "
                    >
                        −
                    </button>

                    <span className="min-w-[32px] text-center font-semibold">
                        {qty}
                    </span>

                    <button
                        onClick={increase}
                        disabled={
                            max &&
                            qty + step > max
                        }
                        className="
                            w-9
                            h-9
                            rounded-lg
                            border
                            hover:bg-green-50
                            disabled:opacity-40
                        "
                    >
                        +
                    </button>

                    <button
                        onClick={() =>
                            removeFromCart(
                                item.variantId
                            )
                        }
                        className="
                            ml-auto
                            text-red-500
                            text-sm
                            font-medium
                        "
                    >
                        Remove
                    </button>

                </div>

            </div>
        </div>
    );
}
