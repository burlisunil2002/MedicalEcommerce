import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function MyOrdersPage() {
    const navigate =
        useNavigate();

    const [orders, setOrders] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders =
        async () => {
            try {
                const { data } =
                    await API.get(
                        "/api/order/my-orders"
                    );

                setOrders(data || []);
            } catch (err) {
                if (
                    err?.response?.status === 401
                ) {
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

    const openInvoice = (
        orderId
    ) => {
        window.open(
            `/ api / order / download - invoice / ${ orderId } `,
            "_blank"
        );
    };

    const reorder = (
        productId
    ) => {
        navigate(
            `/ product / ${ productId } `
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 md:py-10">
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl font-bold mb-8">
                    My Orders
                </h1>

                <div className="space-y-6">

                    {orders.map(order => (
                        <div
                            key={order.orderId}
                            className="bg-white rounded-3xl border shadow-sm p-5 md:p-6"
                        >

                            {/* ORDER HEADER */}
                            <div className="flex flex-col md:flex-row md:justify-between gap-4 border-b pb-5">

                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Order #{order.orderId}
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(
                                            order.orderDate
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="text-left md:text-right">
                                    <p className="text-3xl font-bold text-emerald-600">
                                        ₹{Number(
                                            order.grandTotal
                                        ).toFixed(2)}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        Customer Paid
                                    </p>
                                </div>

                            </div>

                            {/* PRODUCTS */}
                            <div className="divide-y">

                                {order.items.map(item => (
                                    <div
                                        key={item.productId}
                                        className="py-5 flex flex-col sm:flex-row gap-4 sm:items-center"
                                    >

                                        <img
                                            src={item.productImage}
                                            alt=""
                                            className="w-20 h-20 rounded-2xl object-contain bg-gray-100"
                                        />

                                        <div className="flex-1">

                                            <h3 className="font-semibold">
                                                {item.productName}
                                            </h3>

                                            <p className="text-sm text-gray-500 mt-1">
                                                Qty: {item.quantity}
                                            </p>

                                            <p className="font-semibold mt-2">
                                                ₹{Number(
                                                    item.itemTotal
                                                ).toFixed(2)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                reorder(
                                                    item.productId
                                                )
                                            }
                                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl"
                                        >
                                            Reorder
                                        </button>
                                    </div>
                                ))}

                            </div>

                            {/* FOOTER */}
                            <div className="pt-5 border-t flex flex-col md:flex-row justify-between items-center gap-4">

                                <div className="flex gap-2">

                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                                        {order.orderStatus}
                                    </span>

                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                                        {order.paymentStatus}
                                    </span>

                                </div>

                                <button
                                    onClick={() =>
                                        openInvoice(
                                            order.orderId
                                        )
                                    }
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl"
                                >
                                    Download Invoice
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
