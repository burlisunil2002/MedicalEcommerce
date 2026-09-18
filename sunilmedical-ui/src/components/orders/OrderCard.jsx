import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    ChevronDown,
    ChevronUp,
    Calendar,
    Receipt,
    PackageCheck,
    CircleDollarSign,
    MapPin,
    Phone,
    User,
    LifeBuoy
} from "lucide-react";

import OrderItems from "./OrderItems";
import PaymentSummary from "./PaymentSummary";


const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const money = (value) => `Rs. ${num(value).toFixed(2)}`;

const getGstRate = (item) =>
    Math.max(
        0,
        num(
            item?.gstPercentage ??
            item?.gstRate ??
            item?.taxPercentage ??
            item?.taxRate
        )
    );

const getTaxable = (item) => {
    const stored = Number(item?.taxableAmount);

    if (Number.isFinite(stored) && stored >= 0) {
        return stored;
    }

    const quantity = Math.max(1, num(item?.quantity));
    const inclusiveLine =
        Math.max(
            0,
            num(item?.price) - num(item?.discountAmount)
        ) * quantity;

    const rate = getGstRate(item);

    return rate > 0
        ? inclusiveLine / (1 + rate / 100)
        : inclusiveLine;
};

const getGst = (item) => {
    const stored = Number(item?.gstAmount);

    if (Number.isFinite(stored) && stored >= 0) {
        return stored;
    }

    return getTaxable(item) * getGstRate(item) / 100;
};

const getLineTotal = (item) => {
    const stored = Number(item?.itemTotal);

    if (Number.isFinite(stored) && stored >= 0) {
        return stored;
    }

    const finalPaid = Number(item?.finalPaidAmount);

    if (Number.isFinite(finalPaid) && finalPaid >= 0) {
        return finalPaid;
    }

    return (
        Math.max(
            0,
            num(item?.price) - num(item?.discountAmount)
        ) *
        Math.max(1, num(item?.quantity))
    );
};

