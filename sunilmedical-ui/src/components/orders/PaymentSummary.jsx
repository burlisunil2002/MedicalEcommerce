import React, { memo, useMemo } from "react";
import {
    CreditCard,
    IndianRupee,
    BadgePercent,
    Receipt,
    CheckCircle2,
    ShieldCheck,
    Tag
} from "lucide-react";

const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (value) =>
    `₹${toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const firstNumber = (...values) => {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            const n = Number(value);
            if (Number.isFinite(n)) return n;
        }
    }
    return 0;
};

const getQuantity = (item) =>
    Math.max(1, toNumber(item?.quantity, 1));

const getOriginalUnitPrice = (item) =>
    firstNumber(
        item?.productPrice,
        item?.originalPrice,
        item?.mrp,
        item?.price
    );

const getFinalUnitPrice = (item) => {
    const explicitFinal = firstNumber(
        item?.productFinalPrice,
        item?.finalPrice,
        item?.sellingPrice,
        item?.unitPrice
    );

    if (explicitFinal > 0) {
        return explicitFinal;
    }

    const original = getOriginalUnitPrice(item);

    const discount = firstNumber(
        item?.discountAmount,
        item?.productDiscountAmount,
        item?.discountPerUnit
    );

    return Math.max(0, original - discount);
};

function PaymentSummary({ order }) {
    const summary = useMemo(() => {
        const items = Array.isArray(order?.items)
            ? order.items
            : [];

        /*
         * Product amount before discount
         */
        const productPrice = items.reduce(
            (sum, item) =>
                sum +
                getOriginalUnitPrice(item) *
                getQuantity(item),
            0
        );

        /*
         * Product discount
         *
         * Original Price - Final Product Price
         */
        const productDiscount = items.reduce(
            (sum, item) => {
                const original = getOriginalUnitPrice(item);
                const final = getFinalUnitPrice(item);

                return (
                    sum +
                    Math.max(0, original - final) *
                    getQuantity(item)
                );
            },
            0
        );

        /*
         * Price after product discount
         */
        const amountAfterProductDiscount = Math.max(
            0,
            productPrice - productDiscount
        );

        /*
         * Backend final amount is the source of truth for the actual
         * amount paid. Some order responses do not expose the coupon
         * field, so when that happens we derive the missing coupon:
         *
         * Coupon = Price After Discount - Final Paid Amount
         *
         * This makes the visible breakdown tally exactly with the
         * customer's actual paid amount.
         */
        const explicitCoupon = firstNumber(
            order?.couponDiscount,
            order?.couponDiscountAmount,
            order?.couponAmount,
            order?.discountCouponAmount
        );

        const hasExplicitCoupon =
            order?.couponDiscount !== undefined &&
            order?.couponDiscount !== null ||
            order?.couponDiscountAmount !== undefined &&
            order?.couponDiscountAmount !== null ||
            order?.couponAmount !== undefined &&
            order?.couponAmount !== null ||
            order?.discountCouponAmount !== undefined &&
            order?.discountCouponAmount !== null;

        const backendFinalPaidRaw =
            order?.grandTotal ??
            order?.finalPaidAmount ??
            order?.totalAmount ??
            order?.amountPaid;

        const hasBackendFinalPaid =
            backendFinalPaidRaw !== undefined &&
            backendFinalPaidRaw !== null &&
            backendFinalPaidRaw !== "";

        const backendFinalPaid = firstNumber(
            backendFinalPaidRaw
        );

        /*
         * If the backend does not send CouponDiscount but the final
         * paid amount is lower than the discounted product amount,
         * derive the order-level coupon from the two amounts.
         */
        const derivedCoupon = Math.max(
            0,
            amountAfterProductDiscount -
            backendFinalPaid
        );

        /*
         * If an explicit positive coupon is available, use it.
         * If the API sends 0/null but the backend final amount is lower
         * than the discounted product amount, derive the missing coupon.
         */
        const couponDiscount =
            explicitCoupon > 0
                ? Math.min(
                    explicitCoupon,
                    amountAfterProductDiscount
                )
                : hasBackendFinalPaid &&
                    derivedCoupon > 0
                    ? Math.min(
                        derivedCoupon,
                        amountAfterProductDiscount
                    )
                    : 0;

        /*
         * Final amount:
         * Price after product discount
         * - Coupon discount
         * = Final net paid amount
         */
        const calculatedNetPaid = Math.max(
            0,
            amountAfterProductDiscount -
            couponDiscount
        );

        const netPaid =
            hasBackendFinalPaid
                ? backendFinalPaid
                : calculatedNetPaid;

        return {
            productPrice,
            productDiscount,
            amountAfterProductDiscount,
            couponDiscount,
            netPaid
        };
    }, [order]);

    const paymentStatus =
        String(order?.paymentStatus || "Pending").trim();

    const statusKey = paymentStatus.toLowerCase();

    const isPaid = [
        "paid",
        "completed",
        "success",
        "successful"
    ].includes(statusKey);

    const paymentMethod =
        order?.paymentMethod ||
        order?.paymentMode ||
        (order?.razorpayPaymentId
            ? "Online Payment"
            : "Payment");

    return (
        <section className="bg-white">
            <div className="px-4 py-5 sm:px-6 sm:py-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="
                            flex h-10 w-10 shrink-0 items-center
                            justify-center rounded-xl
                            bg-blue-50 text-blue-600
                        ">
                            <CreditCard size={20} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="
                                truncate text-lg font-bold
                                text-slate-900 sm:text-xl
                            ">
                                Payment Summary
                            </h3>

                            <p className="
                                mt-0.5 text-xs text-slate-500
                                sm:text-sm
                            ">
                                Order payment details
                            </p>
                        </div>
                    </div>

                    <div className="
                        hidden shrink-0 items-center gap-1.5
                        rounded-full bg-emerald-50
                        px-3 py-1.5 text-xs font-semibold
                        text-emerald-700 sm:flex
                    ">
                        <ShieldCheck size={14} />
                        Secure Payment
                    </div>
                </div>

                {/* Amazon-style compact payment summary */}
                <div className="
                    mt-5 grid gap-4
                    lg:grid-cols-[1fr_340px]
                ">

                    {/* Price breakdown */}
                    <div className="
                        rounded-2xl border border-slate-200
                        bg-white p-4 shadow-sm sm:p-5
                    ">
                        <div className="space-y-0">

                            {/* Product price */}
                            <div className="
                                flex items-center justify-between
                                gap-4 py-3
                            ">
                                <div className="
                                    flex min-w-0 items-center gap-3
                                ">
                                    <div className="
                                        flex h-9 w-9 shrink-0
                                        items-center justify-center
                                        rounded-lg bg-slate-50
                                        text-slate-500
                                    ">
                                        <IndianRupee size={17} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="
                                            text-sm font-medium
                                            text-slate-700
                                        ">
                                            Product Price
                                        </p>
                                        <p className="
                                            text-xs text-slate-400
                                        ">
                                            Price before discount
                                        </p>
                                    </div>
                                </div>

                                <span className="
                                    shrink-0 text-sm font-semibold
                                    text-slate-900 sm:text-base
                                ">
                                    {formatMoney(summary.productPrice)}
                                </span>
                            </div>

                            {/* Product discount */}
                            {summary.productDiscount > 0 && (
                                <div className="
                                    flex items-center justify-between
                                    gap-4 border-t border-slate-100
                                    py-3
                                ">
                                    <div className="
                                        flex min-w-0 items-center gap-3
                                    ">
                                        <div className="
                                            flex h-9 w-9 shrink-0
                                            items-center justify-center
                                            rounded-lg bg-emerald-50
                                            text-emerald-600
                                        ">
                                            <BadgePercent size={17} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="
                                                text-sm font-medium
                                                text-emerald-700
                                            ">
                                                Product Discount
                                            </p>
                                            <p className="
                                                text-xs text-slate-400
                                            ">
                                                Savings on products
                                            </p>
                                        </div>
                                    </div>

                                    <span className="
                                        shrink-0 text-sm font-semibold
                                        text-emerald-600 sm:text-base
                                    ">
                                        - {formatMoney(
                                            summary.productDiscount
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* After product discount */}
                            <div className="
                                flex items-center justify-between
                                gap-4 border-t border-slate-200
                                py-3.5
                            ">
                                <div className="min-w-0">
                                    <p className="
                                        text-sm font-semibold
                                        text-slate-800
                                    ">
                                        Price After Discount
                                    </p>
                                </div>

                                <span className="
                                    shrink-0 text-sm font-bold
                                    text-slate-900 sm:text-base
                                ">
                                    {formatMoney(
                                        summary.amountAfterProductDiscount
                                    )}
                                </span>
                            </div>

                            {/* Coupon */}
                            {summary.couponDiscount > 0 && (
                                <div className="
                                    flex items-center justify-between
                                    gap-4 border-t border-slate-100
                                    py-3
                                ">
                                    <div className="
                                        flex min-w-0 items-center gap-3
                                    ">
                                        <div className="
                                            flex h-9 w-9 shrink-0
                                            items-center justify-center
                                            rounded-lg bg-amber-50
                                            text-amber-600
                                        ">
                                            <Tag size={17} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="
                                                text-sm font-medium
                                                text-amber-700
                                            ">
                                                Coupon Discount
                                            </p>
                                            <p className="
                                                text-xs text-slate-400
                                            ">
                                                Coupon applied to this order
                                            </p>
                                        </div>
                                    </div>

                                    <span className="
                                        shrink-0 text-sm font-semibold
                                        text-amber-600 sm:text-base
                                    ">
                                        - {formatMoney(
                                            summary.couponDiscount
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Simple calculation */}
                        <div className="
                            mt-3 flex items-center gap-2
                            rounded-xl bg-slate-50 px-3.5 py-3
                        ">
                            <Receipt
                                size={15}
                                className="shrink-0 text-slate-500"
                            />
                            <p className="
                                text-xs leading-5 text-slate-500
                            ">
                                Product price − product discount
                                {summary.couponDiscount > 0
                                    ? " − coupon discount"
                                    : ""}
                                {" = final net paid amount"}
                            </p>
                        </div>
                    </div>

                    {/* Final amount */}
                    <div className="
                        flex flex-col justify-between
                        rounded-2xl border border-blue-100
                        bg-gradient-to-br from-blue-50
                        via-white to-slate-50
                        p-5 shadow-sm sm:p-6
                    ">
                        <div>
                            <div className="
                                flex items-start justify-between gap-3
                            ">
                                <div>
                                    <p className="
                                        text-xs font-semibold
                                        uppercase tracking-wide
                                        text-slate-500
                                    ">
                                        Final Net Paid Amount
                                    </p>

                                    <p className="
                                        mt-2 break-all text-3xl
                                        font-extrabold tracking-tight
                                        text-blue-700 sm:text-4xl
                                    ">
                                        {formatMoney(summary.netPaid)}
                                    </p>
                                </div>

                                <div className="
                                    flex h-11 w-11 shrink-0
                                    items-center justify-center
                                    rounded-xl bg-blue-600
                                    text-white shadow-sm
                                ">
                                    <Receipt size={21} />
                                </div>
                            </div>

                            <div className="
                                mt-5 space-y-2.5
                                border-t border-blue-100 pt-4
                            ">
                                <div className="
                                    flex items-center justify-between
                                    gap-3 text-sm
                                ">
                                    <span className="text-slate-500">
                                        Price after discount
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {formatMoney(
                                            summary.amountAfterProductDiscount
                                        )}
                                    </span>
                                </div>

                                {summary.couponDiscount > 0 && (
                                    <div className="
                                        flex items-center justify-between
                                        gap-3 text-sm
                                    ">
                                        <span className="text-slate-500">
                                            Coupon discount
                                        </span>
                                        <span className="font-semibold text-amber-600">
                                            - {formatMoney(
                                                summary.couponDiscount
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div className="
                                    flex items-center justify-between
                                    gap-3 border-t border-blue-100
                                    pt-3
                                ">
                                    <span className="
                                        text-base font-bold text-slate-800
                                    ">
                                        Net Paid
                                    </span>

                                    <span className="
                                        text-lg font-extrabold
                                        text-blue-700
                                    ">
                                        {formatMoney(summary.netPaid)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="
                            mt-5 flex flex-col gap-3
                            border-t border-blue-100 pt-4
                            sm:flex-row sm:items-center
                            sm:justify-between
                        ">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Payment Method
                                </p>
                                <p className="
                                    mt-1 text-sm font-semibold
                                    text-slate-800
                                ">
                                    {paymentMethod}
                                </p>
                            </div>

                            <div className="
                                inline-flex w-fit items-center gap-1.5
                                rounded-full bg-emerald-50
                                px-3 py-1.5 text-xs font-bold
                                text-emerald-700
                            ">
                                <CheckCircle2 size={14} />
                                {isPaid
                                    ? "Payment Completed"
                                    : paymentStatus}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(PaymentSummary);
