import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function AddToCartButton({
    productId,
    variantId,
    minQty = 1,
    maxQty = null,
    stepQty = 1
}) {
    const { addToCart, updateCart, removeFromCart, getQty, items } = useCart();

    const qty = getQty(variantId);
    const [loading, setLoading] = useState(false);

    // ✅ get item from cart (VERY IMPORTANT)
    const item = items.find(i => i.variantId === variantId);

    // ✅ FINAL VALUES (priority: cart → props → default)
    const step = Number(item?.stepQuantity ?? stepQty) || 1;
    const min = Number(item?.minQuantity ?? minQty) || 1;
    const max = item?.maxQuantity ?? maxQty ?? null;

    const effectiveMax = max ?? Infinity;

    // ✅ INITIAL QTY
    const getInitialQty = () => {
        return min > 1 ? min : 1;
    };

    // 🔥 ADD TO CART
const handleAdd = async () => {
    if (loading) return;

    setLoading(true);

    try {
        await addToCart(
            productId,
            variantId,
            getInitialQty()
        );
    } catch (err) {
        console.error(
            "Add to cart failed:",
            err
        );
    } finally {
        setLoading(false);
    }
};


    // 🔥 INCREASE (STEP BASED)
    const increase = () => {
        let nextQty;

        if (qty < min) {
            nextQty = min;
        } else {
            nextQty = qty + step;
        }

        if (nextQty > effectiveMax) return;

        updateCart(variantId, nextQty);
    };

    // 🔥 DECREASE (STEP BASED)
    const decrease = () => {
        let nextQty = qty - step;

        if (nextQty < min) {
            removeFromCart(variantId);
            return;
        }

        updateCart(variantId, nextQty);
    };

    return (
        <div className="w-full max-w-sm">

            {qty === 0 ? (
                <button
                    onClick={handleAdd}
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold text-white 
                    bg-gradient-to-r from-pink-500 to-red-500
                    shadow-md hover:shadow-lg hover:scale-[1.02]
                    active:scale-[0.98] transition-all duration-200
                    disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? "Adding..." : "🛒 Add to Cart"}
                </button>
            ) : (
                <div className="flex items-center justify-between h-12 rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">

                    {/* ➖ */}
                    <button
                        onClick={decrease}
                        className="w-12 h-full flex items-center justify-center text-lg hover:bg-gray-100"
                    >
                        −
                    </button>

                    {/* QTY */}
                    <span className="flex-1 text-center font-semibold text-gray-800">
                        {qty}
                    </span>

                    {/* ➕ */}
                    <button
                        onClick={increase}
                        disabled={qty + step > effectiveMax}
                        className="w-12 h-full flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-40"
                    >
                        +
                    </button>

                </div>
            )}
        </div>
    );
}