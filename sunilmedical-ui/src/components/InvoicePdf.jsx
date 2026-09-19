import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/*
 * InvoicePdf.jsx
 * ----------------
 * Single responsibility: generate the customer invoice PDF.
 *
 * OrderCard.jsx should call:
 *     import generateInvoicePdf from "../InvoicePdf";
 *     await generateInvoicePdf(order);
 *
 * The order model used by the current application contains:
 * order.items
 * order.grandTotal
 * order.couponDiscount
 * order.deliveryAddress
 * order.orderNumber
 * order.orderDate
 * order.paymentStatus
 *
 * Item fields used:
 * item.productName / item.name
 * item.variantName / item.modelName
 * item.quantity
 * item.price
 * item.discountAmount / item.discountPercentage
 * item.gstPercentage
 * item.finalUnitPrice / item.productFinalPrice / item.sellingPrice
 * item.itemTotal
 */

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const roundMoney = (value) =>
    Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const formatMoney = (value) =>
    `Rs. ${roundMoney(value).toFixed(2)}`;

const getQuantity = (item) =>
    Math.max(1, Math.floor(toNumber(item?.quantity) || 1));

const getGstRate = (item) =>
    Math.max(
        0,
        toNumber(
            item?.gstPercentage ??
            item?.gstRate ??
            item?.taxPercentage ??
            item?.taxRate
        )
    );

const getOriginalUnitPrice = (item) =>
    Math.max(
        0,
        toNumber(
            item?.price ??
            item?.productPrice ??
            item?.originalPrice ??
            item?.unitPrice
        )
    );

const getExplicitFinalUnitPrice = (item) => {
    const value = toNumber(
        item?.finalUnitPrice ??
        item?.productFinalPrice ??
        item?.sellingPrice ??
        item?.discountedPrice
    );

    return value > 0 ? value : 0;
};

const getProductDiscountPerUnit = (item, originalUnitPrice) => {
    const quantity = getQuantity(item);

    const discountAmount = toNumber(
        item?.discountAmount ??
        item?.productDiscountAmount
    );

    if (discountAmount > 0) {
        return Math.max(0, discountAmount / quantity);
    }

    const discountPercentage = toNumber(
        item?.discountPercentage ??
        item?.productDiscountPercentage
    );

    if (discountPercentage > 0) {
        return Math.max(
            0,
            originalUnitPrice * discountPercentage / 100
        );
    }

    return 0;
};

const getFinalUnitPrice = (item) => {
    const original = getOriginalUnitPrice(item);
    const explicitFinal = getExplicitFinalUnitPrice(item);

    if (
        explicitFinal > 0 &&
        explicitFinal <= original
    ) {
        return roundMoney(explicitFinal);
    }

    const discount = getProductDiscountPerUnit(
        item,
        original
    );

    return roundMoney(
        Math.max(0, original - discount)
    );
};

const getProductDisplayName = (item) => {
    const productName =
        item?.productName ??
        item?.name ??
        item?.product?.name ??
        "-";

    const modelName =
        item?.variantName ??
        item?.modelName ??
        item?.model ??
        item?.productVariantName ??
        item?.productVariant?.name ??
        "";

    return modelName
        ? `${productName} - ${modelName}`
        : String(productName);
};

const buildInvoiceLine = (item) => {
    const quantity = getQuantity(item);
    const gstRate = getGstRate(item);

    // Product price in the application is GST-inclusive.
    const originalUnitPrice = roundMoney(
        getOriginalUnitPrice(item)
    );

    // Product discount is applied before GST extraction.
    const finalUnitPrice = roundMoney(
        getFinalUnitPrice(item)
    );

    const discountPerUnit = roundMoney(
        Math.max(
            0,
            originalUnitPrice - finalUnitPrice
        )
    );

    const originalLineTotal = roundMoney(
        originalUnitPrice * quantity
    );

    const productDiscount = roundMoney(
        discountPerUnit * quantity
    );

    const totalWithGst = roundMoney(
        finalUnitPrice * quantity
    );

    // Reverse-calculate GST from the discounted GST-inclusive amount.
    const taxableLine = roundMoney(
        gstRate > 0
            ? totalWithGst / (1 + gstRate / 100)
            : totalWithGst
    );

    const gstLine = roundMoney(
        Math.max(0, totalWithGst - taxableLine)
    );

    return {
        name: getProductDisplayName(item),
        quantity,
        gstRate,
        originalUnitPrice,
        finalUnitPrice,
        discountPerUnit,
        originalLineTotal,
        productDiscount,
        taxableLine,
        gstLine,
        totalWithGst,
    };
};

