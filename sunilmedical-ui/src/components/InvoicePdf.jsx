import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


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
    /*
     * IMPORTANT:
     * In the current OrderController, DiscountAmount is stored PER UNIT.
     * Therefore we must NOT divide DiscountAmount by quantity here.
     * The total product discount is calculated later as:
     *
     *   discountPerUnit × quantity
     */
    const storedDiscountPerUnit = toNumber(
        item?.discountAmount ??
        item?.productDiscountAmount
    );

    if (storedDiscountPerUnit > 0) {
        return Math.min(
            originalUnitPrice,
            roundMoney(storedDiscountPerUnit)
        );
    }

    const discountPercentage = toNumber(
        item?.discountPercentage ??
        item?.productDiscountPercentage
    );

    if (discountPercentage > 0) {
        return Math.min(
            originalUnitPrice,
            roundMoney(
                originalUnitPrice *
                discountPercentage /
                100
            )
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

    // Product prices in the application are GST-inclusive.
    const originalUnitPrice = roundMoney(
        getOriginalUnitPrice(item)
    );

    // DiscountAmount from the backend is PER UNIT.
    const discountPerUnit = roundMoney(
        getProductDiscountPerUnit(
            item,
            originalUnitPrice
        )
    );

    const finalUnitPrice = roundMoney(
        Math.max(
            0,
            originalUnitPrice - discountPerUnit
        )
    );

    const originalLineTotal = roundMoney(
        originalUnitPrice * quantity
    );

    // Product discount is a LINE total here.
    const productDiscount = roundMoney(
        discountPerUnit * quantity
    );

    // GST-inclusive amount after PRODUCT discount,
    // but BEFORE the order-level coupon.
    const totalBeforeCoupon = roundMoney(
        finalUnitPrice * quantity
    );

    const taxableBeforeCoupon = roundMoney(
        gstRate > 0
            ? totalBeforeCoupon /
            (1 + gstRate / 100)
            : totalBeforeCoupon
    );

    const gstBeforeCoupon = roundMoney(
        Math.max(
            0,
            totalBeforeCoupon -
            taxableBeforeCoupon
        )
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
        taxableBeforeCoupon,
        gstBeforeCoupon,
        totalBeforeCoupon,

        // Filled by applyCouponToLines().
        couponDiscount: 0,
        taxableLine: taxableBeforeCoupon,
        gstLine: gstBeforeCoupon,
        totalWithGst: totalBeforeCoupon,
        finalPaidAmount: totalBeforeCoupon
    };
};

const applyCouponToLines = (lines, couponDiscount) => {
    const safeCoupon = Math.max(
        0,
        roundMoney(couponDiscount)
    );

    const totalBeforeCoupon = roundMoney(
        lines.reduce(
            (sum, line) =>
                sum + line.totalBeforeCoupon,
            0
        )
    );

    if (
        safeCoupon <= 0 ||
        totalBeforeCoupon <= 0 ||
        !lines.length
    ) {
        return lines.map((line) => ({
            ...line,
            couponDiscount: 0,
            taxableLine: line.taxableBeforeCoupon,
            gstLine: line.gstBeforeCoupon,
            totalWithGst: line.totalBeforeCoupon,
            finalPaidAmount: line.totalBeforeCoupon
        }));
    }

    const couponToAllocate = Math.min(
        safeCoupon,
        totalBeforeCoupon
    );

    let allocatedCoupon = 0;

    return lines.map((line, index) => {
        const isLast =
            index === lines.length - 1;

        let lineCoupon;

        if (isLast) {
            // Give the rounding remainder to the last item.
            lineCoupon = roundMoney(
                couponToAllocate -
                allocatedCoupon
            );
        } else {
            lineCoupon = roundMoney(
                couponToAllocate *
                line.totalBeforeCoupon /
                totalBeforeCoupon
            );
        }

        lineCoupon = Math.max(
            0,
            Math.min(
                lineCoupon,
                line.totalBeforeCoupon
            )
        );

        allocatedCoupon = roundMoney(
            allocatedCoupon + lineCoupon
        );

        const finalPaidAmount = roundMoney(
            Math.max(
                0,
                line.totalBeforeCoupon -
                lineCoupon
            )
        );

        // GST is extracted from the FINAL GST-inclusive
        // amount after coupon.
        const taxableLine = roundMoney(
            line.gstRate > 0
                ? finalPaidAmount /
                (1 + line.gstRate / 100)
                : finalPaidAmount
        );

        const gstLine = roundMoney(
            Math.max(
                0,
                finalPaidAmount -
                taxableLine
            )
        );

        return {
            ...line,
            couponDiscount: lineCoupon,
            taxableLine,
            gstLine,
            totalWithGst: line.totalBeforeCoupon,
            finalPaidAmount
        };
    });
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
            (sum, line) =>
                sum + line.originalLineTotal,
            0
        )
    );

    const productDiscount = roundMoney(
        lines.reduce(
            (sum, line) =>
                sum + line.productDiscount,
            0
        )
    );

    // GST-exclusive amount AFTER product discount and coupon.
    const subtotalExclGst = roundMoney(
        lines.reduce(
            (sum, line) =>
                sum + line.taxableLine,
            0
        )
    );

    const gstAmount = roundMoney(
        lines.reduce(
            (sum, line) =>
                sum + line.gstLine,
            0
        )
    );

    // Product amount after product discount, before coupon.
    const totalWithGst = roundMoney(
        lines.reduce(
            (sum, line) =>
                sum + line.totalBeforeCoupon,
            0
        )
    );

    const shipping = roundMoney(
        getShipping(order)
    );

    const backendFinalPaidAmount =
        getFinalPaidAmount(order);

    const explicitCoupon = roundMoney(
        getExplicitCoupon(order)
    );

    /*
     * Prefer the coupon stored on the order.
     * If it is unavailable, derive it from the authoritative
     * backend final amount.
     */
    const derivedCoupon =
        backendFinalPaidAmount > 0
            ? roundMoney(
                Math.max(
                    0,
                    totalWithGst +
                    shipping -
                    backendFinalPaidAmount
                )
            )
            : 0;

    const couponDiscount = roundMoney(
        Math.min(
            totalWithGst,
            explicitCoupon > 0
                ? explicitCoupon
                : derivedCoupon
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
        finalPaidAmount
    };
};

