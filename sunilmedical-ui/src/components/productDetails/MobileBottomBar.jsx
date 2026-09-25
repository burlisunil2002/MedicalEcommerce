import { Zap } from "lucide-react";
import AddToCartButton from "../../components/AddToCartButton";

export default function MobileBottomBar({
    product,
    selectedVariant,
    onBuyNow,
    setMessage,
}) {
    if (!product || !selectedVariant) return null;

    const discount = Math.max(
        0,
        Math.min(100, Number(product?.discountPercentage ?? 0))
    );
    const price = Number(selectedVariant?.price ?? product?.price ?? 0);
    const finalPrice =
        discount > 0 ? price - (price * discount) / 100 : price;

    const variantId =
        selectedVariant?.productVariantId ?? selectedVariant?.id;

    const stockQty =
        selectedVariant?.stockQuantity ?? product?.stockQuantity ?? null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-10px_35px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
            <div className="mx-auto w-full max-w-2xl px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5">
                <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold text-slate-500">
                            {selectedVariant?.model || product?.name || "Selected product"}
                        </p>
                        <p className="text-lg font-black tracking-tight text-slate-950">
                            ₹{finalPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {selectedVariant?.unit && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                            {selectedVariant.unit}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <AddToCartButton
                        productId={product.id}
                        variantId={variantId}
                        minQty={selectedVariant?.minQuantity}
                        maxQty={selectedVariant?.maxQuantity}
                        stockQty={stockQty}
                        stepQty={selectedVariant?.stepQuantity}
                        setMessage={setMessage}
                    />

                    <button
                        type="button"
                        onClick={onBuyNow}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 active:scale-[0.99] sm:h-12"
                    >
                        <Zap size={17} />
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
