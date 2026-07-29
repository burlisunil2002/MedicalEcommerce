import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";

export default function AddToCartButton({
    productId,
    variantId,
    minQty = 1,
    maxQty = null,
    stepQty = 1,
    setMessage
}) {
    const {
        addToCart,
        updateCart,
        removeFromCart,
        getQty
    } = useCart();

    const productKey = Number(productId);
    const variantKey = Number(variantId);

    const cartQty = getQty(
        productKey,
        variantKey
    );

    const [uiQty, setUiQty] =
        useState(cartQty);

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {
        setUiQty(cartQty);
    }, [cartQty]);

    const min =
        Number(minQty) || 1;

    const step =
        Number(stepQty) || 1;

    const max =
        maxQty != null
            ? Number(maxQty)
            : Infinity;

    const handleAdd = async (e) => {

        console.log("Button Clicked");

        console.log({
            productKey,
            variantKey,
            min,
            setMessage,
            addToCart
        });

        e.preventDefault();
        e.stopPropagation();

        if (loading) return;

        setLoading(true);

        // Update UI immediately
        setUiQty(min);

        // Show success instantly
        setMessage?.("Product added to your cart");

        setTimeout(() => {
            setMessage?.("");
        }, 2000);

        try {
            console.log("Calling addToCart...");

            const success = await addToCart(
                productKey,
                variantKey,
                min
            );

            console.log("Returned from addToCart", success);

            if (!success) {
                setUiQty(cartQty);
                setMessage?.("Unable to add product");
            }
        }
        catch {
            setUiQty(cartQty);
            setMessage?.("Something went wrong");
        }
        finally {
            setLoading(false);
        }
    };

    const increase = async e => {
        e.preventDefault();
        e.stopPropagation();

        const nextQty =
            uiQty + step;

        if (nextQty > max) return;

        setUiQty(nextQty);

        await updateCart(
            productKey,
            variantKey,
            nextQty
        );
    };

    const decrease = async e => {
        e.preventDefault();
        e.stopPropagation();

        const nextQty =
            uiQty - step;

        if (nextQty < min) {
            setUiQty(0);

            await removeFromCart(
                productKey,
                variantKey
            );

            return;
        }

        setUiQty(nextQty);

        await updateCart(
            productKey,
            variantKey,
            nextQty
        );
    };

    return (

        <>

        <div className="w-full">
            {uiQty <= 0 ? (
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-red-500 hover:shadow-md transition-all"
                >
                    {loading
                        ? "Adding..."
                        : "🛒 Add To Cart"}
                </button>
            ) : (
                <div className="flex items-center justify-between h-12 rounded-xl border bg-white overflow-hidden">

                    <button
                        type="button"
                        onClick={decrease}
                        className="w-12 h-full text-lg"
                    >
                        −
                    </button>

                    <span className="flex-1 text-center font-semibold">
                        {uiQty}
                    </span>

                    <button
                        type="button"
                        onClick={increase}
                        disabled={uiQty >= max}
                        className="w-12 h-full text-lg disabled:opacity-40"
                    >
                        +
                    </button>

                </div>
            )}
    </div>

    </>
    );
}