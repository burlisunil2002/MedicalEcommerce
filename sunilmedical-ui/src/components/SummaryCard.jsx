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

    children

}) {

    const [msg, setMsg] = useState("");

    const subtotal = summary?.subtotal || 0;

    const percent = Math.min((subtotal / 2000) * 100, 100);

    const handleApply = async () => {

        if (!applyCoupon) return;

        await applyCoupon(coupon);

        setMsg("🎉 Coupon Applied Successfully!");

        setTimeout(() => setMsg(""), 2500);
    };

    return (

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">

            {/* TITLE */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">

                {title}

            </h2>

            {/* FREE DELIVERY */}
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-6">

                <div className="flex items-center justify-between mb-3">

                    <p className="text-sm font-semibold text-emerald-700">

                        {subtotal >= 2000
                            ? "🎉 Free Delivery Unlocked!"
                            : `₹${2000 - subtotal} away from FREE delivery`}

                    </p>

                    {subtotal >= 2000 && (

                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">

                            FREE

                        </span>

                    )}

                </div>

                <div className="bg-emerald-100 h-2 rounded-full overflow-hidden">

                    <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                    />

                </div>

            </div>

            {/* COUPON */}
            {showCoupon && (

                <div className="mb-6">

                    <div className="flex gap-3">

                        <input
                            value={coupon}
                            onChange={(e) =>
                                setCoupon(e.target.value)
                            }
                            placeholder="Enter coupon code"
                            className="
                                flex-1
                                border
                                border-gray-200
                                px-4
                                py-3
                                rounded-2xl
                                focus:outline-none
                                focus:ring-2
                                focus:ring-emerald-500
                                transition
                            "
                        />

                        <button
                            onClick={handleApply}
                            className="
                                bg-gray-900
                                hover:bg-black
                                transition
                                text-white
                                px-6
                                rounded-2xl
                                font-medium
                            "
                        >

                            Apply

                        </button>

                    </div>

                    {msg && (

                        <div className="text-emerald-600 text-sm mt-3 animate-pulse font-medium">

                            {msg}

                        </div>

                    )}

                </div>

            )}

            {/* EXTRA CONTENT */}
            {children}

            {/* SUMMARY */}
            <div className="space-y-4 text-[15px]">

                <div className="flex justify-between text-gray-600">

                    <span>Subtotal</span>

                    <span className="font-medium text-gray-900">

                        ₹{summary?.subtotal}

                    </span>

                </div>

                <div className="flex justify-between text-gray-600">

                    <span>GST</span>

                    <span className="font-medium text-gray-900">

                        ₹{summary?.gst}

                    </span>

                </div>

                <div className="flex justify-between text-emerald-600">

                    <span>You Saved</span>

                    <span className="font-semibold">

                        -₹{summary?.saved}

                    </span>

                </div>

                <div className="flex justify-between text-gray-600">

                    <span>Delivery</span>

                    <span className="font-semibold text-emerald-600">

                        {summary?.delivery === 0
                            ? "FREE"
                            : "₹80"}

                    </span>

                </div>

                <div className="flex justify-between text-orange-500">

                    <span>Coupon</span>

                    <span className="font-semibold">

                        -₹{summary?.couponDiscount}

                    </span>

                </div>

                <hr className="my-2 border-gray-200" />

                {/* TOTAL */}
                <div className="flex justify-between items-center">

                    <span className="text-2xl font-bold text-gray-900">

                        Total

                    </span>

                    <span className="text-3xl font-bold text-emerald-600">

                        ₹{summary?.total}

                    </span>

                </div>

            </div>

            {/* BUTTON */}
            {showButton && (

                <button
                    disabled={loading}
                    onClick={onButtonClick}
                    className="
                        w-full
                        mt-7
                        bg-emerald-600
                        hover:bg-emerald-700
                        transition-all
                        text-white
                        py-4
                        rounded-2xl
                        font-semibold
                        text-lg
                        shadow-md
                        hover:shadow-lg
                        disabled:opacity-50
                        disabled:cursor-not-allowed
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