const getShipping = (order) =>
    Math.max(
        0,
        toNumber(
            order?.shippingAmount ??
            order?.shippingCharge ??
            order?.shippingCost ??
            order?.deliveryCharge ??
            order?.shipping
        )
    );

const getExplicitCoupon = (order) =>
    Math.max(
        0,
        toNumber(
            order?.couponDiscount ??
            order?.couponAmount ??
            order?.coupon?.discountAmount
        )
    );

const getFinalPaidAmount = (order) => {
    // grandTotal is the authoritative paid/order total in the current UI.
    const candidates = [
        order?.grandTotal,
        order?.finalPaidAmount,
        order?.paidAmount,
        order?.amountPaid,
        order?.totalAmount,
    ];

    for (const candidate of candidates) {
        const value = toNumber(candidate);
        if (value > 0) return roundMoney(value);
    }

    return 0;
};

const buildTotals = (order, lines) => {
    const productValueBeforeDiscount = roundMoney(
        lines.reduce(
            (sum, line) => sum + line.originalLineTotal,
            0
        )
    );

    const productDiscount = roundMoney(
        lines.reduce(
            (sum, line) => sum + line.productDiscount,
            0
        )
    );

    const subtotalExclGst = roundMoney(
        lines.reduce(
            (sum, line) => sum + line.taxableLine,
            0
        )
    );

    const gstAmount = roundMoney(
        lines.reduce(
            (sum, line) => sum + line.gstLine,
            0
        )
    );

    const totalWithGst = roundMoney(
        lines.reduce(
            (sum, line) => sum + line.totalWithGst,
            0
        )
    );

    const shipping = roundMoney(
        getShipping(order)
    );

    const backendFinalPaidAmount =
        getFinalPaidAmount(order);

    /*
     * If the backend has the actual paid total, derive the coupon from it.
     * This prevents the invoice from displaying a coupon that doesn't
     * reconcile with the amount actually paid.
     */
    const derivedCoupon = backendFinalPaidAmount > 0
        ? roundMoney(
            Math.max(
                0,
                totalWithGst +
                shipping -
                backendFinalPaidAmount
            )
        )
        : 0;

    const explicitCoupon = roundMoney(
        getExplicitCoupon(order)
    );

    const couponDiscount = roundMoney(
        Math.min(
            totalWithGst + shipping,
            backendFinalPaidAmount > 0
                ? derivedCoupon
                : explicitCoupon
        )
    );

    const calculatedFinalPaid = roundMoney(
        Math.max(
            0,
            totalWithGst +
            shipping -
            couponDiscount
        )
    );

    const finalPaidAmount =
        backendFinalPaidAmount > 0
            ? backendFinalPaidAmount
            : calculatedFinalPaid;

    return {
        productValueBeforeDiscount,
        productDiscount,
        subtotalExclGst,
        gstAmount,
        totalWithGst,
        shipping,
        couponDiscount,
        calculatedFinalPaid,
        finalPaidAmount,
    };
};

const addHeader = (doc, order) => {
    const pageWidth =
        doc.internal.pageSize.getWidth();

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
        `Invoice No: INV-${order?.orderNumber || order?.orderId || "-"}`,
        pageWidth - 14,
        25,
        { align: "right" }
    );

    doc.text(
        `Order ID: #${order?.orderId || "-"}`,
        pageWidth - 14,
        30,
        { align: "right" }
    );

    const dateText = order?.orderDate
        ? new Date(order.orderDate).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");

    doc.text(
        `Date: ${dateText}`,
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
};

const addAddress = (doc, order) => {
    const address =
        order?.deliveryAddress;

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
            address?.landmark,
        ]
            .filter(Boolean)
            .join(", "),
        [
            address?.city,
            address?.state,
        ]
            .filter(Boolean)
            .join(", "),
        address?.pincode
            ? `Pincode: ${address.pincode}`
            : "",
        address?.mobileNumber
            ? `Phone: ${address.mobileNumber}`
            : "",
    ].filter(Boolean);

    let y = 57;

    addressLines.forEach((line) => {
        const wrapped =
            doc.splitTextToSize(
                String(line),
                180
            );

        doc.text(
            wrapped,
            14,
            y
        );

        y +=
            wrapped.length * 4.5;
    });

    return y;
};

