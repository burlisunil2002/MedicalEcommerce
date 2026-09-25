import { useMemo } from "react";
import { Heart, Truck } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import AddToCartButton from "../components/AddToCartButton";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ p, setMessage }) {
    const navigate = useNavigate();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const defaultVariant = p?.defaultVariant;

    const data = useMemo(() => {
        const id = p?.id ?? p?.Id;
        const name = p?.name ?? p?.Name ?? "Medical Product";
        const brand = p?.brand ?? p?.Brand ?? "";
        const imageUrl = defaultVariant?.imageUrl ?? defaultVariant?.ImageUrl ?? p?.imageUrl ?? p?.ImageUrl ?? "/images/no-image.png";
        const price = Number(defaultVariant?.price ?? defaultVariant?.Price ?? p?.price ?? p?.Price ?? 0);
        const discount = Math.max(0, Math.min(100, Number(p?.discount ?? p?.DiscountPercentage ?? 0)));
        const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;
        const priceType = String(p?.priceType ?? p?.PriceType ?? "").toLowerCase();

        return {
            id, name, brand, imageUrl, price, discount, finalPrice,
            isDeal: discount > 0,
            isRFQ: priceType !== "normal",
        };
    }, [p, defaultVariant]);

    const variantId = Number(defaultVariant?.productVariantId ?? defaultVariant?.id ?? p?.variantId ?? 0);
    const wishlisted = isWishlisted(data.id, variantId);
    const openProduct = () => navigate(`/product/${data.id}`);

    const handleWishlist = async (event) => {
        event.stopPropagation();
        await toggleWishlist({
            ...p,
            id: data.id,
            variantId: defaultVariant?.productVariantId ?? defaultVariant?.id ?? p?.variantId,
            selectedVariant: defaultVariant,
        });
    };

    return (
        <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:rounded-2xl">
            <div onClick={openProduct} role="link" tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProduct();
                    }
                }}
                className="relative block h-[168px] w-full cursor-pointer overflow-hidden bg-slate-50 text-left sm:h-[190px] lg:h-[200px]">
                {data.isDeal && !data.isRFQ && (
                    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                        <span className="rounded-md bg-rose-600 px-1.5 py-1 text-[9px] font-extrabold text-white shadow-sm">{data.discount}% OFF</span>
                        <span className="rounded-md bg-slate-950 px-1.5 py-1 text-[9px] font-bold text-white shadow-sm">Deal</span>
                    </div>
                )}

                <button type="button" onClick={handleWishlist}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition hover:border-rose-200 hover:text-rose-500 active:scale-95">
                    <Heart size={15} fill={wishlisted ? "currentColor" : "none"} />
                </button>

                <img src={data.imageUrl} alt={data.name} loading="lazy" decoding="async"
                    className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.04]"
                    onError={(e) => { e.currentTarget.src = "/images/no-image.png"; }} />
            </div>

            <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">{data.brand || "Medical Product"}</p>

                <button type="button" onClick={openProduct} className="mt-1 line-clamp-2 min-h-[36px] text-left text-xs font-semibold leading-[18px] text-slate-900 transition hover:text-blue-600 sm:text-sm">
                    {data.name}
                </button>

                <div className="mt-2 min-h-[48px]">
                    {data.isRFQ ? (
                        <p className="text-xs font-bold text-orange-600 sm:text-sm">Price on Request</p>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
                                    ₹{Math.round(data.finalPrice).toLocaleString("en-IN")}
                                </span>
                                {data.isDeal && <span className="text-[10px] text-slate-400 line-through sm:text-xs">₹{Math.round(data.price).toLocaleString("en-IN")}</span>}
                            </div>
                            {data.isDeal && <p className="mt-0.5 text-[9px] font-bold text-emerald-600 sm:text-[10px]">Save ₹{Math.round(data.price - data.finalPrice).toLocaleString("en-IN")}</p>}
                        </>
                    )}
                </div>

                {!data.isRFQ && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-medium text-slate-500 sm:text-[10px]">
                        <Truck size={12} className="shrink-0" /> Delivery in 3–5 days
                    </div>
                )}

                <div className="mt-auto pt-3">
                    {data.isRFQ ? (
                        <button type="button" onClick={openProduct} className="h-9 w-full rounded-lg bg-slate-950 px-2 text-[11px] font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] sm:h-10 sm:text-xs">
                            Request Quote
                        </button>
                    ) : variantId > 0 ? (
                        <AddToCartButton
                            productId={Number(data.id)}
                            variantId={defaultVariant?.productVariantId ?? defaultVariant?.id}
                            minQty={Number(defaultVariant?.minQuantity ?? 1)}
                            stepQty={Number(defaultVariant?.stepQuantity ?? 1)}
                            maxQty={Number(defaultVariant?.maxQuantity ?? 0) || null}
                            setMessage={setMessage}
                        />
                    ) : (
                        <button type="button" onClick={openProduct} className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-bold text-slate-800 transition hover:border-blue-400 hover:text-blue-600 active:scale-[0.98] sm:h-10 sm:text-xs">
                            View Product
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
