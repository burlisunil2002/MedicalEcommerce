import React, { forwardRef } from "react";

const InvoicePdf = forwardRef(({ invoice }, ref) => {

    if (!invoice) return null;

    return (
        <div
            ref={ref}
            style={{
                width: "190mm",
                minHeight: "270mm",
                margin: "0 auto",
                padding: "10mm",
                background: "#fff",
                color: "#111827",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px"
            }}
        >

            {/* HEADER */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "2px solid #e5e7eb",
                    paddingBottom: "15px"
                }}
            >
                <div>

                    <img
                        src={`${window.location.origin}/images/sunillogo.png`}
                        alt="Sunil Medical Products"
                        style={{
                            width: "220px",
                            height: "auto"
                        }}
                        onError={() => console.log("Logo failed to load")}
                    />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "22px"
                        }}
                    >
                        SUNIL MEDICAL PRODUCTS PVT LTD
                    </h2>

                    <div
                        style={{
                            color: "#666",
                            marginTop: "5px"
                        }}
                    >
                        GSTIN : 37ABCDE1234F1Z5
                    </div>

                    <div
                        style={{
                            color: "#666"
                        }}
                    >
                        Visakhapatnam, Andhra Pradesh, India
                    </div>

                    <div
                        style={{
                            color: "#666"
                        }}
                    >
                        Phone : 9014060858
                    </div>

                </div>

                <div
                    style={{
                        textAlign: "right"
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "32px",
                            color: "#111827"
                        }}
                    >
                        TAX INVOICE
                    </h1>

                    <div
                        style={{
                            marginTop: "10px"
                        }}
                    >
                        <strong>
                            Invoice No:
                        </strong>
                        {" "}
                        {invoice.invoiceNumber}
                    </div>

                    <div>
                        <strong>
                            Order ID:
                        </strong>
                        {" "}
                        #{invoice.orderId}
                    </div>

                    <div>
                        <strong>
                            Date:
                        </strong>
                        {" "}
                        {new Date(
                            invoice.date
                        ).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* CUSTOMER */}

            <div
                style={{
                    marginTop: "20px",
                    border: "1px solid #ddd",
                    padding: "15px",
                    borderRadius: "6px"
                }}
            >
                <h3
                    style={{
                        marginTop: 0,
                        marginBottom: "10px"
                    }}
                >
                    Billing Address
                </h3>

                <div>
                    <strong>
                        {invoice.customerName}
                    </strong>
                </div>

                <div>
                    {invoice.address}
                </div>

                <div>
                    {invoice.city}
                    {" "}
                    -
                    {" "}
                    {invoice.pincode}
                </div>

                <div>
                    {invoice.phone}
                </div>
            </div>

            {/* ITEMS */}

            <table
                style={{
                    width: "100%",
                    marginTop: "25px",
                    borderCollapse: "collapse"
                }}
            >
                <thead>

                    <tr
                        style={{
                            background: "#f3f4f6"
                        }}
                    >
                        <th style={th}>Product</th>
                        <th style={th}>Qty</th>
                        <th style={th}>Unit Price</th>
                        <th style={th}>Taxable</th>
                        <th style={th}>GST</th>
                        <th style={th}>Total</th>
                    </tr>

                </thead>

                <tbody>

                    {invoice.items.map(
                        (item, index) => (
                            <tr key={index}>

                                <td style={td}>
                                    <strong>
                                        {item.productName}
                                    </strong>

                                    <br />

                                    <span
                                        style={{
                                            color: "#666",
                                            fontSize: "11px"
                                        }}
                                    >
                                        {item.variantName}
                                    </span>
                                </td>

                                <td style={td}>
                                    {item.quantity}
                                </td>

                                <td style={td}>
                                    ₹{(
                                        item.price -
                                        item.discountAmount
                                    ).toFixed(2)}
                                </td>

                                <td style={td}>
                                    ₹{item.taxableAmount.toFixed(2)}
                                </td>

                                <td style={td}>
                                    ₹{item.gstAmount.toFixed(2)}
                                </td>

                                <td style={td}>
                                    ₹{item.finalPaidAmount.toFixed(2)}
                                </td>

                            </tr>
                        )
                    )}

                </tbody>
            </table>

            {/* TOTALS */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "20px"
                }}
            >
                <table
                    style={{
                        width: "350px",
                        borderCollapse: "collapse"
                    }}
                >
                    <tbody>

                        <tr>
                            <td style={summaryTd}>
                                Taxable Amount
                            </td>

                            <td style={summaryTd}>
                                ₹{invoice.taxableAmount.toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td style={summaryTd}>
                                GST Amount
                            </td>

                            <td style={summaryTd}>
                                ₹{invoice.gstTotal.toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td style={summaryTd}>
                                Amount Including GST
                            </td>

                            <td style={summaryTd}>
                                ₹{(
                                    invoice.taxableAmount +
                                    invoice.gstTotal
                                ).toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td style={summaryTd}>
                                Coupon Discount
                            </td>

                            <td style={summaryTd}>
                                -₹{invoice.couponDiscount.toFixed(2)}
                            </td>
                        </tr>

                        <tr
                            style={{
                                background: "#111827",
                                color: "#fff",
                                fontWeight: "bold"
                            }}
                        >
                            <td style={summaryTd}>
                                Final Paid Amount
                            </td>

                            <td style={summaryTd}>
                                ₹{invoice.finalPaidAmount.toFixed(2)}
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>

            {/* FOOTER */}

            <div
                style={{
                    marginTop: "40px",
                    borderTop: "1px solid #ddd",
                    paddingTop: "10px",
                    textAlign: "center",
                    color: "#666"
                }}
            >
                This is a computer-generated invoice and does not require a signature.
            </div>

        </div>
    );
});

const th = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
    fontSize: "12px"
};

const td = {
    border: "1px solid #ddd",
    padding: "10px",
    fontSize: "12px"
};

const summaryTd = {
    padding: "10px",
    borderBottom: "1px solid #ddd"
};

export default InvoicePdf;