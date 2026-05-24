import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {

    const [wishlist, setWishlist] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            const res = await API.get("/api/wishlist");

            const normalized = (res.data || []).map(p => ({
                ...p,

                // 🔥 ensure consistent casing
                id: p.id ?? p.Id,

                discount: Number(
                    p.discount ??
                    p.DiscountPercentage ??
                    0
                ),

                isHotDeal: p.isHotDeal ?? p.IsHotDeal ?? false,

                priceType: (p.priceType ?? p.PriceType ?? "normal").toLowerCase(),

                variants: p.variants || [],
                defaultVariant: p.defaultVariant || null
            }));

            setWishlist(normalized);

            const countRes = await API.get("/api/wishlist/count");
            setWishlistCount(countRes.data);

        } catch (err) {
            console.error("Wishlist load failed", err);
        }
    };

    // 🔥 FAST TOGGLE
    const toggleWishlist = async (product) => {

        const productId = product.id ?? product.Id;
        const variantId = product.variantId;

        const exists = wishlist.some(x =>
            x.id === productId &&
            x.variantId === variantId
        );

        let updated;

        if (exists) {
            updated = wishlist.filter(x =>
                !(x.id === productId && x.variantId === variantId)
            );
        } else {
            updated = [...wishlist, {
                ...product,
                id: productId,
                variantId,
                defaultVariant: product.selectedVariant
            }];
        }

        setWishlist(updated);
        setWishlistCount(updated.length);

        try {
            await API.post("/api/wishlist/toggle", {
                productId,
                variantId // 🔥 send variant
            });

            await loadWishlist();
        } catch (err) {
            console.error("Toggle failed", err);
        }
    };

    const isWishlisted = (id) => {
        return wishlist.some(x => x.id === id);
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                wishlistCount,
                toggleWishlist,
                isWishlisted,
                loadWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};