export default function OrderCard({

    order,

    overallStatus,

    onInvoice,

    onTrack,

    onCancel,

    onReturn,

    onReview,

    onBuyAgain,

    onHelp

}) {

    const [expanded, setExpanded] = useState(true);
    const [downloading, setDownloading] = useState(false);

    //---------------------------------------------------
    // STATUS BADGE
    //---------------------------------------------------

    const getStatusBadge = () => {

        switch (overallStatus) {

            case "Delivered":

                return "bg-emerald-100 text-emerald-700";

            case "Out For Delivery":

                return "bg-orange-100 text-orange-700";

            case "Shipped":

                return "bg-blue-100 text-blue-700";

            case "Packed":

                return "bg-indigo-100 text-indigo-700";

            case "Cancelled":

                return "bg-red-100 text-red-700";

            default:

                return "bg-amber-100 text-amber-700";

        }

    };

    const downloadInvoice = () => {
        const orderId = order?.orderId;

        if (!orderId || downloading) {
            return;
        }

        setDownloading(true);

        // Let React paint "Preparing Invoice..." before doing
        // synchronous PDF work on the main thread.
        window.requestAnimationFrame(() => {
            try {
                const items = Array.isArray(order?.items)
                    ? order.items
                    : [];

                if (!items.length) {
                    throw new Error(
                        "No items found for this invoice."
                    );
                }

                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                    compress: true
                });

                const pageWidth =
                    doc.internal.pageSize.getWidth();

                const pageHeight =
                    doc.internal.pageSize.getHeight();

                // -------------------------------
                // HEADER
                // -------------------------------
                doc.setFont("helvetica", "bold");
                doc.setFontSize(17);

                doc.text(
                    "SUNIL MEDICAL PRODUCTS PVT LTD",
                    14,
                    18
                );

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);

                doc.text(
                    "GSTIN: 37ABCDE1234F1Z5",
                    14,
                    24
                );

                doc.text(
                    "Visakhapatnam, Andhra Pradesh, India",
                    14,
                    29
                );

                doc.text(
                    "Phone: 9014060858",
                    14,
                    34
                );

                doc.setFont("helvetica", "bold");
                doc.setFontSize(21);

                doc.text(
                    "TAX INVOICE",
                    pageWidth - 14,
                    18,
                    { align: "right" }
                );

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);

                doc.text(
                    `Invoice No: INV-${order.orderNumber || orderId}`,
                    pageWidth - 14,
                    25,
                    { align: "right" }
                );

                doc.text(
                    `Order ID: #${orderId}`,
                    pageWidth - 14,
                    30,
                    { align: "right" }
                );

                doc.text(
                    `Date: ${order.orderDate
                        ? new Date(
                            order.orderDate
                        ).toLocaleDateString("en-IN")
                        : new Date().toLocaleDateString("en-IN")
                    }`,
                    pageWidth - 14,
                    35,
                    { align: "right" }
                );

                doc.setDrawColor(210);
                doc.line(
                    14,
                    40,
                    pageWidth - 14,
                    40
                );

                // -------------------------------
                // CUSTOMER
                // -------------------------------
                const address =
                    order.deliveryAddress;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);

                doc.text(
                    "BILLING / DELIVERY ADDRESS",
                    14,
                    50
                );

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);

                const addressLines = [
                    address?.fullName,
                    [
                        address?.addressLine1,
                        address?.addressLine2,
                        address?.landmark
                    ]
                        .filter(Boolean)
                        .join(", "),
                    [
                        address?.city,
                        address?.state
                    ]
                        .filter(Boolean)
                        .join(", "),
                    address?.pincode
                        ? `Pincode: ${address.pincode}`
                        : "",
                    address?.mobileNumber
                        ? `Phone: ${address.mobileNumber}`
                        : ""
                ].filter(Boolean);

                let customerY = 57;

                addressLines.forEach((line) => {
                    const wrapped =
                        doc.splitTextToSize(
                            String(line),
                            180
                        );

                    doc.text(
                        wrapped,
                        14,
                        customerY
                    );

                    customerY +=
                        wrapped.length * 4.5;
                });

                // -------------------------------
                // ITEMS
                // -------------------------------
                const rows = items.map((item) => {
                    const quantity =
                        Math.max(
                            1,
                            num(item?.quantity)
                        );

                    const unitPrice =
                        Math.max(
                            0,
                            num(item?.price) -
                            num(item?.discountAmount)
                        );

                    return [
                        `${item?.productName || ""}${item?.variantName
                            ? `\n${item.variantName}`
                            : ""
                        }`,
                        String(quantity),
                        money(unitPrice),
                        `${getGstRate(item).toFixed(2)}%`,
                        money(getTaxable(item)),
                        money(getGst(item)),
                        money(getLineTotal(item))
                    ];
                });

                autoTable(doc, {
                    startY: Math.max(
                        customerY + 5,
                        78
                    ),
                    margin: {
                        left: 14,
                        right: 14
                    },
                    head: [[
                        "Product",
                        "Qty",
                        "Price Incl. GST",
                        "GST %",
                        "Taxable",
                        "GST",
                        "Total"
                    ]],
                    body: rows,
                    theme: "grid",
                    styles: {
                        font: "helvetica",
                        fontSize: 7.5,
                        cellPadding: 2.4,
                        overflow: "linebreak",
                        valign: "middle"
                    },
                    headStyles: {
                        fontStyle: "bold",
                        fontSize: 7.5
                    },
                    columnStyles: {
                        0: { cellWidth: 57 },
                        1: {
                            cellWidth: 13,
                            halign: "center"
                        },
                        2: {
                            cellWidth: 27,
                            halign: "right"
                        },
                        3: {
                            cellWidth: 18,
                            halign: "right"
                        },
                        4: {
                            cellWidth: 27,
                            halign: "right"
                        },
                        5: {
                            cellWidth: 25,
                            halign: "right"
                        },
                        6: {
                            cellWidth: 27,
                            halign: "right"
                        }
                    },
                    didDrawPage: () => {
                        doc.setFont(
                            "helvetica",
                            "normal"
                        );
                        doc.setFontSize(7);

                        doc.text(
                            `Invoice: INV-${order.orderNumber || orderId}`,
                            14,
                            pageHeight - 8
                        );

                        doc.text(
                            `Page ${doc.getNumberOfPages()}`,
                            pageWidth - 14,
                            pageHeight - 8,
                            { align: "right" }
                        );
                    }
                });

                // -------------------------------
                // TOTALS
                // -------------------------------
                let y =
                    (doc.lastAutoTable?.finalY || 80) +
                    10;

                if (y > 245) {
                    doc.addPage();
                    y = 20;
                }

                const taxableTotal =
                    items.reduce(
                        (sum, item) =>
                            sum + getTaxable(item),
                        0
                    );

                const gstTotal =
                    items.reduce(
                        (sum, item) =>
                            sum + getGst(item),
                        0
                    );

                const itemTotal =
                    items.reduce(
                        (sum, item) =>
                            sum + getLineTotal(item),
                        0
                    );

                const coupon =
                    Math.max(
                        0,
                        num(order?.couponDiscount)
                    );

                const finalPaid =
                    num(order?.grandTotal) ||
                    Math.max(
                        0,
                        itemTotal - coupon
                    );

                const summaryX =
                    pageWidth - 88;

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(8.5);

                [
                    [
                        "Taxable Amount",
                        taxableTotal
                    ],
                    [
                        "GST Amount",
                        gstTotal
                    ],
                    [
                        "Amount Including GST",
                        taxableTotal + gstTotal
                    ],
                    [
                        "Coupon Discount",
                        -coupon
                    ]
                ].forEach(([label, value]) => {
                    doc.text(
                        label,
                        summaryX,
                        y
                    );

                    doc.text(
                        money(value),
                        pageWidth - 14,
                        y,
                        { align: "right" }
                    );

                    y += 5.5;
                });

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.text(
                    "Final Paid Amount",
                    summaryX,
                    y + 2
                );

                doc.text(
                    money(finalPaid),
                    pageWidth - 14,
                    y + 2,
                    { align: "right" }
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(7.5);

                doc.text(
                    "All product prices are inclusive of applicable GST.",
                    14,
                    y + 16
                );

                if (order?.paymentStatus) {
                    doc.text(
                        `Payment Status: ${order.paymentStatus}`,
                        14,
                        y + 21
                    );
                }

                doc.text(
                    "This is a computer-generated invoice and does not require a signature.",
                    14,
                    Math.min(
                        y + 32,
                        pageHeight - 12
                    )
                );

                doc.save(
                    `Invoice-${order.orderNumber || orderId}.pdf`
                );
            } catch (error) {
                console.error(
                    "Invoice download failed:",
                    error
                );

                alert(
                    error?.message ||
                    "Unable to generate invoice. Please try again."
                );
            } finally {
                setDownloading(false);
            }
        });
    };

    //---------------------------------------------------

    return (

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

            {/*=================================================
                            HEADER
            =================================================*/}

            <div

                className="cursor-pointer p-6"

                onClick={() => setExpanded(!expanded)}

            >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    {/* LEFT */}

                    <div>

                        <div className="flex items-center gap-3 flex-wrap">

                            <h2 className="text-xl font-bold text-slate-800">

                                {order.orderNumber}

                            </h2>

                            <span

                                className={`

                                    px-3 py-1

                                    rounded-full

                                    text-xs

                                    font-semibold

                                    ${getStatusBadge()}

                                `}

                            >

                                {overallStatus}

                            </span>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">

                            <div className="flex items-center gap-2">

                                <Calendar size={18} />

                                {new Date(order.orderDate)
                                    .toLocaleDateString()}

                            </div>

                            <div className="flex items-center gap-2">

                                <PackageCheck size={18} />

                                {order.itemCount} Items

                            </div>

                            <div className="flex items-center gap-2">

                                <CircleDollarSign size={18} />

                                ₹{order.grandTotal.toLocaleString()}

                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-3 flex-wrap">

                        <button

                            className="rounded-full p-3 hover:bg-slate-100"

                        >

                            {

                                expanded

                                    ?

                                    <ChevronUp size={22} />

                                    :

                                    <ChevronDown size={22} />

                            }

                        </button>

                    </div>

                </div>

            </div>

            {/*=================================================
                    EXPANDABLE SECTION
            =================================================*/}

            {

                expanded && (

                    <>

                        {/*=================================================
        DELIVERY ADDRESS
=================================================*/}

                        <div className="border-t px-6 py-5 bg-slate-50">

                            <div className="flex items-center gap-3 mb-5">

                                <MapPin
                                    className="text-blue-600"
                                    size={22}
                                />

                                <h3 className="font-semibold text-lg">

                                    Delivery Address

                                </h3>

                            </div>

                            <div className="grid lg:grid-cols-2 gap-5">

                                {/* Customer */}

                                <div className="rounded-2xl bg-white border border-slate-200 p-5">

                                    <div className="flex items-center gap-2 mb-4">

                                        <User
                                            size={18}
                                            className="text-emerald-600"
                                        />

                                        <span className="font-semibold">

                                            Customer Details

                                        </span>

                                    </div>

                                    <div className="space-y-2">

                                        <p className="font-semibold text-slate-800">

                                            {order.deliveryAddress?.fullName || "-"}

                                        </p>

                                        <p className="text-slate-600 flex items-center gap-2">

                                            <Phone size={16} />

                                            {order.deliveryAddress?.mobileNumber || "-"}

                                        </p>

                                    </div>

                                </div>

                                {/* Address */}

                                <div className="rounded-2xl bg-white border border-slate-200 p-5">

                                    <div className="flex items-center justify-between mb-4">

                                        <span className="font-semibold">

                                            Shipping Address

                                        </span>

                                        {order.deliveryAddress?.addressType && (

                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">

                                                {order.deliveryAddress.addressType}

                                            </span>

                                        )}

                                    </div>

                                    {order.deliveryAddress ? (

                                        <>

                                            <p className="text-slate-700">

                                                {order.deliveryAddress.addressLine1}

                                            </p>

                                            {order.deliveryAddress.addressLine2 && (

                                                <p className="text-slate-700 mt-1">

                                                    {order.deliveryAddress.addressLine2}

                                                </p>

                                            )}

                                            {order.deliveryAddress.landmark && (

                                                <p className="text-slate-500 mt-2">

                                                    <strong>Landmark:</strong>{" "}

                                                    {order.deliveryAddress.landmark}

                                                </p>

                                            )}

                                            <p className="mt-2 text-slate-700">

                                                {order.deliveryAddress.city},

                                                {" "}

                                                {order.deliveryAddress.state}

                                                {" - "}

                                                {order.deliveryAddress.pincode}

                                            </p>

                                        </>

                                    ) : (

                                        <p className="text-slate-500">

                                            Delivery address not available.

                                        </p>

                                    )}

                                </div>

                            </div>

                        </div>


                        {/*=================================================
                                ORDER ITEMS
                        =================================================*/}

                        <div className="px-6 py-6">

                            <div className="flex items-center justify-between mb-6">

                                <div>

                                    <h3 className="text-xl font-bold text-slate-800">

                                        Ordered Items

                                    </h3>

                                    <p className="text-slate-500 text-sm mt-1">

                                        {order.itemCount} item(s) in this order

                                    </p>

                                </div>

                                <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">

                                    <PackageCheck size={18} />

                                    {overallStatus}

                                </div>

                            </div>

                            <OrderItems

                                items={order.items}

                                overallStatus={overallStatus}

                                onTrack={onTrack}

                                onCancel={onCancel}

                                onReturn={onReturn}

                                onReview={onReview}

                                onBuyAgain={onBuyAgain}

                                order={order}

                            />

                        </div>

                        {/*=================================================
                                PAYMENT SUMMARY
                        =================================================*/}

                        <div className="border-t bg-slate-50">

                            <PaymentSummary

                                order={order}

                            />

                        </div>

                        {/*=================================================
                                FOOTER
                        =================================================*/}

                        <div className="border-t bg-white px-6 py-5">

                            <div className="flex flex-wrap justify-between items-center gap-4">

                                {/* LEFT */}

                                <div>

                                    <h4 className="font-semibold text-slate-800">

                                        Payment Status

                                    </h4>

                                    <p className="mt-1 text-slate-600">

                                        {order.paymentStatus}

                                    </p>

                                </div>

                                {/* RIGHT */}

                                <div className="flex flex-wrap gap-3">

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadInvoice();
                                        }}
                                        disabled={downloading}
                                        className="
        inline-flex items-center justify-center gap-2
        rounded-xl
        bg-blue-600
        px-5 py-3
        font-semibold text-white
        transition
        hover:bg-blue-700
        disabled:cursor-not-allowed
        disabled:opacity-60
    "
                                    >
                                        {downloading ? (
                                            <>
                                                <span
                                                    className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                "
                                                />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Receipt size={18} />
                                                Download Invoice
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onHelp}

                                        className="rounded-xl border px-5 py-3 hover:bg-slate-100"

                                    >

                                        Need Help

                                    </button>

                                </div>

                            </div>

                        </div>


                    </>

                )

            }

        </div>



    );

}