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

                    productId: Number(
                        i.productId ?? i.ProductId ?? 0
                    ),

                    variantId: Number(
                        i.variantId ??
                        i.productVariantId ??
                        i.ProductVariantId ??
                        0
                    ),

                    quantity: Number(i.quantity ?? 1),

                    price: Number(i.price ?? 0),

                    finalPrice: Number(
                        i.finalPrice ?? i.price ?? 0
                    ),

                    discountPercentage: Number(
                        i.discountPercentage ?? 0
                    ),

                    gstPercentage: Number(
                        i.gstPercentage ?? 0
                    ),

                    stepQuantity: Number(
                        i.stepQuantity ?? 1
                    ),

                    minQuantity: Number(
                        i.minQuantity ?? 1
                    ),

                    maxQuantity: i.maxQuantity ?? null
                }))
            );

            setSummary(res?.data?.summary || {});

        } catch (e) {
            console.error("Cart load error:", e);
        } finally {
            setLoading(false);
        }
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

    // 🔥 ADD TO CART (FULL REFRESH REQUIRED)
    const addToCart = async (
        productId,
        variantId,
        quantity = 1
    ) => {
        const productKey = Number(productId);
        const variantKey = Number(variantId);
        const qtyToAdd = Number(quantity) || 1;

        setItems(prev => {
            const existing = prev.find(
                x =>
                    Number(x.productId) === productKey &&
                    Number(x.variantId) === variantKey
            );

            if (existing) {
                return prev.map(x =>
                    Number(x.productId) === productKey &&
                        Number(x.variantId) === variantKey
                        ? {
                            ...x,
                            quantity:
                                Number(x.quantity || 0) + qtyToAdd
                        }
                        : x
                );
            }

            return [
                ...prev,
                {
                    productId: productKey,
                    variantId: variantKey,
                    quantity: qtyToAdd
                }
            ];
        });

        refreshSummaryOnly(qtyToAdd);

        try {
            await API.post("/api/cart/add", {
                productId: productKey,
                variantId: variantKey,
                quantity: qtyToAdd
            });

            loadCart();
            return true;
        } catch (err) {
            loadCart();
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