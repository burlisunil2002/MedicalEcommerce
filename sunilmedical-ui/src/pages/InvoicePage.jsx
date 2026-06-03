import React, { useEffect, useState } from "react";
import API from "../api";

export default function InvoicePage() {
    const orderId =
        window.location.pathname.split("/").pop();

    const [invoice, setInvoice] =
        useState(null);

    useEffect(() => {
        loadInvoice();
    }, []);

    const loadInvoice = async () => {
        const res = await API.get(
            `/ api / order / invoice / ${ orderId } `
        );

        if (res.data.success) {
            setInvoice(res.data.invoice);
        }
    };

    if (!invoice)
        return (
            <div className="p-10 text-center">
                Loading Invoice...
            </div>
        );

    return (
        <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-3xl p-10 my-8">

            {/* Header */}

            <div className="flex justify-between items-start border-b pb-8">

                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        TAX INVOICE
                    </h1>

                    <p className="mt-3 text-gray-600">
                        Invoice No :
                        {invoice.invoiceNumber}
                    </p>

                    <p className="text-gray-600">
                        Date :
                        {new Date(
                            invoice.date
                        ).toLocaleDateString()}
                    </p>

                    <p className="text-gray-600">
                        Order Id :
                        #{invoice.orderId}
                    </p>
                </div>

                <div className="text-right">

                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-40 md:h-48 w-auto ml-auto mb-4 object-contain"
                    />

                    <h2 className="font-bold text-2xl">
                        {invoice.companyName}
                    </h2>

                    <p className="text-gray-600">
                        GSTIN :
                        {invoice.companyGST}
                    </p>

                    <p className="text-gray-600">
                        {invoice.companyAddress}
                    </p>

                    <p className="text-gray-600">
                        {invoice.companyPhone}
                    </p>
                </div>
            </div>

            {/* Billing */}

            <div className="grid md:grid-cols-2 gap-6 mt-8">

                <div className="border rounded-2xl p-5">

                    <h3 className="font-semibold text-lg mb-3">
                        Billing Address
                    </h3>

                    <p className="font-medium">
                        {invoice.customerName}
                    </p>

                    <p>{invoice.address}</p>

                    <p>
                        {invoice.city}
                    </p>

                    <p>
                        {invoice.pincode}
                    </p>

                    <p>
                        {invoice.phone}
                    </p>

                </div>

                <div className="border rounded-2xl p-5">

                    <h3 className="font-semibold text-lg mb-3">
                        Payment Details
                    </h3>

                    <p>
                        Method :
                        {invoice.paymentMethod}
                    </p>

                    <p>
                        Payment Id :
                        {invoice.paymentId}
                    </p>

                    <p>
                        Status :
                        {invoice.orderStatus}
                    </p>

                </div>

            </div>

            {/* Items */}

            <div className="mt-10 overflow-x-auto">

                <table className="w-full border-collapse">

                    <thead>

                        <tr className="bg-slate-100 text-sm uppercase">

                            <th className="p-4 text-left">
                                Product
                            </th>

                            <th className="p-4 text-right">
                                Unit Price
                            </th>

                            <th className="p-4 text-right">
                                Discount
                            </th>

                            <th className="p-4 text-center">
                                Qty
                            </th>

                            <th className="p-4 text-right">
                                Taxable Amount
                            </th>

                            <th className="p-4 text-center">
                                GST %
                            </th>

                            <th className="p-4 text-right">
                                GST Amount
                            </th>

                            <th className="p-4 text-right">
                                Coupon
                            </th>

                            <th className="p-4 text-right">
                                Net Payable
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {invoice.items.map(
                            (item, index) => (

                                <tr
                                    key={index}
                                    className="border-b hover:bg-slate-50"
                                >

                                    <td className="p-4">

                                        <div className="font-semibold">
                                            {item.productName}
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            {item.variantName}
                                        </div>

                                    </td>

                                    <td className="text-right">
                                        ₹{(
                                            item.price -
                                            item.discountAmount
                                        ).toFixed(2)}
                                    </td>

                                    <td className="text-right text-green-600">
                                        ₹{item.discountAmount.toFixed(2)}
                                    </td>

                                    <td className="text-center">
                                        {item.quantity}
                                    </td>

                                    <td className="text-right">
                                        ₹{item.taxableAmount.toFixed(2)}
                                    </td>

                                    <td className="text-center">
                                        {item.gstPercentage}%
                                    </td>

                                    <td className="text-right">
                                        ₹{item.gstAmount.toFixed(2)}
                                    </td>

                                    <td className="text-right text-orange-600">
                                        ₹{item.couponDiscountAmount.toFixed(2)}
                                    </td>

                                    <td className="text-right font-semibold">
                                        ₹{item.finalPaidAmount.toFixed(2)}
                                    </td>

                                </tr>
                            )
                        )}

                    </tbody>

                </table>

            </div>

            {/* Summary */}

            <div className="mt-10 flex justify-end">

                <div className="w-[500px] border rounded-2xl p-6 bg-slate-50">

                    <div className="flex justify-between py-2">
                        <span>MRP Total</span>
                        <span>
                            ₹{invoice.subTotal.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between py-2 text-green-700">
                        <span>Product Discount</span>
                        <span>
                            -₹{invoice.discountTotal.toFixed(2)}
                        </span>
                    </div>

                    <hr className="my-2" />

                    <div className="flex justify-between py-2 font-medium">
                        <span>Taxable Amount</span>
                        <span>
                            ₹{invoice.taxableAmount.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between py-2">
                        <span>GST Amount</span>
                        <span>
                            ₹{invoice.gstTotal.toFixed(2)}
                        </span>
                    </div>

                    <hr className="my-2" />

                    <div className="flex justify-between py-2">
                        <span>
                            Amount Including GST
                        </span>

                        <span>
                            ₹{(
                                invoice.taxableAmount +
                                invoice.gstTotal
                            ).toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between py-2 text-orange-600">
                        <span>
                            Coupon Discount
                        </span>

                        <span>
                            -₹{invoice.couponDiscount.toFixed(2)}
                        </span>
                    </div>

                    <hr className="my-2" />

                    <div className="flex justify-between py-2 text-lg font-semibold">
                        <span>
                            Net Payable Amount
                        </span>

                        <span>
                            ₹{invoice.finalPaidAmount.toFixed(2)}
                        </span>
                    </div>

                    <div className="border-t mt-4 pt-4 flex justify-between text-2xl font-bold text-blue-700">
                        <span>
                            Grand Total
                        </span>

                        <span>
                            ₹{invoice.grandTotal.toFixed(2)}
                        </span>
                    </div>

                </div>

            </div>

        </div>
    );
}