const addHeader = (doc, order) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const rightX = pageWidth - margin;
    const leftWidth = 112;
    const rightWidth = 62;

    const invoiceNo =
        order?.invoiceNumber ??
        order?.taxInvoiceNumber ??
        `INV-${order?.orderNumber || order?.orderId || "-"}`;

    const invoiceDate = order?.invoiceDate ?? order?.issuedAt ?? order?.orderDate;
    const dateText = invoiceDate
        ? new Date(invoiceDate).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");

    // Seller identity block: wrap long legal name/address instead of allowing overlap.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const companyLines = doc.splitTextToSize(
        "JEDE MEDTECH INDIA PRIVATE LIMITED",
        leftWidth
    );
    doc.text(companyLines, margin, 17);

    let sellerY = 17 + companyLines.length * 5.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    [
        "GSTIN: 37AKLPA6711H1ZA",
        "480/2, AMTZ CAMPUS, Pragathi Maiden, Visakhapatnam Steel Plant, Pedagantyada, Visakhapatnam, Andhra Pradesh, India",
        "Phone: 6301427306, 9390630297"
    ].forEach((value) => {
        const wrapped = doc.splitTextToSize(value, leftWidth);
        doc.text(wrapped, margin, sellerY);
        sellerY += wrapped.length * 3.8 + 1;
    });

    // Invoice metadata is right-aligned in its own fixed-width column.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("TAX INVOICE", rightX, 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const meta = [
        `Invoice No: ${invoiceNo}`,
        `Order ID: #${order?.orderId || "-"}`,
        `Date: ${dateText}`,
        order?.placeOfSupply ? `Place of Supply: ${order.placeOfSupply}` : null
    ].filter(Boolean);

    let metaY = 25;
    meta.forEach((value) => {
        const wrapped = doc.splitTextToSize(value, rightWidth);
        doc.text(wrapped, rightX, metaY, { align: "right" });
        metaY += wrapped.length * 3.8 + 1;
    });

    const dividerY = Math.max(sellerY, metaY) + 2;
    doc.setDrawColor(205);
    doc.setLineWidth(0.35);
    doc.line(margin, dividerY, rightX, dividerY);
    return dividerY;
};

