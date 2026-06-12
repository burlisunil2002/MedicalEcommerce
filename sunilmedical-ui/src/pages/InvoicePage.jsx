import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import html2pdf from "html2pdf.js";
import InvoicePdf from "../components/InvoicePdf";

export default function InvoicePage() {

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const invoicePdfRef = useRef(null);

    const { id: orderId } =
        useParams();

    useEffect(() => {
        loadInvoice();
    }, []);

    const loadInvoice = async () => {

        try {

            setLoading(true);

            const res = await API.get(
                `/api/order/invoice/${orderId}`
            );

            console.log("Invoice Response", res.data);

            if (res.data.success) {
                setInvoice(res.data.invoice);
            }

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }
    };

    if (loading) {
        return (
            <div className="
            min-h-screen
            flex
            items-center
            justify-center
            bg-slate-50
        ">
                <div className="
                bg-white
                p-10
                rounded-3xl
                shadow-xl
                text-center
            ">

                    <div className="
                    h-16
                    w-16
                    border-4
                    border-blue-600
                    border-t-transparent
                    rounded-full
                    animate-spin
                    mx-auto
                " />

                    <h3 className="
                    mt-5
                    text-xl
                    font-semibold
                ">
                        Loading Invoice
                    </h3>

                    <p className="text-gray-500 mt-2">
                        Please wait...
                    </p>

                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Invoice not found
            </div>
        );
    }

    const downloadInvoice = async () => {

        if (!invoicePdfRef.current)
            return;

        setDownloading(true);

        try {

            await html2pdf()
                .set({
                    margin: 5,

                    filename:
                        `Invoice-${invoice.invoiceNumber}.pdf`,

                    image: {
                        type: "jpeg",
                        quality: 1
                    },

                    html2canvas: {
                        scale: 2,
                        useCORS: true
                    },

                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait"
                    }
                })
                .from(invoicePdfRef.current)
                .save();

        }
        finally {
            setDownloading(false);
        }
    };
   

    return (
        <>
            
            <div className="max-w-7xl mx-auto mt-6 flex justify-end">

                <button
                    onClick={downloadInvoice}
                    className="
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            text-white
            px-6
            py-3
            rounded-xl
            font-semibold
            shadow-lg
            hover:scale-105
            transition-all
            duration-300
        "
                >
                    📄 Download Invoice
                </button>

            </div>

            <div
                ref={invoicePdfRef}
                className="
                max-w-7xl
                mx-auto
                bg-white
                shadow-xl
                rounded-3xl
                p-10
                my-8
            "
            >
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
                            src={`${window.location.origin}/images/sunillogo.png`}
                            alt="Sunil Medical Products"
                            style={{
                                width: "220px",
                                height: "auto"
                            }}
                            onError={() => console.log("Logo failed to load")}
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

                                        <td className="text-right font-medium">
                                            ₹{(
                                                item.price -
                                                item.discountAmount
                                            ).toFixed(2)}
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

                    <div className="
        w-[550px]
        border
        rounded-3xl
        p-8
        bg-slate-50
        shadow-sm
    ">

                        <div className="
            flex
            justify-between
            py-3
            text-lg
        ">
                            <span>
                                Taxable Amount
                            </span>

                            <span>
                                ₹{invoice.taxableAmount.toFixed(2)}
                            </span>
                        </div>

                        <div className="
            flex
            justify-between
            py-3
            text-lg
        ">
                            <span>
                                Total GST Amount
                            </span>

                            <span>
                                ₹{invoice.gstTotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="
    flex
    justify-between
    py-3
    text-lg
">
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

                        <div className="
            flex
            justify-between
            py-3
            text-lg
            text-orange-600
        ">
                            <span>
                                Coupon Discount
                            </span>

                            <span>
                                -₹{invoice.couponDiscount.toFixed(2)}
                            </span>
                        </div>

                        <hr className="my-4" />

                        <div className="
    mt-4
    bg-blue-600
    text-white
    rounded-2xl
    p-5
    flex
    justify-between
    items-center
">
                            <span className="text-lg">
                                Final Paid Amount
                            </span>

                            <span className="
        text-3xl
        font-bold
    ">
                                ₹{invoice.finalPaidAmount.toFixed(2)}
                            </span>
                        </div>

                    </div>

                </div>


            </div>

            {
                downloading && (
                    <div className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
        ">
                        <div className="
                bg-white
                p-8
                rounded-3xl
                shadow-xl
                text-center
            ">

                            <div className="
                    h-14
                    w-14
                    border-4
                    border-blue-600
                    border-t-transparent
                    rounded-full
                    animate-spin
                    mx-auto
                " />

                            <p className="mt-4 font-semibold">
                                Generating Invoice...
                            </p>

                        </div>
                    </div>
                )
            }

            <div
                style={{
                    position: "fixed",
                    left: "-10000px",
                    top: 0,
                    width: "800px",
                    background: "#fff"
                }}
            
            >
                <InvoicePdf
                    ref={invoicePdfRef}
                    invoice={invoice}
                />
            </div>

        </>
    );
}
