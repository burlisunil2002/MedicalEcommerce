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

            console.log("===== GET WISHLIST =====");
            console.log(res.data);

            const list =
                Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data.items)
                        ? res.data.items
                        : Array.isArray(res.data.data)
                            ? res.data.data
                            : [];

            const normalized = list.map(p => ({
                ...p,

                id: Number(p.id ?? p.Id),

                variantId: Number(
                    p.variantId ??
                    p.VariantId ??
                    0
                ),

                discount: Number(
                    p.discount ??
                    p.DiscountPercentage ??
                    0
                ),

                isHotDeal:
                    p.isHotDeal ??
                    p.IsHotDeal ??
                    false,

                priceType:
                    (
                        p.priceType ??
                        p.PriceType ??
                        "normal"
                    ).toLowerCase(),

                variants: p.variants ?? [],

                defaultVariant:
                    p.defaultVariant ??
                    null
            }));

            console.log("Normalized Wishlist");
            console.log(normalized);

            const distinct = normalized.filter(
                (item, index, self) =>
                    index === self.findIndex(x =>
                        Number(x.id) === Number(item.id) &&
                        Number(x.variantId) === Number(item.variantId)
                    )
            );

            setWishlist(distinct);
            const countRes = await API.get("/api/wishlist/count");
            setWishlistCount(countRes.data);

        } catch (err) {
            console.error("Wishlist load failed", err);
        }
    };

    // 🔥 FAST TOGGLE
    const toggleWishlist = async (product) => {

        const productId =
            Number(product.id ?? product.Id);

        const variantId =
            Number(
                product.variantId ??
                product.selectedVariant?.id ??
                product.selectedVariant?.productVariantId ??
                0
            );

        const existingIndex = wishlist.findIndex(
            x =>
                Number(x.id) === Number(productId) &&
                Number(x.variantId) === Number(variantId)
        );

        let updated;

        if (existingIndex >= 0) {
            updated = wishlist.filter(x =>
                !(x.id === productId && x.variantId === variantId)
            );
        } else {
            updated = [
                ...wishlist,
                {
                    ...product,

                    id: productId,

                    variantId,

                    defaultVariant:
                        product.selectedVariant,

                    variants:
                        product.selectedVariant
                            ? [product.selectedVariant]
                            : []
                }
            ];
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

    const isWishlisted = (
        productId,
        variantId
    ) => {
        return wishlist.some(
            x =>
                Number(x.id) === Number(productId) &&
                Number(x.variantId) === Number(variantId)
        );
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