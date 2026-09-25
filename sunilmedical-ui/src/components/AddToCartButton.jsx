import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function AddToCartButton({
    productId,
    variantId,
    minQty = 1,
    maxQty = null,
    stockQty = null,
    stepQty = 1,
    setMessage,
}) {
    const { addToCart, updateCart, removeFromCart, getQty } = useCart();

    const productKey = Number(productId);
    const variantKey = Number(variantId);
    const cartQty = Number(getQty?.(productKey, variantKey) || 0);

    const min = Math.max(1, Number(minQty) || 1);
    const step = Math.max(1, Number(stepQty) || 1);

    const configuredMax =
        maxQty != null && Number(maxQty) > 0 ? Number(maxQty) : null;
    const stock =
        stockQty != null && stockQty !== "" && Number(stockQty) >= 0
            ? Number(stockQty)
            : null;

    const effectiveMax =
        configuredMax !== null && stock !== null
            ? Math.min(configuredMax, stock)
            : configuredMax ?? stock;

    const [uiQty, setUiQty] = useState(cartQty);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!busy) setUiQty(cartQty);
    }, [cartQty, busy]);

    const canIncrease =
        effectiveMax === null || uiQty + step <= effectiveMax;

    const handleAdd = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (busy) return;

        if (effectiveMax !== null && min > effectiveMax) {
            setMessage?.(`Maximum available quantity is ${effectiveMax}.`);
            return;
        }

        setBusy(true);
        const previous = uiQty;
        setUiQty(min);

        try {
            const result = await addToCart(productKey, variantKey, min);
            if (result === false) {
                setUiQty(previous);
                setMessage?.("Unable to add product to cart.");
                return;
            }
            setMessage?.("Product added to your cart.");
        } catch {
            setUiQty(previous);
            setMessage?.("Unable to add product to cart.");
        } finally {
            setBusy(false);
        }
    };

    const increase = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (busy || !canIncrease) {
            if (!canIncrease) {
                setMessage?.(`Maximum available quantity is ${effectiveMax}.`);
            }
            return;
        }

        const previous = uiQty;
        const nextQty = uiQty + step;

        setUiQty(nextQty);
        setBusy(true);

        try {
            const result = await updateCart(productKey, variantKey, nextQty);
            if (result === false) {
                setUiQty(previous);
                setMessage?.("Unable to update quantity.");
            }
        } catch {
            setUiQty(previous);
            setMessage?.("Unable to update quantity.");
        } finally {
            setBusy(false);
        }
    };

    const decrease = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (busy) return;

        const nextQty = uiQty - step;

        if (nextQty < min) {
            setBusy(true);
            setUiQty(0);

            try {
                const result = await removeFromCart(productKey, variantKey);
                if (result === false) {
                    setUiQty(cartQty);
                    setMessage?.("Unable to remove product from cart.");
                }
            } catch {
                setUiQty(cartQty);
                setMessage?.("Unable to remove product from cart.");
            } finally {
                setBusy(false);
            }
            return;
        }

        const previous = uiQty;
        setUiQty(nextQty);
        setBusy(true);

        try {
            const result = await updateCart(productKey, variantKey, nextQty);
            if (result === false) {
                setUiQty(previous);
                setMessage?.("Unable to update quantity.");
            }
        } catch {
            setUiQty(previous);
            setMessage?.("Unable to update quantity.");
        } finally {
            setBusy(false);
        }
    };

    if (uiQty <= 0) {
        return (
            <button
                type="button"
                onClick={handleAdd}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
            >
                <ShoppingCart size={17} />
                {busy ? "Adding..." : "Add to Cart"}
            </button>
        );
    }

    return (
        <div className="flex h-11 w-full overflow-hidden rounded-xl border border-slate-300 bg-white sm:h-12">
            <button
                type="button"
                onClick={decrease}
                disabled={busy}
                className="flex w-11 shrink-0 items-center justify-center border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Decrease quantity"
            >
                <Minus size={17} />
            </button>

            <span className="flex min-w-0 flex-1 items-center justify-center text-sm font-extrabold text-slate-900">
                {uiQty}
            </span>

            <button
                type="button"
                onClick={increase}
                disabled={busy || !canIncrease}
                className="flex w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Increase quantity"
            >
                <Plus size={17} />
            </button>
        </div>
    );
}
