import { useState } from "react";

export default function SummaryCard({
    summary,
    coupon,
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
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] =
        useState("");

    const subtotal = summary?.subtotal || 0;

    const percent = Math.min(
        (subtotal / 2000) * 100,
        100
    );

    const handleApply = async () => {
        if (!coupon?.trim()) {
            setMsg(
                "Please enter coupon code"
            );
            setMsgType("error");

            setTimeout(() => {
                setMsg("");
            }, 2500);

            return;
        }

        if (!applyCoupon) return;

        try {
            const result =
                await applyCoupon(coupon);

            if (result?.success) {
                setMsg(
                    "🎉 Coupon applied successfully!"
                );
                setMsgType("success");
            } else {
                setMsg(
                    result?.message ||
                    "Coupon is invalid"
                );
                setMsgType("error");
            }
        } catch {
            setMsg(
                "Unable to apply coupon"
            );
            setMsgType("error");
        }

        setTimeout(() => {
            setMsg("");
            setMsgType("");
        }, 2500);
    };

    return (
        <div
            className="
                bg-white
                rounded-3xl
                border
                border-gray-100
                shadow-sm
                p-6
                lg:sticky
                lg:top-24
            "
        >
            {/* TITLE */}
            <h2
                className="
                    text-2xl
                    font-bold
                    text-gray-900
                    mb-6
                "
            >
                {title}
            </h2>

            {/* FREE DELIVERY */}
            <div
                className="
                    bg-emerald-50
                    border
                    border-emerald-100
                    rounded-2xl
                    p-4
                    mb-6
                "
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-emerald-700">
                        {subtotal >= 2000
                            ? "🎉 Free Delivery Unlocked!"
                            : `₹${2000 -
                            subtotal
                            } away from FREE delivery`}
                    </p>

                    {subtotal >= 2000 && (
                        <span
                            className="
                                bg-emerald-100
                                text-emerald-700
                                text-xs
                                px-3
                                py-1
                                rounded-full
                                font-semibold
                            "
                        >
                            FREE
                        </span>
                    )}
                </div>

                <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div
                        className="
                            bg-emerald-500
                            h-2
                            rounded-full
                            transition-all
                            duration-700
                        "
                        style={{
                            width: `${percent}%`,
                        }}
                    />
                </div>
            </div>

            {/* COUPON */}
            {showCoupon && (
                <div className="mb-6">
                    <div className="flex items-stretch gap-3">
                        <input
                            value={coupon}
                            onChange={(e) =>
                                setCoupon(
                                    e.target.value
                                )
                            }
                            placeholder="Enter coupon code"
                            className="
                                flex-1
                                h-[52px]
                                border
                                border-gray-200
                                rounded-2xl
                                px-4
                                text-sm
                                focus:outline-none
                                focus:ring-2
                                focus:ring-emerald-500
                            "
                        />

                        <button
                            onClick={
                                handleApply
                            }
                            className="
                                h-[52px]
                                px-6
                                rounded-2xl
                                bg-gray-900
                                hover:bg-black
                                text-white
                                font-medium
                                transition
                            "
                        >
                            Apply
                        </button>
                    </div>

                    {msg && (
                        <div
                            className={`mt-3 text-sm font-medium ${msgType ===
                                    "success"
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                        >
                            {msg}
                        </div>
                    )}
                </div>
            )}

            {children}

            {/* PRICE DETAILS */}
            <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>
                        Subtotal
                    </span>
                    <span className="font-medium text-gray-900">
                        ₹
                        {summary?.subtotal ||
                            0}
                    </span>
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>GST</span>
                    <span className="font-medium text-gray-900">
                        ₹
                        {summary?.gst ||
                            0}
                    </span>
                </div>

                <div className="flex justify-between text-emerald-600">
                    <span>
                        You Saved
                    </span>
                    <span className="font-semibold">
                        -₹
                        {summary?.saved ||
                            0}
                    </span>
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>
                        Delivery
                    </span>
                    <span className="font-semibold text-emerald-600">
                        {summary?.delivery ===
                            0
                            ? "FREE"
                            : `₹${summary?.delivery}`}
                    </span>
                </div>

                <div className="flex justify-between text-orange-500">
                    <span>
                        Coupon
                        Discount
                    </span>
                    <span className="font-semibold">
                        -₹
                        {summary?.couponDiscount ||
                            0}
                    </span>
                </div>

                <hr className="border-gray-200 my-2" />

                {/* TOTAL */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-bold text-gray-900">
                        Total
                    </span>

                    <span className="text-3xl font-bold text-emerald-600">
                        ₹
                        {summary?.total ||
                            0}
                    </span>
                </div>
            </div>

            {/* BUTTON */}
            {showButton && (
                <button
                    disabled={loading}
                    onClick={
                        onButtonClick
                    }
                    className="
                        w-full
                        mt-7
                        bg-emerald-600
                        hover:bg-emerald-700
                        text-white
                        py-4
                        rounded-2xl
                        font-semibold
                        text-lg
                        transition-all
                        shadow-md
                        hover:shadow-lg
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        disabled:hover:bg-emerald-600
                    "
                >
                    {loading
                        ? "Please Wait..."
                        : buttonText}
                </button>
            )}
        </div>
    );
}