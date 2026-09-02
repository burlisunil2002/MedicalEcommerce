import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react";

import API from "../services/api";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {

    // ==========================
    // STATE
    // ==========================

    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({});
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // ==========================
    // HELPERS
    // ==========================

    const syncCartResponse = useCallback((data) => {

        if (!data) return;

        if (typeof data.cartCount === "number")
            setCartCount(data.cartCount);

        if (data.summary)
            setSummary(data.summary);

    }, []);

    const resetCart = useCallback(() => {

        setItems([]);
        setSummary({});
        setCartCount(0);

    }, []);

    // ==========================
    // LOAD CART
    // ==========================
    const loadCart = useCallback(async () => {

        try {

            setLoading(true);

            const res = await API.get("/api/cart/full");

            setItems(res.data.items || []);

            syncCartResponse(res.data);

        } catch (err) {

            console.error("Load Cart Error:", err);

            resetCart();

        } finally {

            setLoading(false);

        }

    }, [syncCartResponse, resetCart]);



    // ==========================
    // ADD TO CART
    // ==========================
    const addToCart = useCallback(async (
        productId,
        variantId,
        quantity = 1
    ) => {

        const pid = Number(productId);
        const vid = Number(variantId);
        const qty = Number(quantity);

        try {

            const res = await API.post(
                "/api/cart/add",
                {
                    productId: pid,
                    variantId: vid,
                    quantity: qty
                }
            );

            console.log("ADD CART RESPONSE:", res.data);

            // Update badge immediately from backend
            if (
                typeof res.data?.cartCount === "number"
            ) {
                setCartCount(
                    res.data.cartCount
                );
            }

            // 🔥 IMPORTANT
            // Get the real cart data after successful add
            await loadCart();

            return true;

        }
        catch (err) {

            console.error(
                "Add To Cart Error:",
                err
            );

            return false;
        }

    }, [loadCart]);

    // ==========================
    // UPDATE CART
    // ==========================
    const updateCart = useCallback(async (
        productId,
        variantId,
        quantity
    ) => {

        const pid = Number(productId);
        const vid = Number(variantId);

        // Backup for rollback
        const previousItems = [...items];

        // Optimistic UI Update
        setItems(prev =>
            prev.map(item => {

                if (
                    Number(item.productId) === pid &&
                    Number(item.variantId) === vid
                ) {
                    return {
                        ...item,
                        quantity,
                        lineTotal:
                            (item.finalPrice || item.price) * quantity
                    };
                }

                return item;

            })
        );

        try {

            const res = await API.put("/api/cart/update", {
                productId,
                variantId,
                quantity
            });

            syncCartResponse(res.data);

            // If backend returns updated items
            if (res.data.items)
                setItems(res.data.items);

        }
        catch (err) {

            console.error("Update Cart Error:", err);

            // Rollback
            setItems(previousItems);

        }

    }, [items, syncCartResponse]);


    // ==========================
    // REMOVE ITEM
    // ==========================
    const removeFromCart = useCallback(async (
        productId,
        variantId
    ) => {

        const pid = Number(productId);
        const vid = Number(variantId);

        // Backup
        const previousItems = [...items];

        // Optimistic Remove
        setItems(prev =>
            prev.filter(item =>
                !(
                    Number(item.productId) === pid &&
                    Number(item.variantId) === vid
                )
            )
        );

        try {

            const res = await API.delete(
                `/api/cart/remove/${variantId}`
            );

            syncCartResponse(res.data);

            if (res.data.items)
                setItems(res.data.items);

        }
        catch (err) {

            console.error("Remove Cart Error:", err);

            // Rollback
            setItems(previousItems);

        }

    }, [items, syncCartResponse]);

    // ==========================
    // APPLY COUPON
    // ==========================
    const applyCoupon = useCallback(async (code) => {

        try {

            const res = await API.post(
                "/api/cart/apply-coupon",
                { code }
            );

            syncCartResponse(res.data);

            if (res.data.items)
                setItems(res.data.items);

            return res.data;

        }
        catch (err) {

            console.error("Apply Coupon Error:", err);

            return {
                success: false,
                message:
                    err.response?.data?.message ??
                    "Invalid coupon."
            };

        }

    }, [syncCartResponse]);


    // ==========================
    // GET QUANTITY
    // ==========================
    const getQty = useCallback((productId, variantId) => {

        return items.find(x =>
            Number(x.productId) === Number(productId) &&
            Number(x.variantId) === Number(variantId)
        )?.quantity ?? 0;

    }, [items]);


    // ==========================
    // INITIAL LOAD
    // ==========================
    useEffect(() => {

        loadCart();

    }, [loadCart]);


    // ==========================
    // CONTEXT VALUE
    // ==========================
    const value = useMemo(() => ({

        items,
        summary,
        cartCount,
        loading,

        addToCart,
        updateCart,
        removeFromCart,
        applyCoupon,
        getQty,
        loadCart

    }), [
        items,
        summary,
        cartCount,
        loading,
        addToCart,
        updateCart,
        removeFromCart,
        applyCoupon,
        getQty,
        loadCart
    ]);


    return (

        <CartContext.Provider value={value}>

            {children}

        </CartContext.Provider>

    );

};

export default CartContext;