const addSummary = (
    doc,
    startY,
    totals
) => {
    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();

    let y = startY + 10;

    if (y > 240) {
        doc.addPage();
        y = 20;
    }

    const labelX =
        pageWidth - 90;

    const amountX =
        pageWidth - 14;

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(8.5);

    const summaryRows = [
        [
            "Product Value Before Discount",
            totals.productValueBeforeDiscount,
        ],
        [
            "Product Discount",
            -totals.productDiscount,
        ],
        [
            "Subtotal Excl. GST",
            totals.subtotalExclGst,
        ],
        [
            "GST Amount",
            totals.gstAmount,
        ],
        [
            "Total With GST",
            totals.totalWithGst,
        ],
        [
            "Shipping",
            totals.shipping,
        ],
        [
            "Coupon Discount",
            -totals.couponDiscount,
        ],
    ];

    summaryRows.forEach(
        ([label, amount]) => {
            doc.text(
                label,
                labelX,
                y
            );

            doc.text(
                formatMoney(amount),
                amountX,
                y,
                { align: "right" }
            );

            y += 5.5;
        }
    );

    doc.setDrawColor(180);

    doc.line(
        labelX,
        y - 2,
        amountX,
        y - 2
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(10);

    doc.text(
        "Final Paid Amount",
        labelX,
        y + 5
    );

    doc.text(
        formatMoney(
            totals.finalPaidAmount
        ),
        amountX,
        y + 5,
        { align: "right" }
    );

    const difference =
        roundMoney(
            totals.finalPaidAmount -
            totals.calculatedFinalPaid
        );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(7.5);

    doc.text(
        Math.abs(difference) <= 0.01
            ? "Payment calculation reconciled."
            : "Final paid amount is taken from the order total.",
        14,
        y + 15
    );

    doc.text(
        "All product prices are GST-inclusive; GST is shown separately above.",
        14,
        y + 20
    );

    doc.text(
        "This is a computer-generated invoice and does not require a signature.",
        14,
        Math.min(
            y + 32,
            pageHeight - 12
        )
    );
};

export const generateInvoicePdf = async (
    order
) => {
    if (!order?.orderId) {
        throw new Error(
            "Order ID is missing."
        );
    }

    const items =
        Array.isArray(order?.items)
            ? order.items
            : [];

    if (!items.length) {
        throw new Error(
            "No items found for this invoice."
        );
    }

    const lines =
        items.map(buildInvoiceLine);

    const totals =
        buildTotals(
            order,
            lines
        );

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();

    addHeader(
        doc,
        order
    );

    const addressEndY =
        addAddress(
            doc,
            order
        );

    const tableRows =
        lines.map((line) => [
            line.name,
            String(line.quantity),
            formatMoney(
                line.quantity > 0
                    ? line.taxableLine /
                    line.quantity
                    : 0
            ),
            `${line.gstRate.toFixed(2)}%`,
            formatMoney(
                line.gstLine
            ),
            formatMoney(
                line.totalWithGst
            ),
        ]);

    autoTable(doc, {
        startY: Math.max(
            addressEndY + 5,
            78
        ),

        margin: {
            left: 14,
            right: 14,
            bottom: 15,
        },

        head: [[
            "Product / Model",
            "Qty",
            "Price Excl. GST",
            "GST %",
            "GST Amount",
            "Total With GST",
        ]],

        body: tableRows,

        theme: "grid",

        styles: {
            font: "helvetica",
            fontSize: 7.5,
            cellPadding: 2.4,
            overflow: "linebreak",
            valign: "middle",
        },

        headStyles: {
            fontStyle: "bold",
            fontSize: 7.5,
        },

        columnStyles: {
            0: {
                cellWidth: 60,
            },
            1: {
                cellWidth: 13,
                halign: "center",
            },
            2: {
                cellWidth: 31,
                halign: "right",
            },
            3: {
                cellWidth: 18,
                halign: "right",
            },
            4: {
                cellWidth: 28,
                halign: "right",
            },
            5: {
                cellWidth: 32,
                halign: "right",
            },
        },

        didDrawPage: () => {
            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(7);

            doc.text(
                `Invoice: INV-${order?.orderNumber || order?.orderId || "-"}`,
                14,
                pageHeight - 8
            );

            doc.text(
                `Page ${doc.getNumberOfPages()}`,
                pageWidth - 14,
                pageHeight - 8,
                { align: "right" }
            );
        },
    });

    addSummary(
        doc,
        doc.lastAutoTable?.finalY || 80,
        totals
    );

    doc.save(
        `Invoice-${order?.orderNumber || order?.orderId}.pdf`
    );
};

export default generateInvoicePdf;
