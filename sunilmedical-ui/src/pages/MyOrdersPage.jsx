import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyOrdersPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const res = await fetch("/Order/GetMyOrders");
            const data = await res.json();

            setOrders(data);
        } catch (err) {
            console.error("Order load failed", err);
        } finally {
            setLoading(false);
        }
    };

    const openInvoice = (orderId) => {
        window.open(`/Order/DownloadInvoice/${orderId}`, "_blank");
    };

    const reorder = (productId) => {
        navigate(`/product/${productId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-3xl font-bold">
                        My Orders
                    </h1>

                    {!loading && (
                        <span className="bg-white px-4 py-2 rounded-full shadow text-sm">
                            {orders.length} Orders
                        </span>
                    )}

                </div>

                {/* SKELETON */}
                {loading && (
                    <div className="space-y-6">

                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="bg-white rounded-3xl p-6 shadow-sm animate-pulse"
                            >
                                <div className="flex gap-6">

                                    {/* IMAGE */}
                                    <div className="w-24 h-24 rounded-2xl bg-gray-200"></div>

                                    {/* CONTENT */}
                                    <div className="flex-1 space-y-4">

                                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded"></div>

                                        </div>

                                        <div className="flex gap-3">

                                            <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
                                            <div className="h-8 w-28 bg-gray-200 rounded-full"></div>

                                        </div>

                                    </div>

                                    {/* BUTTONS */}
                                    <div className="space-y-3 w-40">

                                        <div className="h-12 bg-gray-200 rounded-2xl"></div>
                                        <div className="h-12 bg-gray-200 rounded-2xl"></div>

                                    </div>

                                </div>
                            </div>
                        ))}

                    </div>
                )}

                {/* EMPTY */}
                {!loading && orders.length === 0 && (
                    <div className="bg-white rounded-3xl p-16 text-center">

                        <img
                            src="https://cdn-icons-png.flaticon.com/512/4076/4076501.png"
                            className="w-32 mx-auto mb-6"
                            alt=""
                        />

                        <h2 className="text-2xl font-semibold mb-2">
                            No Orders Yet
                        </h2>

                        <p className="text-gray-500 mb-6">
                            Start shopping to place your first order
                        </p>

                        <button
                            onClick={() => navigate("/")}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl"
                        >
                            Start Shopping
                        </button>

                    </div>
                )}

                {/* ORDERS */}
                {!loading &&
                    orders.length > 0 && (
                        <div className="space-y-6">

                            {orders.map((item) => (
                                <div
                                    key={item.orderId}
                                    className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition"
                                >
                                    <div className="flex flex-col lg:flex-row gap-6">

                                        {/* IMAGE */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center">
                                            <img
                                                src={item.productImage}
                                                alt=""
                                                className="w-20 h-20 object-contain"
                                            />
                                        </div>

                                        {/* DETAILS */}
                                        <div className="flex-1">

                                            <h3 className="text-lg font-semibold mb-3">
                                                {item.productName}
                                            </h3>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">

                                                <p>
                                                    #{item.orderId}
                                                </p>

                                                <p>
                                                    {new Date(
                                                        item.orderDate
                                                    ).toLocaleDateString()}
                                                </p>

                                                <p>
                                                    Qty:
                                                    {item.quantity}
                                                </p>

                                                <p className="font-semibold text-green-600">
                                                    ₹{item.total}
                                                </p>

                                            </div>

                                            <div className="flex gap-3 mt-4">

                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                                    {item.orderStatus}
                                                </span>

                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                    {item.paymentStatus}
                                                </span>

                                            </div>

                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-col gap-3 w-full lg:w-44">

                                            <button
                                                onClick={() =>
                                                    openInvoice(
                                                        item.orderId
                                                    )
                                                }
                                                disabled={
                                                    item.paymentStatus !==
                                                    "Completed"
                                                }
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3"
                                            >
                                                Invoice
                                            </button>

                                            <button
                                                onClick={() =>
                                                    reorder(
                                                        item.productId
                                                    )
                                                }
                                                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3"
                                            >
                                                Reorder
                                            </button>

                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

            </div>
        </div>
    );
}