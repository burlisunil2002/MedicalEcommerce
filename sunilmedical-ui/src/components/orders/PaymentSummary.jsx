import {
    CreditCard,
    IndianRupee,
    BadgePercent,
    Truck,
    Receipt
} from "lucide-react";

export default function PaymentSummary({ order }) {

    // These fields are optional.
    // If the backend doesn't return them yet,
    // they will default gracefully.

    const subtotal =
        order.subTotal ??
        order.subtotal ??
        order.grandTotal;

    const gst =
        order.gstAmount ??
        0;

    const shipping =
        order.shippingCharge ??
        0;

    const discount =
        order.discountAmount ??
        0;

    const total =
        order.grandTotal;

    const paymentMethod =
        order.paymentMethod ??
        "Online Payment";

    return (

        <div className="p-6">

            <div className="flex items-center gap-3 mb-6">

                <CreditCard
                    size={24}
                    className="text-blue-600"
                />

                <h3 className="text-xl font-bold text-slate-800">

                    Payment Summary

                </h3>

            </div>

            <div className="grid lg:grid-cols-2 gap-8">

                {/* LEFT */}

                <div className="space-y-4">

                    <div className="flex justify-between">

                        <div className="flex items-center gap-2">

                            <IndianRupee size={18} />

                            <span>Subtotal</span>

                        </div>

                        <span>

                            ₹{Number(subtotal).toLocaleString()}

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <div className="flex items-center gap-2">

                            <BadgePercent size={18} />

                            <span>GST</span>

                        </div>

                        <span>

                            ₹{Number(gst).toLocaleString()}

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <div className="flex items-center gap-2">

                            <Truck size={18} />

                            <span>Shipping</span>

                        </div>

                        <span>

                            ₹{Number(shipping).toLocaleString()}

                        </span>

                    </div>

                    {

                        discount > 0 && (

                            <div className="flex justify-between text-green-600">

                                <div className="flex items-center gap-2">

                                    <Receipt size={18} />

                                    <span>Discount</span>

                                </div>

                                <span>

                                    - ₹{Number(discount).toLocaleString()}

                                </span>

                            </div>

                        )

                    }

                </div>

                {/* RIGHT */}

                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-6">

                    <div className="flex justify-between items-center">

                        <span className="text-lg font-medium">

                            Grand Total

                        </span>

                        <span className="text-3xl font-bold text-blue-700">

                            ₹{Number(total).toLocaleString()}

                        </span>

                    </div>

                    <div className="mt-6 border-t border-blue-200 pt-4">

                        <div className="flex justify-between">

                            <span className="text-slate-600">

                                Payment Method

                            </span>

                            <span className="font-semibold">

                                {paymentMethod}

                            </span>

                        </div>

                        <div className="mt-3 flex justify-between">

                            <span className="text-slate-600">

                                Payment Status

                            </span>

                            <span
                                className={`font-semibold ${order.paymentStatus === "Paid"
                                        ? "text-green-600"
                                        : "text-orange-600"
                                    }`}
                            >

                                {order.paymentStatus}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}