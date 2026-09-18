import { useEffect, useMemo, useState } from "react";

export default function SummaryCard({
    summary = {},
    coupon = "",
    setCoupon,
    applyCoupon,
    buttonText = "Proceed to Checkout",
    onButtonClick,
    loading = false,
    couponLoading = false,
    title = "Price Details",
    children,

    // Cart: true, Checkout/Review: false
    showCoupon = true,
    showFreeDelivery = true,
    showButton = true,
}) {
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState("");

    const subtotal = Number(summary?.subtotal ?? 0);
    const saved = Number(
        summary?.saved ??
        summary?.productDiscount ??
        summary?.discount ??
        0
    );
    const delivery = Number(summary?.delivery ?? 0);
    const couponDiscount = Number(summary?.couponDiscount ?? 0);

    const total = Number(
        summary?.total ??
        summary?.grandTotal ??
        summary?.finalTotal ??
        0
    );

    const FREE_DELIVERY_LIMIT = 2000;

    const remainingForFreeDelivery = Math.max(
        0,
        FREE_DELIVERY_LIMIT - subtotal
    );

    const deliveryProgress = Math.min(
        (subtotal / FREE_DELIVERY_LIMIT) * 100,
        100
    );

    const money = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    useEffect(() => {
        if (!msg) return;

        const timer = window.setTimeout(() => {
            setMsg("");
            setMsgType("");
        }, 3000);

        return () => window.clearTimeout(timer);
    }, [msg]);

    const availableCoupons = useMemo(() => {
        const coupons = [];

        if (subtotal >= 1000) coupons.push("SAVE10");
        if (subtotal >= 2000) coupons.push("FIRST20");
        if (subtotal >= 3000) coupons.push("FLAT100");

        return coupons;
    }, [subtotal]);

    const handleApplyCoupon = async () => {
        if (!coupon?.trim() || couponLoading || !applyCoupon) {
            return;
        }

        try {
            const result = await applyCoupon(coupon.trim());

            if (result?.success) {
                setMsg("Coupon applied successfully.");
                setMsgType("success");
            } else {
                setMsg(result?.message || "Invalid coupon code.");
                setMsgType("error");
            }
        } catch {
            setMsg("Unable to apply coupon.");
            setMsgType("error");
        }
    };

    return (
        <aside
            className="
                w-full
                rounded-2xl
                border border-gray-200
                bg-white
                p-4 sm:p-5 lg:p-6
                shadow-sm
                lg:sticky lg:top-24
            "
        >
            {/* Header */}
            <div className="mb-5 sm:mb-6">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                        {title}
                    </h2>

                    {subtotal > 0 && (
                        <span className="shrink-0 text-xs sm:text-sm font-semibold text-gray-500 tabular-nums">
                            {money(total)}
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Review your order before checkout
                </p>
            </div>

            {/* Free delivery */}
            {showFreeDelivery && (
                <div className="mb-5 sm:mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 sm:p-4">
                    {remainingForFreeDelivery > 0 ? (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-emerald-700">
                                        Free delivery
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-emerald-600">
                                        Add{" "}
                                        <strong>
                                            {money(remainingForFreeDelivery)}
                                        </strong>{" "}
                                        more to unlock free delivery.
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
                                    FREE
                                </span>
                            </div>

                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{
                                        width: `${deliveryProgress}%`,
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                ✓
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-emerald-700">
                                    Free delivery unlocked
                                </p>

                                <p className="mt-0.5 text-xs text-emerald-600">
                                    Your order qualifies for free delivery.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Coupon - Cart only */}
            {showCoupon && (
                <div className="mb-5 sm:mb-6">
                    <label
                        htmlFor="cart-coupon"
                        className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                        Apply Coupon
                    </label>

                    <div className="flex gap-2">
                        <select
                            id="cart-coupon"
                            value={coupon}
                            onChange={(event) =>
                                setCoupon?.(event.target.value)
                            }
                            disabled={couponLoading}
                            className="
                                min-w-0 flex-1 h-11
                                rounded-xl border border-gray-300
                                bg-white px-3
                                text-sm text-gray-800
                                outline-none
                                focus:border-gray-900
                                focus:ring-1 focus:ring-gray-900
                                disabled:bg-gray-50
                            "
                        >
                            <option value="">Select coupon</option>

                            {availableCoupons.map((code) => (
                                <option key={code} value={code}>
                                    {code}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={!coupon || couponLoading}
                            className="
                                flex h-11 min-w-[70px]
                                items-center justify-center
                                rounded-xl bg-gray-900 px-4
                                text-sm font-semibold text-white
                                transition hover:bg-black
                                active:scale-[0.98]
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            {couponLoading ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                "Apply"
                            )}
                        </button>
                    </div>

                    {msg && (
                        <div
                            role="status"
                            className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${msgType === "success"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                        >
                            {msg}
                        </div>
                    )}
                </div>
            )}

            {children}

            {/* Price breakdown */}
            <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between gap-4 text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900 tabular-nums">
                        {money(subtotal)}
                    </span>
                </div>

                {saved > 0 && (
                    <div className="flex items-center justify-between gap-4 text-emerald-600">
                        <span>You Save</span>
                        <span className="font-semibold tabular-nums">
                            −{money(saved)}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4 text-gray-600">
                    <span>Delivery</span>
                    <span className="font-medium text-emerald-600 tabular-nums">
                        {delivery === 0 ? "FREE" : money(delivery)}
                    </span>
                </div>

                {couponDiscount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-emerald-600">
                        <span>Coupon Discount</span>
                        <span className="font-semibold tabular-nums">
                            −{money(couponDiscount)}
                        </span>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="mt-5 border-t border-gray-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                            Order Total
                        </p>

                        <p className="mt-1 text-[11px] text-gray-500">
                            Final amount payable
                        </p>
                    </div>

                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
                        {money(total)}
                    </span>
                </div>
            </div>

            {/* Action */}
            {showButton && (
                <button
                    type="button"
                    onClick={onButtonClick}
                    disabled={loading}
                    className="
                        mt-5 flex h-12 w-full
                        items-center justify-center
                        rounded-xl bg-emerald-600 px-5
                        text-sm font-semibold text-white
                        shadow-sm transition-all
                        hover:bg-emerald-700 hover:shadow-md
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:bg-gray-300
                    "
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Please wait...
                        </span>
                    ) : (
                        <>
                            {buttonText}
                            <span className="ml-2">→</span>
                        </>
                    )}
                </button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-gray-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">
                    🔒
                </span>
                <span>Secure checkout · Your payment information is protected</span>
            </div>
        </aside>
    );
}
