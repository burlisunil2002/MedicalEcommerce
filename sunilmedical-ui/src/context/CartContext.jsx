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

            setItems((res?.data?.items || []).map(i => ({
                ...i,
                variantId: i.variantId ?? i.VariantId,
                stepQuantity: Number(i.stepQuantity) || 1,
                minQuantity: Number(i.minQuantity) || 1,
                maxQuantity: i.maxQuantity
            })));
            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Cart load error:", e);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 ADD TO CART (FULL REFRESH REQUIRED)
    const addToCart = async (productId, variantId, qty) => {
        try {
            await API.post("/api/cart/add", {
                ProductId: productId,
                VariantId: variantId,
                Quantity: qty
            });

            await loadCart(); // 🔥 ensures qty updates immediately

        } catch (e) {
            console.error("Add failed", e);
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
            await API.post("/api/cart/apply-coupon", { code });

            const res = await API.get("/api/cart/full");
            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Coupon failed:", e);
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