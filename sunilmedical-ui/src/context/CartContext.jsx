import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {

    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({});
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

   

    // 🔥 LOAD FULL CART
    const loadCart = async () => {

    const res = await API.get("/api/cart/full");

    setItems(res.data.items || []);

    setSummary(res.data.summary || {});
};

    const refreshSummaryOnly = async () => {
        try {
            const res =
                await API.get(
                    "/api/cart/summary"
                );

            setSummary(
                res?.data || {}
            );
        }
        catch (err) {
            console.error(
                "Summary refresh error",
                err
            );
        }
    };

    const addToCart = async (
        productId,
        variantId,
        quantity = 1
    ) => {

        try {

            await API.post("/api/cart/add", {

                productId,

                variantId,

                quantity

            });

            await loadCart();

            window.dispatchEvent(
                new Event("cartUpdated")
            );

            return true;

        }
        catch (err) {

            console.error(err);

            return false;

        }

    };

    // 🔥 UPDATE QUANTITY (OPTIMISTIC + SUMMARY REFRESH)
    const updateCart = async (
        productId,
        variantId,
        quantity
    ) => {
        // instant UI update
        setItems(prev =>
            prev.map(item =>
                Number(item.productId) === Number(productId) &&
                    Number(item.variantId) === Number(variantId)
                    ? {
                        ...item,
                        quantity
                    }
                    : item
            )
        );

        try {
            await API.put("/api/cart/update", {
                productId,
                variantId,
                quantity
            });

            await refreshSummaryOnly();
        }
        catch (err) {
            console.error(err);
            loadCart();
        }
    };

    // 🔥 REMOVE ITEM
    const removeFromCart = async (
        productId,
        variantId
    ) => {
        setItems(prev =>
            prev.filter(
                x =>
                    !(
                        Number(x.productId) === Number(productId) &&
                        Number(x.variantId) === Number(variantId)
                    )
            )
        );

        try {
            await API.delete(`/api/cart/remove/${variantId}`), {
                data: {
                    productId,
                    variantId
                }
            };

            await refreshSummaryOnly();
        }
        catch {
            loadCart();
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


    const getQty = (
        productId,
        variantId
    ) => {
        const item = items.find(
            x =>
                Number(x.productId) === Number(productId) &&
                Number(x.variantId) === Number(variantId)
        );

        return item?.quantity || 0;
    };

    useEffect(() => {

        loadCart();

        const handleCartUpdated = () => {
            loadCart();
        };

        window.addEventListener("cartUpdated", handleCartUpdated);

        return () => {
            window.removeEventListener("cartUpdated", handleCartUpdated);
        };

    }, []);

    // 🔥 CART COUNT SYNC
    useEffect(() => {
        const count = items.reduce((a, b) => a + (b.quantity || 0), 0);
        setCartCount(count);
    }, [items]);

    useEffect(() => {
        console.log("ITEMS CHANGED", items);
    }, [items]);

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
            loadCart,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );

};