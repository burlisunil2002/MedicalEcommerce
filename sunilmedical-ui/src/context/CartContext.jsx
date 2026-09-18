import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";

import API from "../services/api";

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    /*
     * Cart state contract:
     * null  = initial request has not completed
     * []    = server confirmed an empty cart
     * [...] = cart contains items
     */
    const [items, setItems] = useState(null);
    const [summary, setSummary] = useState({});
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const mountedRef = useRef(false);
    const requestIdRef = useRef(0);

    /*
     * Prevent an older mutation response from overwriting
     * a newer cart state.
     */
    const mutationIdRef = useRef(0);

    const syncCartResponse = useCallback((data) => {
        if (!data) return;

        if (typeof data.cartCount === "number") {
            setCartCount(data.cartCount);
        }

        if (data.summary) {
            setSummary(data.summary);
        }

        if (Array.isArray(data.items)) {
            setItems(data.items);
        } else if (Array.isArray(data.cartItems)) {
            setItems(data.cartItems);
        }
    }, []);

    const resetCart = useCallback(() => {
        if (!mountedRef.current) return;

        setItems([]);
        setSummary({});
        setCartCount(0);
    }, []);

    /*
     * Load the cart.
     *
     * silent=true:
     * - used for background synchronization
     * - never shows the initial loader
     * - never clears existing cart data on a temporary failure
     */
    const loadCart = useCallback(
        async ({ silent = false } = {}) => {
            const requestId = ++requestIdRef.current;

            if (!silent && mountedRef.current) {
                setLoading(true);
            }

            try {
                const response = await API.get("/api/cart/full");
                const data = response?.data;

                /*
                 * Ignore stale GET responses.
                 */
                if (
                    requestId !== requestIdRef.current ||
                    !mountedRef.current
                ) {
                    return data;
                }

                /*
                 * Only replace items when the server explicitly
                 * returned an array.
                 */
                if (Array.isArray(data?.items)) {
                    setItems(data.items);
                } else if (Array.isArray(data?.cartItems)) {
                    setItems(data.cartItems);
                }

                if (data?.summary) {
                    setSummary(data.summary);
                }

                if (
                    typeof data?.cartCount === "number"
                ) {
                    setCartCount(data.cartCount);
                }

                return data;
            } catch (error) {
                console.error(
                    "Load Cart Error:",
                    error
                );

                /*
                 * IMPORTANT:
                 *
                 * A background request must never wipe
                 * already-visible cart data.
                 */
                if (!silent && mountedRef.current) {
                    resetCart();
                }

                return null;
            } finally {
                if (
                    !silent &&
                    mountedRef.current &&
                    requestId === requestIdRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [resetCart]
    );

    /*
     * ADD TO CART
     *
     * Backend response is preferred as the authoritative state.
     * If the endpoint only returns success/count, perform a
     * silent reconciliation request.
     */
    const addToCart = useCallback(
        async (
            productId,
            variantId,
            quantity = 1
        ) => {
            const pid = Number(productId);
            const vid = Number(variantId);
            const qty = Number(quantity);

            if (
                !Number.isInteger(pid) ||
                pid <= 0 ||
                !Number.isInteger(qty) ||
                qty <= 0
            ) {
                return false;
            }

            const mutationId =
                ++mutationIdRef.current;

            try {
                const response = await API.post(
                    "/api/cart/add",
                    {
                        productId: pid,
                        variantId:
                            Number.isInteger(vid) &&
                                vid > 0
                                ? vid
                                : null,
                        quantity: qty,
                    }
                );

                const data = response?.data;

                if (
                    !mountedRef.current ||
                    mutationId !==
                    mutationIdRef.current
                ) {
                    return true;
                }

                syncCartResponse(data);

                /*
                 * If the add endpoint doesn't return the
                 * complete cart, reconcile in background.
                 */
                if (
                    !Array.isArray(data?.items) &&
                    !Array.isArray(data?.cartItems)
                ) {
                    await loadCart({
                        silent: true,
                    });
                }

                window.dispatchEvent(
                    new Event("cartUpdated")
                );

                return true;
            } catch (error) {
                console.error(
                    "Add To Cart Error:",
                    error
                );

                return false;
            }
        },
        [loadCart, syncCartResponse]
    );

    /*
     * UPDATE CART
     *
     * Optimistic UI:
     * quantity changes immediately.
     * Server response then reconciles the state.
     */
    const updateCart = useCallback(
        async (
            productId,
            variantId,
            quantity
        ) => {
            const pid = Number(productId);
            const vid = Number(variantId);
            const qty = Number(quantity);

            if (
                !Number.isInteger(pid) ||
                pid <= 0 ||
                !Number.isInteger(vid) ||
                vid <= 0 ||
                !Number.isInteger(qty) ||
                qty < 1
            ) {
                return false;
            }

            const previousItems = items
                ? [...items]
                : null;

            const mutationId =
                ++mutationIdRef.current;

            /*
             * Optimistic item update.
             */
            setItems((previous) => {
                if (!Array.isArray(previous)) {
                    return previous;
                }

                return previous.map((item) => {
                    if (
                        Number(item?.productId) !== pid ||
                        Number(item?.variantId) !== vid
                    ) {
                        return item;
                    }

                    const unitPrice = Number(
                        item?.finalPrice ??
                        item?.sellingPrice ??
                        item?.unitPrice ??
                        item?.price ??
                        item?.product?.finalPrice ??
                        item?.product?.sellingPrice ??
                        item?.product?.price ??
                        0
                    );

                    return {
                        ...item,
                        quantity: qty,
                        lineTotal:
                            unitPrice * qty,
                    };
                });
            });

            try {
                const response = await API.put(
                    "/api/cart/update",
                    {
                        productId: pid,
                        variantId: vid,
                        quantity: qty,
                    }
                );

                const data = response?.data;

                if (
                    !mountedRef.current ||
                    mutationId !==
                    mutationIdRef.current
                ) {
                    return true;
                }

                syncCartResponse(data);

                /*
                 * If backend doesn't return the updated
                 * item list, synchronize silently.
                 */
                if (
                    !Array.isArray(data?.items) &&
                    !Array.isArray(data?.cartItems)
                ) {
                    await loadCart({
                        silent: true,
                    });
                }

                window.dispatchEvent(
                    new Event("cartUpdated")
                );

                return true;
            } catch (error) {
                console.error(
                    "Update Cart Error:",
                    error
                );

                /*
                 * Roll back only if this is still the
                 * latest mutation.
                 */
                if (
                    mountedRef.current &&
                    mutationId ===
                    mutationIdRef.current &&
                    previousItems
                ) {
                    setItems(previousItems);
                }

                return false;
            }
        },
        [items, loadCart, syncCartResponse]
    );

    /*
     * REMOVE FROM CART
     *
     * Optimistically removes the item immediately.
     */
    const removeFromCart = useCallback(
        async (
            productId,
            variantId
        ) => {
            const pid = Number(productId);
            const vid = Number(variantId);

            if (
                !Number.isInteger(pid) ||
                pid <= 0 ||
                !Number.isInteger(vid) ||
                vid <= 0
            ) {
                return false;
            }

            const previousItems = items
                ? [...items]
                : null;

            const mutationId =
                ++mutationIdRef.current;

            setItems((previous) => {
                if (!Array.isArray(previous)) {
                    return previous;
                }

                return previous.filter(
                    (item) =>
                        !(
                            Number(
                                item?.productId
                            ) === pid &&
                            Number(
                                item?.variantId
                            ) === vid
                        )
                );
            });

            try {
                /*
                 * Keep your existing backend contract:
                 * DELETE /api/cart/remove/{variantId}
                 */
                const response =
                    await API.delete(
                        `/api/cart/remove/${vid}`
                    );

                const data =
                    response?.data;

                if (
                    !mountedRef.current ||
                    mutationId !==
                    mutationIdRef.current
                ) {
                    return true;
                }

                syncCartResponse(data);

                if (
                    !Array.isArray(data?.items) &&
                    !Array.isArray(data?.cartItems)
                ) {
                    await loadCart({
                        silent: true,
                    });
                }

                window.dispatchEvent(
                    new Event("cartUpdated")
                );

                return true;
            } catch (error) {
                console.error(
                    "Remove Cart Error:",
                    error
                );

                if (
                    mountedRef.current &&
                    mutationId ===
                    mutationIdRef.current &&
                    previousItems
                ) {
                    setItems(previousItems);
                }

                return false;
            }
        },
        [items, loadCart, syncCartResponse]
    );

    /*
     * APPLY COUPON
     *
     * Coupon application is intentionally kept in CartContext.
     * Checkout and Review should only display the resulting
     * coupon discount returned by the server.
     */
    const applyCoupon = useCallback(
        async (code) => {
            const normalizedCode =
                String(code ?? "").trim();

            if (!normalizedCode) {
                return {
                    success: false,
                    message:
                        "Please select a coupon.",
                };
            }

            try {
                const response =
                    await API.post(
                        "/api/cart/apply-coupon",
                        {
                            code: normalizedCode,
                        }
                    );

                const data =
                    response?.data;

                syncCartResponse(data);

                window.dispatchEvent(
                    new Event("cartUpdated")
                );

                return data;
            } catch (error) {
                console.error(
                    "Apply Coupon Error:",
                    error
                );

                return {
                    success: false,
                    message:
                        error?.response?.data
                            ?.message ||
                        "Invalid coupon.",
                };
            }
        },
        [syncCartResponse]
    );

    const getQty = useCallback(
        (productId, variantId) => {
            if (!Array.isArray(items)) {
                return 0;
            }

            return (
                items.find(
                    (item) =>
                        Number(
                            item?.productId
                        ) ===
                        Number(productId) &&
                        Number(
                            item?.variantId
                        ) ===
                        Number(variantId)
                )?.quantity ?? 0
            );
        },
        [items]
    );

    /*
     * INITIAL LOAD
     */
    useEffect(() => {
        mountedRef.current = true;

        loadCart();

        return () => {
            mountedRef.current = false;
            requestIdRef.current += 1;
            mutationIdRef.current += 1;
        };
    }, [loadCart]);

    /*
     * Optional synchronization for components/pages that
     * update the cart outside this context.
     */
    useEffect(() => {
        const handleCartUpdated = () => {
            loadCart({
                silent: true,
            });
        };

        window.addEventListener(
            "cartUpdated",
            handleCartUpdated
        );

        return () => {
            window.removeEventListener(
                "cartUpdated",
                handleCartUpdated
            );
        };
    }, [loadCart]);

    const value = useMemo(
        () => ({
            items,
            summary,
            cartCount,
            loading,

            addToCart,
            updateCart,
            removeFromCart,
            applyCoupon,
            getQty,
            loadCart,
        }),
        [
            items,
            summary,
            cartCount,
            loading,

            addToCart,
            updateCart,
            removeFromCart,
            applyCoupon,
            getQty,
            loadCart,
        ]
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
