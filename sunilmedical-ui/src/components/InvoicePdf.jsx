import React, { forwardRef, useMemo } from "react";

const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const money = (value) =>
    `₹${toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const roundMoney = (value) =>
    Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const getGstRate = (item) => {
    const rate = Number(
        item?.gstPercentage ??
        item?.gstRate ??
        item?.taxPercentage ??
        item?.taxRate
    );

    return Number.isFinite(rate) && rate >= 0
        ? rate
        : 0;
};

const getItems = (invoice) =>
    Array.isArray(invoice?.items)
        ? invoice.items.filter(Boolean)
        : [];

/*
 * GST-INCLUSIVE ORDER PRICING
 *
 * The customer-facing product price already includes GST.
 *
 * Final unit price:
 *   productFinalPrice / finalPrice / sellingPrice / unitPrice / price
 *
 * Original unit price:
 *   productPrice / originalPrice / mrp
 *
 * We deliberately do NOT trust itemTotal/taxableAmount/gstAmount for the
 * final line total unless they reconcile with the GST-inclusive price.
 * This prevents a taxable amount from accidentally being displayed as
 * the product total.
 */
const getFinalUnitPrice = (item) => {
    const value =
        item?.productFinalPrice ??
        item?.finalPrice ??
        item?.sellingPrice ??
        item?.unitPrice ??
        item?.price ??
        0;

    return Math.max(0, roundMoney(value));
};

const getOriginalUnitPrice = (item, finalUnitPrice) => {
    const original = toNumber(
        item?.productPrice ??
        item?.originalPrice ??
        item?.mrp ??
        item?.price ??
        finalUnitPrice
    );

    return Math.max(0, roundMoney(original));
};

const getQuantity = (item) =>
    Math.max(
        1,
        Math.floor(toNumber(item?.quantity, 1))
    );

const getProductDiscountPerUnit = (
    item,
    originalUnitPrice,
    finalUnitPrice
) => {
    const explicit = toNumber(
        item?.discountAmount ??
        item?.productDiscountAmount ??
        item?.discountPerUnit ??
        0
    );

    if (
        explicit > 0 &&
        explicit <= originalUnitPrice
    ) {
        return roundMoney(explicit);
    }

    return roundMoney(
        Math.max(
            0,
            originalUnitPrice - finalUnitPrice
        )
    );
};

/*
 * Calculates a GST-inclusive line in cents-safe 2-decimal values:
 *
 * Total = final GST-inclusive price × quantity
 * Taxable = Total / (1 + GST%)
 * GST = Total - Taxable
 *
 * We force the final GST value from Total - Taxable so:
 *
 *   Total with GST = Total
 *
 * exactly to 2 decimal places.
 */
const buildTaxBreakup = (item) => {
    const quantity = getQuantity(item);

    // finalUnitPrice is the customer's discounted product price INCLUDING GST.
    const finalUnitPrice = getFinalUnitPrice(item);

    const originalUnitPrice = getOriginalUnitPrice(
        item,
        finalUnitPrice
    );

    const productDiscountPerUnit =
        getProductDiscountPerUnit(
            item,
            originalUnitPrice,
            finalUnitPrice
        );

    const rate = getGstRate(item);

    // Exclusive GST price for ONE unit.
    const taxableUnitPrice = roundMoney(
        rate > 0
            ? finalUnitPrice / (1 + rate / 100)
            : finalUnitPrice
    );

    // GST for ONE unit.
    const gstPerUnit = roundMoney(
        Math.max(
            0,
            finalUnitPrice - taxableUnitPrice
        )
    );

    // Line totals are always unit value × quantity.
    const finalLineTotal = roundMoney(
        finalUnitPrice * quantity
    );

    const originalLineTotal = roundMoney(
        originalUnitPrice * quantity
    );

    const productDiscountTotal = roundMoney(
        Math.max(
            0,
            originalLineTotal - finalLineTotal
        )
    );

    const taxableTotal = roundMoney(
        taxableUnitPrice * quantity
    );

    /*
     * Force the GST line to reconcile:
     *
     * Total with GST = Total including GST
     */
    const gstTotal = roundMoney(
        Math.max(
            0,
            finalLineTotal - taxableTotal
        )
    );

    return {
        ...item,
        quantity,
        gstPercentage: rate,

        originalUnitPrice,
        unitPriceInclusive: finalUnitPrice,

        // Product discount is calculated against the original product price.
        productDiscountPerUnit,
        productDiscountTotal,

        originalLineTotal,
        netLineAmount: finalLineTotal,

        // Unit values for the invoice "Price Excl. GST" column.
        taxableUnitPrice,
        gstPerUnit,

        // Line values used for totals.
        taxableTotal,
        gstTotal,

        // Always GST-inclusive line total.
        lineTotal: finalLineTotal
    };
};

const getExplicitCoupon = (invoice) => {
    const candidates = [
        invoice?.couponDiscount,
        invoice?.couponDiscountAmount,
        invoice?.couponDiscountTotal,
        invoice?.couponAmount,
        invoice?.discountCouponAmount,
        invoice?.discountAmount,
        invoice?.summary?.couponDiscount,
        invoice?.summary?.couponDiscountAmount,
        invoice?.summary?.couponAmount,
        invoice?.order?.couponDiscount,
        invoice?.order?.couponDiscountAmount,
        invoice?.order?.couponAmount,
        invoice?.order?.discountCouponAmount,
        invoice?.paymentSummary?.couponDiscount,
        invoice?.paymentSummary?.couponDiscountAmount,
        invoice?.paymentSummary?.couponAmount
    ];

    for (const value of candidates) {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            const amount = Number(value);

            if (
                Number.isFinite(amount) &&
                amount > 0
            ) {
                return roundMoney(amount);
            }
        }
    }

    // 0/null is treated as "not supplied" so the actual coupon can be
    // derived from the backend final paid amount below.
    return null;
};

const getShipping = (invoice) =>
    Math.max(
        0,
        roundMoney(
            invoice?.shippingCharge ??
            invoice?.shippingAmount ??
            invoice?.deliveryCharge ??
            invoice?.summary?.delivery ??
            invoice?.summary?.shipping ??
            0
        )
    );

const InvoicePdf = forwardRef(({ invoice }, ref) => {
    if (!invoice) return null;

    /*
     * PRODUCTION GST-INCLUSIVE INVOICE
     *
     * The displayed product price is the customer price INCLUDING GST.
     *
     * Example at 18% GST:
     *
     * Customer price = ₹5,000.00
     * Taxable value  = 5000 / 1.18 = ₹4,237.29
     * GST            = 5000 - 4237.29 = ₹762.71
     * Customer pays  = ₹5,000.00
     *
     * Therefore GST is NEVER added on top of the displayed price.
     */

    const items = useMemo(() => {
        return getItems(invoice).map(buildTaxBreakup);
    }, [invoice]);

    const totals = useMemo(() => {
        const productOriginalTotal = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + item.originalLineTotal,
                0
            )
        );

        const productDiscount = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + item.productDiscountTotal,
                0
            )
        );

        /*
         * This is the actual product amount the customer pays BEFORE
         * the order-level coupon.
         */
        const productTotalInclGst = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + item.lineTotal,
                0
            )
        );

        const taxableAmount = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + item.taxableTotal,
                0
            )
        );

        const gstTotal = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + item.gstTotal,
                0
            )
        );

        /*
         * Production reconciliation:
         *
         * Product Total (Incl. GST)
         * + Shipping
         * - Final Paid Amount
         * = Coupon / Order Discount
         *
         * If the backend provides a positive coupon, we still compare it
         * with the actual final amount. The displayed invoice must tally
         * with the amount actually paid.
         */
        const explicitCoupon =
            getExplicitCoupon(invoice);

        const itemCouponDiscount = roundMoney(
            items.reduce(
                (sum, item) =>
                    sum +
                    Math.max(
                        0,
                        toNumber(
                            item?.couponDiscountAmount ??
                            item?.couponDiscount ??
                            item?.couponDiscountValue ??
                            0
                        )
                    ),
                0
            )
        );

        const backendFinalRaw =
            invoice?.finalPaidAmount ??
            invoice?.grandTotal ??
            invoice?.totalAmount ??
            invoice?.order?.finalPaidAmount ??
            invoice?.order?.grandTotal ??
            invoice?.order?.totalAmount;

        const backendFinal =
            backendFinalRaw !== undefined &&
                backendFinalRaw !== null &&
                backendFinalRaw !== ""
                ? Number(backendFinalRaw)
                : NaN;

        /*
         * Derive the actual order-level discount from the final amount.
         * This is what fixes invoices where the API exposes coupon as 0
         * or does not expose the coupon field at all.
         */
        const derivedCoupon = Number.isFinite(backendFinal)
            ? roundMoney(
                Math.max(
                    0,
                    productTotalInclGst +
                    shipping -
                    backendFinal
                )
            )
            : 0;

        /*
         * Prefer an explicit/item coupon only when it is positive.
         * If a backend final total exists, use the derived amount when it
         * differs, because the invoice must reconcile to the actual total.
         */
        let couponDiscount = 0;

        if (explicitCoupon !== null) {
            // Use the explicit coupon value supplied by the order/invoice.
            couponDiscount = explicitCoupon;
        } else if (itemCouponDiscount > 0) {
            // Fallback for APIs that store the coupon against an order item.
            couponDiscount = itemCouponDiscount;
        } else if (Number.isFinite(backendFinal)) {
            // Last-resort fallback when the coupon field is absent.
            couponDiscount = derivedCoupon;
        }

        couponDiscount = roundMoney(
            Math.max(
                0,
                Math.min(
                    couponDiscount,
                    productTotalInclGst + shipping
                )
            )
        );

        /*
         * Final payable:
         *
         * Total Incl. GST + Shipping - Coupon = Final Paid
         */
        const calculatedFinalPaid = roundMoney(
            Math.max(
                0,
                productTotalInclGst +
                shipping -
                couponDiscount
            )
        );

        /*
         * Backend final amount is used when present because it is the
         * authoritative transaction value. Coupon was derived from it,
         * therefore the visible invoice always reconciles.
         */
        const finalPaidAmount =
            Number.isFinite(backendFinal)
                ? roundMoney(backendFinal)
                : calculatedFinalPaid;

        /*
         * Total with GST must equal the product total including GST.
         */
        const taxablePlusGst = roundMoney(
            taxableAmount + gstTotal
        );

        return {
            productOriginalTotal,
            productDiscount,
            productTotalInclGst,
            taxableAmount,
            gstTotal,
            taxablePlusGst,
            couponDiscount,
            shipping,
            calculatedFinalPaid,
            finalPaidAmount
        };
    }, [items, invoice]);

    return (
        <div
            ref={ref}
            style={{
                width: "190mm",
                minHeight: "270mm",
                margin: "0 auto",
                padding: "10mm",
                boxSizing: "border-box",
                background: "#fff",
                color: "#111827",
                fontFamily:
                    "Arial, Helvetica, sans-serif",
                fontSize: "11px",
                lineHeight: 1.4
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    borderBottom:
                        "2px solid #e5e7eb",
                    paddingBottom: "14px"
                }}
            >
                <div style={{ flex: 1 }}>
                    <img
                        src={`${window.location.origin}/images/sunillogo.png`}
                        alt="Sunil Medical Products"
                        style={{
                            width: "175px",
                            height: "auto",
                            display: "block",
                            marginBottom: "7px"
                        }}
                        onError={(event) => {
                            event.currentTarget.style.display =
                                "none";
                        }}
                    />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "19px"
                        }}
                    >
                        SUNIL MEDICAL PRODUCTS
                        PVT LTD
                    </h2>

                    <div style={muted}>
                        GSTIN :{" "}
                        {invoice.companyGST ||
                            "37ABCDE1234F1Z5"}
                    </div>

                    <div style={muted}>
                        {invoice.companyAddress ||
                            "Visakhapatnam, Andhra Pradesh, India"}
                    </div>

                    <div style={muted}>
                        Phone :{" "}
                        {invoice.companyPhone ||
                            "9014060858"}
                    </div>
                </div>

                <div
                    style={{
                        minWidth: "175px",
                        textAlign: "right"
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "27px",
                            letterSpacing: "0.5px"
                        }}
                    >
                        TAX INVOICE
                    </h1>

                    <div style={{ marginTop: "9px" }}>
                        <strong>Invoice No:</strong>{" "}
                        {invoice.invoiceNumber || "-"}
                    </div>

                    <div>
                        <strong>Order ID:</strong>{" "}
                        #{invoice.orderId || "-"}
                    </div>

                    <div>
                        <strong>Date:</strong>{" "}
                        {invoice.date
                            ? new Date(
                                invoice.date
                            ).toLocaleDateString(
                                "en-IN"
                            )
                            : "-"}
                    </div>
                </div>
            </div>

            {/* CUSTOMER */}
            <div
                style={{
                    marginTop: "18px",
                    border:
                        "1px solid #dbe1e8",
                    padding: "12px 14px",
                    borderRadius: "6px"
                }}
            >
                <div
                    style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        marginBottom: "6px"
                    }}
                >
                    Bill To
                </div>

                <strong>
                    {invoice.customerName || "-"}
                </strong>

                {invoice.address && (
                    <div>{invoice.address}</div>
                )}

                <div>
                    {[
                        invoice.city,
                        invoice.state
                    ]
                        .filter(Boolean)
                        .join(", ")}
                    {invoice.pincode
                        ? ` - ${invoice.pincode}`
                        : ""}
                </div>

                {invoice.phone && (
                    <div>{invoice.phone}</div>
                )}
            </div>

            {/* ITEMS */}
            <table
                style={{
                    width: "100%",
                    marginTop: "22px",
                    borderCollapse: "collapse",
                    tableLayout: "fixed"
                }}
            >
                <thead>
                    <tr
                        style={{
                            background: "#111827",
                            color: "#fff"
                        }}
                    >
                        <th style={thProduct}>
                            Product
                        </th>
                        <th style={th}>
                            Qty
                        </th>
                        <th style={th}>
                            Price Excl. GST
                        </th>
                        <th style={th}>
                            GST %
                        </th>
                        <th style={th}>
                            GST Amount
                        </th>
                        <th style={th}>
                            Total Incl. GST
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, index) => (
                        <tr
                            key={
                                item.orderItemId ||
                                item.productVariantId ||
                                index
                            }
                        >
                            <td style={tdProduct}>
                                <strong>
                                    {item.productName ||
                                        "-"}
                                </strong>

                                {item.variantName && (
                                    <>
                                        <br />
                                        <span
                                            style={{
                                                color:
                                                    "#6b7280",
                                                fontSize:
                                                    "9px"
                                            }}
                                        >
                                            {item.variantName}
                                        </span>
                                    </>
                                )}
                            </td>

                            <td style={tdCenter}>
                                {item.quantity}
                            </td>

                            <td style={tdRight}>
                                {money(
                                    item.taxableUnitPrice
                                )}
                            </td>

                            <td style={tdRight}>
                                {item.gstPercentage.toFixed(2)}%
                            </td>

                            <td style={tdRight}>
                                {money(
                                    item.gstTotal
                                )}
                            </td>

                            <td style={tdRight}>
                                {money(
                                    item.lineTotal
                                )}
                            </td>
                        </tr>
                    ))}

                    {items.length === 0 && (
                        <tr>
                            <td
                                colSpan="6"
                                style={{
                                    padding: "18px",
                                    textAlign:
                                        "center",
                                    color:
                                        "#6b7280"
                                }}
                            >
                                No invoice items
                                available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* GST NOTE */}
            <div
                style={{
                    marginTop: "10px",
                    padding: "8px 10px",
                    border:
                        "1px solid #dbeafe",
                    borderRadius: "5px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "9.5px"
                }}
            >
                Product prices shown in this invoice are after product discount and are GST-inclusive. Price Excl. GST is calculated by removing the applicable GST from the GST-inclusive selling price. Taxable Amount + GST Amount = Total Incl. GST. Coupon Discount is applied separately at order level.
            </div>

            {/* TOTALS */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "18px"
                }}
            >
                <table
                    style={{
                        width: "390px",
                        borderCollapse:
                            "collapse"
                    }}
                >
                    <tbody>
                        <tr>
                            <td style={summaryTd}>
                                Product Total (Incl. GST)
                            </td>
                            <td style={summaryValue}>
                                {money(
                                    totals.productTotalInclGst
                                )}
                            </td>
                        </tr>

                        {totals.productDiscount > 0 && (
                            <tr>
                                <td
                                    style={{
                                        ...summaryTd,
                                        color: "#047857"
                                    }}
                                >
                                    Product Discount
                                </td>

                                <td
                                    style={{
                                        ...summaryValue,
                                        color: "#047857"
                                    }}
                                >
                                    -{" "}
                                    {money(
                                        totals.productDiscount
                                    )}
                                </td>
                            </tr>
                        )}

                        <tr>
                            <td style={summaryTd}>
                                Taxable Amount (Excl. GST)
                            </td>
                            <td style={summaryValue}>
                                {money(
                                    totals.taxableAmount
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style={summaryTd}>
                                GST Amount
                            </td>
                            <td style={summaryValue}>
                                {money(
                                    totals.gstTotal
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td
                                style={{
                                    ...summaryTd,
                                    fontWeight: "700"
                                }}
                            >
                                Total with GST
                            </td>
                            <td
                                style={{
                                    ...summaryValue,
                                    fontWeight: "700"
                                }}
                            >
                                {money(
                                    totals.taxablePlusGst
                                )}
                            </td>
                        </tr>

                        {totals.shipping > 0 && (
                            <tr>
                                <td style={summaryTd}>
                                    Delivery / Shipping
                                </td>
                                <td style={summaryValue}>
                                    {money(
                                        totals.shipping
                                    )}
                                </td>
                            </tr>
                        )}

                        <tr>
                            <td
                                style={{
                                    ...summaryTd,
                                    color: "#047857",
                                    fontWeight: "700"
                                }}
                            >
                                Coupon Discount
                            </td>

                            <td
                                style={{
                                    ...summaryValue,
                                    color: "#047857",
                                    fontWeight: "700"
                                }}
                            >
                                {totals.couponDiscount > 0
                                    ? `- ${money(
                                        totals.couponDiscount
                                    )}`
                                    : money(0)}
                            </td>
                        </tr>

                        <tr>
                            <td
                                style={{
                                    padding: "10px",
                                    fontWeight: "700",
                                    borderTop:
                                        "2px solid #111827"
                                }}
                            >
                                Final Paid Amount
                            </td>

                            <td
                                style={{
                                    padding: "10px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    fontSize: "15px",
                                    borderTop:
                                        "2px solid #111827"
                                }}
                            >
                                {money(
                                    totals.finalPaidAmount
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* PAYMENT */}
            <div
                style={{
                    marginTop: "16px",
                    padding: "9px 11px",
                    border:
                        "1px solid #e5e7eb",
                    borderRadius: "5px",
                    fontSize: "9.5px"
                }}
            >
                <strong>
                    Payment Status:
                </strong>{" "}
                {invoice.paymentStatus ||
                    "Completed"}

                {invoice.paymentId && (
                    <>
                        {" | "}
                        <strong>
                            Payment ID:
                        </strong>{" "}
                        {invoice.paymentId}
                    </>
                )}
            </div>

            {/* FOOTER */}
            <div
                style={{
                    marginTop: "28px",
                    borderTop:
                        "1px solid #d1d5db",
                    paddingTop: "9px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "9.5px"
                }}
            >
                This is a computer-generated
                invoice and does not require a
                signature.
            </div>
        </div>
    );
});

const muted = {
    color: "#4b5563",
    marginTop: "3px"
};

const th = {
    border: "1px solid #d1d5db",
    padding: "7px 5px",
    textAlign: "right",
    fontSize: "8px",
    verticalAlign: "middle",
    whiteSpace: "nowrap"
};

const thProduct = {
    ...th,
    width: "34%",
    textAlign: "left"
};

const td = {
    border: "1px solid #d1d5db",
    padding: "6px 4px",
    fontSize: "8.5px",
    verticalAlign: "top"
};

const tdProduct = {
    ...td,
    width: "34%",
    wordBreak: "break-word"
};

const tdCenter = {
    ...td,
    textAlign: "center"
};

const tdRight = {
    ...td,
    textAlign: "right"
};

const summaryTd = {
    padding: "7px 9px",
    borderBottom:
        "1px solid #e5e7eb"
};

const summaryValue = {
    ...summaryTd,
    textAlign: "right"
};

export default InvoicePdf;