const addAddress = (doc, order, startY = 48) => {
    const address = order?.deliveryAddress ?? order?.billingAddress ?? {};
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const gap = 8;
    const colWidth = (pageWidth - margin * 2 - gap) / 2;
    const leftX = margin;
    const rightX = margin + colWidth + gap;

    const buyerName =
        address?.fullName ??
        order?.customerName ??
        order?.userName ??
        order?.customer?.name ??
        "-";

    const addressLines = [
        buyerName,
        address?.companyName,
        [address?.addressLine1, address?.addressLine2, address?.landmark]
            .filter(Boolean).join(", "),
        [address?.city, address?.district, address?.state, address?.pincode]
            .filter(Boolean).join(", "),
        address?.country ?? "India",
        address?.mobileNumber || address?.phone
            ? `Phone: ${address.mobileNumber ?? address.phone}` : null,
        address?.email || order?.customerEmail
            ? `Email: ${address.email ?? order.customerEmail}` : null,
        address?.gstin ? `GSTIN: ${address.gstin}` : null
    ].filter((value) => value !== null && value !== undefined && String(value).trim());

    const drawBlock = (heading, lines, x, width) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(heading, x, startY);

        let y = startY + 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        lines.forEach((value, index) => {
            const wrapped = doc.splitTextToSize(String(value), width);
            if (index === 0) doc.setFont("helvetica", "bold");
            else doc.setFont("helvetica", "normal");
            doc.text(wrapped, x, y);
            y += wrapped.length * 3.8 + 1;
        });
        return y;
    };

    const buyerEndY = drawBlock(
        "BILL TO / SHIP TO",
        addressLines.length ? addressLines : ["Address details not provided"],
        leftX,
        colWidth
    );

    const sellerTaxLines = [
        "JEDE MEDTECH INDIA PRIVATE LIMITED",
        "GSTIN: 37AKLPA6711H1ZA",
        "Andhra Pradesh, India",
        order?.placeOfSupply ? `Place of Supply: ${order.placeOfSupply}` : null
    ].filter(Boolean);

    const sellerEndY = drawBlock(
        "SUPPLIER DETAILS",
        sellerTaxLines,
        rightX,
        colWidth
    );

    const bottomY = Math.max(buyerEndY, sellerEndY);
    doc.setDrawColor(225);
    doc.line(margin, bottomY + 1, pageWidth - margin, bottomY + 1);
    return bottomY + 2;
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
            "Net Subtotal Excl. GST",
            totals.subtotalExclGst,
        ],
        [
            "GST Amount",
            totals.gstAmount,
        ],
        [
            "Discounted Product Value",
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

    const netProductAmount =
        roundMoney(
            totals.subtotalExclGst +
            totals.gstAmount
        );

    const productReconciliationDifference =
        roundMoney(
            netProductAmount -
            (
                totals.totalWithGst -
                totals.couponDiscount
            )
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
        Math.abs(productReconciliationDifference) <= 0.01 &&
            Math.abs(difference) <= 0.01
            ? "Payment and GST calculation reconciled."
            : "Final paid amount is taken from the order total; review reconciliation.",
        14,
        y + 15
    );

    doc.text(
        "Audit reconciliation: Net Subtotal Excl. GST + GST Amount = Final Product Amount After Coupon.",
        14,
        y + 20
    );

    doc.text(
        "Discounted Product Value - Coupon Discount = Final Paid Product Amount; shipping is added separately.",
        14,
        y + 24.5
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

    const rawLines =
        items.map(buildInvoiceLine);

    /*
     * Coupon is an ORDER-level discount.
     * Allocate it proportionally across discounted
     * GST-inclusive product lines. The last line receives
     * the rounding remainder so all item coupon amounts
     * add up exactly to the order coupon.
     */
    const explicitCoupon = getExplicitCoupon(order);

    const backendFinalPaidAmount =
        getFinalPaidAmount(order);

    const rawProductTotal = roundMoney(
        rawLines.reduce(
            (sum, line) =>
                sum + line.totalBeforeCoupon,
            0
        )
    );

    const shipping = getShipping(order);

    const derivedCoupon =
        backendFinalPaidAmount > 0
            ? roundMoney(
                Math.max(
                    0,
                    rawProductTotal +
                    shipping -
                    backendFinalPaidAmount
                )
            )
            : 0;

    const couponDiscount = Math.min(
        rawProductTotal,
        explicitCoupon > 0
            ? explicitCoupon
            : derivedCoupon
    );

    const lines = applyCouponToLines(
        rawLines,
        couponDiscount
    );

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

    const headerEndY = addHeader(doc, order);

    const addressEndY = addAddress(
        doc,
        order,
        headerEndY + 7
    );

    const tableRows =
        lines.map((line) => [
            line.name,
            String(line.quantity),

            // FINAL taxable unit price after product discount
            // and coupon allocation.
            formatMoney(
                line.quantity > 0
                    ? line.taxableLine /
                    line.quantity
                    : 0
            ),

            `${line.gstRate.toFixed(2)}%`,

            // GST contained in the FINAL paid amount
            // after product discount + coupon.
            formatMoney(line.gstLine),

            // Order-level coupon allocated to this item.
            formatMoney(line.couponDiscount),

            // Actual amount paid for this item.
            formatMoney(line.finalPaidAmount)
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
            "Final Price Excl. GST",
            "GST %",
            "GST Amount",
            "Coupon Discount",
            "Final Paid",
        ]],

        body: tableRows,

        theme: "grid",
        tableWidth: "auto",
        showHead: "everyPage",

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
                cellWidth: 43,
            },
            1: {
                cellWidth: 10,
                halign: "center",
            },
            2: {
                cellWidth: 27,
                halign: "right",
            },
            3: {
                cellWidth: 13,
                halign: "right",
            },
            4: {
                cellWidth: 24,
                halign: "right",
            },
            5: {
                cellWidth: 29,
                halign: "right",
            },
            6: {
                cellWidth: 36,
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
