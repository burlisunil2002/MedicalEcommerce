import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {

    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({});
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // 🔥 INITIAL LOAD
    useEffect(() => {
        loadCart();
    }, []);

    // 🔥 CART COUNT SYNC
    useEffect(() => {
        const count = items.reduce((a, b) => a + (b.quantity || 0), 0);
        setCartCount(count);
    }, [items]);

    // 🔥 LOAD FULL CART
    const loadCart = async () => {
        try {
            setLoading(true);

            const res = await API.get("/api/cart/full");

setItems(
  (res?.data?.items || []).map(i => ({
    ...i,

    variantId:
      i.variantId ?? i.VariantId,

    price:
      Number(i.price ?? 0),

    finalPrice:
      Number(i.finalPrice ?? 0),

    discountPercentage:
      Number(i.discountPercentage ?? 0),

    quantity:
      Number(i.quantity ?? 1),

    gstPercentage:
      Number(i.gstPercentage ?? 0),

    stepQuantity:
      Number(i.stepQuantity ?? 1),

    minQuantity:
      Number(i.minQuantity ?? 1),

    maxQuantity:
      i.maxQuantity
  }))
);

            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Cart load error:", e);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 ADD TO CART (FULL REFRESH REQUIRED)
const addToCart = async (
    productId,
    variantId,
    quantity = 1
) => {
    const existing =
        items.find(
            x =>
                x.variantId ===
                variantId
        );

    // Instant UI update
    if (existing) {
        setItems(prev =>
            prev.map(i =>
                i.variantId === variantId
                    ? {
                          ...i,
                          quantity:
                              i.quantity +
                              quantity
                      }
                    : i
            )
        );
    } else {
        setItems(prev => [
            ...prev,
            {
                productId,
                variantId,
                quantity
            }
        ]);
    }

    try {
        await API.post(
            "/api/cart/add",
            {
                productId,
                variantId,
                quantity
            }
        );

        await loadCart();
    }
    catch (err) {
        console.error(
            "Add cart error",
            err
        );

        loadCart();
    }
};


    // 🔥 UPDATE QUANTITY (OPTIMISTIC + SUMMARY REFRESH)
    const updateCart = async (variantId, qty) => {

        // optimistic update
        setItems(prev =>
            prev.map(i =>
                i.variantId === variantId
                    ? { ...i, quantity: qty }
                    : i
            )
        );

        try {
            await API.post("/api/cart/update", {
                VariantId: variantId,
                Quantity: qty
            });

            // only refresh summary (fast, no flicker)
            const res = await API.get("/api/cart/full");
            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Update failed:", e);
            await loadCart(); // rollback
        }
    };

    // 🔥 REMOVE ITEM
    const removeFromCart = async (variantId) => {

        // optimistic remove
        setItems(prev => prev.filter(i => i.variantId !== variantId));

        try {
            await API.post("/api/cart/remove", {
                VariantId: variantId
            });

            const res = await API.get("/api/cart/full");
            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Remove failed:", e);
            await loadCart();
        }
    };

    // 🔥 APPLY COUPON
const applyCoupon = async (code) => {
    try {
        const res = await API.post(
            "/api/cart/apply-coupon",
            { code }
        );

        // refresh cart summary immediately
        const fullCart =
            await API.get(
                "/api/cart/full"
            );

setItems(
  (fullCart.data.items || []).map(i => ({
    ...i,
    variantId: i.variantId ?? i.VariantId
  }))
);


        setSummary(
            fullCart.data.summary || {}
        );

        // IMPORTANT
        return res.data;

    } catch (err) {
        console.error(
            "Coupon error:",
            err
        );

        return {
            success: false,
            message:
                "Invalid coupon code"
        };
    }
};



    const getQty = (variantId) => {
        if (!items || items.length === 0) return 0;

        const item = items.find(i => i.variantId === variantId);
        return item ? item.quantity : 0;
    };

    return (
        <CartContext.Provider value={{
            items,
            summary,
            cartCount,        // ✅ FIXED
            addToCart,        // ✅ FIXED
            updateCart,
            removeFromCart,
            applyCoupon,
            getQty,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};