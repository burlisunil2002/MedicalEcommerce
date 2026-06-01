import React, {
    useEffect,
    useState
} from "react";
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
            `/api/order/invoice/${orderId}`
        );

        if (res.data.success) {
            setInvoice(res.data.invoice);
        }
    };

    if (!invoice)
        return (
            <div className="p-10">
                Loading invoice...
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-8 my-8">

            <div className="flex justify-between border-b pb-6">

                <div>
                    <h1 className="text-3xl font-bold">
                        Tax Invoice
                    </h1>

                    <p>{invoice.invoiceNumber}</p>

                    <p>
                        {new Date(
                            invoice.date
                        ).toLocaleDateString()}
                    </p>
                </div>

                <div className="text-right">
                    <h2 className="font-bold text-xl">
                        Sunil Medical Products
                    </h2>

                    <p>{invoice.companyGST}</p>
                </div>

            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">

                <div>
                    <h3 className="font-semibold mb-2">
                        Billing Address
                    </h3>

                    <p>{invoice.customerName}</p>
                    <p>{invoice.address}</p>
                    <p>{invoice.city}</p>
                    <p>{invoice.pincode}</p>
                    <p>{invoice.phone}</p>
                </div>

            </div>

            <table className="w-full mt-8 border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-3 text-left">
                            Product
                        </th>
                        <th>Variant</th>
                        <th>Qty</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Coupon</th>
                        <th>GST</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    {invoice.items.map(
                        (item, i) => (
                            <tr
                                key={i}
                                className="border-b"
                            >
                                <td>
                                    <strong>@item.ProductName</strong>
                                    <br />
                                    <small>@item.VariantName</small>
                                </td>

                                <td>{item.quantity}</td>

                                <td>₹{item.price}</td>

                                <td>
                                    ₹{item.discountAmount}
                                </td>

                                <td>
                                    ₹{
                                        item.couponDiscountAmount
                                    }
                                </td>

                                <td>₹{item.gstAmount}</td>

                                <td>₹{item.total}</td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>

            <div className="mt-10 ml-auto w-96 space-y-3">

                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                        ₹{invoice.subTotal}
                    </span>
                </div>

                <div className="flex justify-between text-green-600">
                    <span>
                        Product Discount
                    </span>
                    <span>
                        -₹{invoice.discountTotal}
                    </span>
                </div>

                <div className="flex justify-between text-orange-600">
                    <span>
                        Coupon Discount
                    </span>
                    <span>
                        -₹{invoice.couponDiscount}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>GST</span>
                    <span>
                        ₹{invoice.gstTotal}
                    </span>
                </div>

                <div className="flex justify-between font-bold text-2xl border-t pt-4">
                    <span>Final Paid</span>
                    <span>
                        ₹{invoice.grandTotal}
                    </span>
                </div>

            </div>

        </div>
    );
}