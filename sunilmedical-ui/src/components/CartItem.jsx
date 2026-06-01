import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
    const {
        updateCart,
        removeFromCart,
        getQty
    } = useCart();

    const productId =
        Number(item.productId);

    const variantId =
        Number(item.variantId);

    const qty =
        getQty(
            productId,
            variantId
        );

    const step =
        Number(item.stepQuantity || 1);

    const min =
        Number(item.minQuantity || 1);

    const max =
        item.maxQuantity
            ? Number(item.maxQuantity)
            : null;

    const price =
        Number(item.price || 0);

    const finalPrice =
        Number(
            item.finalPrice ||
            price
        );

    const discount =
        Number(
            item.discountPercentage || 0
        );

    const gst =
        (
            finalPrice *
            qty *
            Number(item.gstPercentage || 0)
        ) / 100;

    const subtotal =
        (finalPrice * qty) + gst;

    const increase = async () => {
        let nextQty = qty + step;

        if (
            max &&
            nextQty > max
        ) return;

        await updateCart(
            productId,
            variantId,
            nextQty
        );
    };

    const decrease = async () => {
        let nextQty =
            qty - step;

        if (nextQty < min) {
            await removeFromCart(
                productId,
                variantId
            );
            return;
        }

        await updateCart(
            productId,
            variantId,
            nextQty
        );
    };

    const handleRemove =
        async () => {
            await removeFromCart(
                productId,
                variantId
            );
        };

    return (
        <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-4 shadow-sm">

            <img
                src={
                    item.image ||
                    "/images/no-image.png"
                }
                alt={item.name}
                className="w-24 h-24 object-contain rounded-xl bg-gray-50"
            />

            <div className="flex-1">

                <h3 className="font-semibold text-base">
                    {item.name}
                </h3>

                <p className="text-sm text-gray-500">
                    {item.variantName}
                </p>

                <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-pink-600">
                        ₹{finalPrice.toFixed(2)}
                    </span>

                    {discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                            ₹{price.toFixed(2)}
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-500 mt-1">
                    GST: ₹{gst.toFixed(2)}
                </p>

                <p className="text-sm font-medium mt-1">
                    Subtotal:
                    ₹{subtotal.toFixed(2)}
                </p>

                <div className="flex items-center gap-3 mt-4">

                    <button
                        type="button"
                        onClick={decrease}
                        className="w-9 h-9 rounded-lg border"
                    >
                        −
                    </button>

                    <span className="min-w-[30px] text-center font-semibold">
                        {qty}
                    </span>

                    <button
                        type="button"
                        onClick={increase}
                        disabled={
                            max &&
                            qty + step > max
                        }
                        className="w-9 h-9 rounded-lg border"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="ml-auto text-red-500 text-sm font-medium"
                    >
                        Remove
                    </button>

                </div>

            </div>
        </div>
    );
}