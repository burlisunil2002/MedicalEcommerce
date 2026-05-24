import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {

    const { updateCart, removeFromCart, getQty } = useCart();
    const qty = getQty(item.variantId);

    // ✅ get rules from item (coming from backend)
    const step = Number(item.stepQuantity) || 1;
    const min = Number(item.minQuantity) || 1;
    const max = item.maxQuantity ?? null;

    const final = item.finalPrice || item.price;
    const subtotal = final * qty;
    const gst = subtotal * item.gstPercentage / 100;

    // 🔥 INCREASE
    const increase = () => {
        let nextQty;

        if (qty < min) {
            nextQty = min;
        } else {
            nextQty = qty + step;
        }

        if (max && nextQty > max) return;

        updateCart(item.variantId, nextQty);
    };

    // 🔥 DECREASE
    const decrease = () => {
        let nextQty = qty - step;

        if (nextQty < min) {
            removeFromCart(item.variantId);
            return;
        }

        updateCart(item.variantId, nextQty);
    };

    return (
        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow hover:shadow-xl transition-all duration-300">

            <img
                src={item.image}
                className="w-28 h-28 object-contain bg-gray-50 rounded-xl"
            />

            <div className="flex flex-col flex-grow">

                <h3 className="font-semibold text-lg">{item.name}</h3>

                <p className="text-sm text-gray-500">{item.variantName}</p>

                <div className="text-pink-600 font-bold text-lg">
                    ₹{final}
                </div>

                <div className="text-xs text-gray-500">
                    GST ({item.gstPercentage}%): ₹{gst.toFixed(2)}
                </div>

                <div className="text-sm text-gray-600">
                    Subtotal: ₹{subtotal.toFixed(2)}
                </div>

                {/* QTY */}
                <div className="flex items-center gap-3 mt-3">

                    <button
                        onClick={decrease}
                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-red-200"
                    >
                        −
                    </button>

                    <span className="font-semibold">{qty}</span>

                    <button
                        onClick={increase}
                        disabled={max && qty + step > max}
                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-green-200 disabled:opacity-40"
                    >
                        +
                    </button>

                </div>

            </div>

            <button
                onClick={() => removeFromCart(item.variantId)}
                className="text-red-500 text-xl"
            >
                ✕
            </button>

        </div>
    );
}