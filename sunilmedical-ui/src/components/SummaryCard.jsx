import { useState } from "react";

export default function SummaryCard({
    summary = {},
    coupon = "",
    setCoupon,
    applyCoupon,
    buttonText = "Proceed",
    onButtonClick,
    showCoupon = true,
    showButton = true,
    loading = false,
    title = "Price Details",
    children,
}) {
    const [msg, setMsg] =
        useState("");

    const [msgType, setMsgType] =
        useState("");

    const subtotal =
        Number(summary?.subtotal || 0);

    const gst =
        Number(summary?.gst || 0);

    const saved =
        Number(summary?.saved || 0);

    const delivery =
        Number(summary?.delivery || 0);

    const couponDiscount =
        Number(
            summary?.couponDiscount || 0
        );

    const total =
        Number(
            summary?.total ||
            summary?.grandTotal ||
            0
        );

    const percent = Math.min(
        (subtotal / 2000) * 100,
        100
    );

    const money = (value) =>
        `₹${ Number(value).toFixed(2) } `;

    const showMessage = (
        text,
        type
    ) => {
        setMsg(text);
        setMsgType(type);

        setTimeout(() => {
            setMsg("");
            setMsgType("");
        }, 3000);
    };

const availableCoupons = [];

if (subtotal >= 1000) {
    availableCoupons.push("SAVE10");
}

if (subtotal >= 2000) {
    availableCoupons.push("FIRST20");
}

if (subtotal >= 3000) {
    availableCoupons.push("FLAT100");
}


const handleApplyCoupon = async () => {
    if (!coupon?.trim()) return;

    try {
        const result =
            await applyCoupon(
                coupon.trim()
            );

        if (result?.success) {
            showMessage(
                "Coupon applied successfully 🎉",
                "success"
            );
        } else {
            showMessage(
                "Invalid coupon code",
                "error"
            );
        }
    } catch {
        showMessage(
            "Invalid coupon code",
            "error"
        );
    }
};



    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 lg:p-7 lg:sticky lg:top-24 h-fit font-[Inter]">

            {/* TITLE */}
            <h2 className="text-[28px] font-semibold tracking-tight text-gray-900 mb-6">
                {title}
            </h2>

            {/* FREE DELIVERY */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-emerald-700">

                        {subtotal >= 2000
                            ? "🎉 Free Delivery Unlocked"
                            : `${
    money(
        2000 -
        subtotal
    )
} away from FREE delivery`}
                    </p>

                    {subtotal >= 2000 && (
                        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold">
                            FREE
                        </span>
                    )}
                </div>

                <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                        className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                            width: `${ percent }% `,
                        }}
                    />
                </div>
            </div>

            {/* COUPON */}
            {showCoupon && (
                <div className="mb-6">
                    <div className="flex gap-3">

                        <select
                            value={coupon}
                            onChange={(e) =>
                                setCoupon(e.target.value)
                            }
                            className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm"
                        >
                            <option value="">
                                Select Coupon
                            </option>

                            {availableCoupons.map(c => (
                                <option
                                    key={c}
                                    value={c}
                                >
                                    {c}
                                </option>
                            ))}
                        </select>


                        <button
                            onClick={
                                handleApplyCoupon
                            }
                            className="px-5 h-12 rounded-2xl bg-gray-900 text-white font-medium hover:bg-black transition"
                        >
                            Apply
                        </button>
                    </div>

                    {msg && (
                        <p
                            className={`mt-3 text-sm font-medium ${msgType === "success"
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                        >
                            {msg}
                        </p>
                    )}

                </div>
            )}

            {children}

            {/* PRICE */}
            <div className="space-y-4 text-[15px]">

                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                        {money(
                            subtotal
                        )}
                    </span>
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>GST</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                        {money(gst)}
                    </span>
                </div>

                <div className="flex justify-between text-emerald-600">
                    <span>You Saved</span>
                    <span className="font-semibold tabular-nums">
                        -{money(saved)}
                    </span>
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                        {delivery === 0
                            ? "FREE"
                            : money(
                                delivery
                            )}
                    </span>
                </div>

                <div className="flex justify-between text-orange-500">
                    <span>Coupon Discount</span>
                    <span className="font-semibold tabular-nums">
                        -{money(
                            couponDiscount
                        )}
                    </span>
                </div>

                <div className="border-t border-gray-200 pt-5 mt-5">

                    <div className="flex justify-between items-center">

                        <span className="text-xl font-semibold text-gray-900">
                            Total
                        </span>

                        <span className="text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">
                            {money(total)}
                        </span>

                    </div>

                </div>
            </div>

            {/* BUTTON */}
            {showButton && (
                <button
                    disabled={loading}
                    onClick={
                        onButtonClick
                    }
                    className="w-full mt-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 font-semibold text-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
                >
                    {loading
                        ? "Please Wait..."
                        : buttonText}
                </button>
            )}
        </div>
    );
}
