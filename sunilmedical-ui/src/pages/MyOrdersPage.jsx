import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function MyOrdersPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openingInvoice, setOpeningInvoice] =
        useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const res = await API.get("/api/order/my-orders");
            setOrders(res.data || []);
        } catch {
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const reorder = (productId, variantId) => {
        navigate(
            `/product/${productId}?variant=${variantId}`
        );
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>

                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="bg-white rounded-3xl shadow-sm border p-5 mb-5"
                        >
                            {/* Header */}
                            <div className="flex justify-between mb-5">
                                <div>
                                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                                </div>

                                <div>
                                    <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
                                </div>
                            </div>

                            {/* Product */}
                            <div className="flex gap-4 items-center">
                                <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse"></div>

                                <div className="flex-1">
                                    <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-2"></div>
                                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>

                                <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
                            </div>

                            {/* Footer */}
                            <div className="border-t mt-5 pt-4 flex justify-between">
                                <div className="flex gap-2">
                                    <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>

                                <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!loading && orders.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-7xl mb-4">📦</div>

                    <h2 className="text-2xl font-bold mb-2">
                        No Orders Yet
                    </h2>

                    <p className="text-gray-500 mb-6">
                        Looks like you haven't placed any orders yet.
                    </p>

                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 rounded-xl bg-pink-600 text-white font-semibold"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50 pb-24 px-3 md:px-6 py-5">

                <div className="max-w-6xl mx-auto">

                    <h1 className="text-2xl md:text-3xl font-bold mb-6">
                        My Orders
                    </h1>

                    <div className="space-y-5">

                        {orders.map(order => (
                            <div
                                key={order.orderId}
                                className="bg-white rounded-3xl shadow-sm border p-4 md:p-6"
                            >

                                {/* Header */}

                                <div className="flex justify-between items-start mb-5 pb-4 border-b">

                                    <div>
                                        <p className="font-semibold text-lg">
                                            #{order.orderNumber}
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(
                                                order.orderDate
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-emerald-600">
                                            ₹{order.grandTotal?.toFixed(2)}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Total Amount
                                        </p>
                                    </div>

                                </div>

                                {/* Items */}

                                <div className="space-y-4">

                                    {order.items.map(item => (
                                        <div
                                            key={`${item.productId}-${item.variantId}`}
                                            className="flex gap-4 items-center"
                                        >

                                            <img
                                                src={item.productImage}
                                                alt={item.productName}
                                                className="w-20 h-20 rounded-2xl object-contain bg-slate-100"
                                            />

                                            <div className="flex-1 min-w-0">

                                                <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                                                    {item.productName}
                                                </h3>

                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.variantName}
                                                </p>

                                                <p className="text-xs mt-1 text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>

                                                <p className="font-bold text-pink-600 mt-2">
                                                    ₹{item.itemTotal?.toFixed(2)}
                                                </p>

                                            </div>

                                            <button
                                                onClick={() =>
                                                    reorder(
                                                        item.productId,
                                                        item.variantId
                                                    )
                                                }
                                                className="
                                                px-4
                                                py-2
                                                rounded-xl
                                                bg-black
                                                text-white
                                                text-sm
                                                active:scale-95
                                                transition
                                            "
                                            >
                                                Reorder
                                            </button>

                                        </div>
                                    ))}

                                </div>

                                {/* Footer */}

                                <div className="
                                border-t
                                mt-5
                                pt-4
                                flex
                                flex-col
                                md:flex-row
                                gap-3
                                justify-between
                                items-center
                            ">

                                    <div className="flex gap-2 flex-wrap">

                                        <span className="
                                        px-3
                                        py-1
                                        rounded-full
                                        bg-blue-100
                                        text-blue-700
                                        text-xs
                                    ">
                                            Order : {order.orderStatus}
                                        </span>

                                        <span className="
                                        px-3
                                        py-1
                                        rounded-full
                                        bg-green-100
                                        text-green-700
                                        text-xs
                                    ">
                                            Payment : {order.paymentStatus}
                                        </span>

                                    </div>

                                    {order.paymentStatus === "Completed" && (
                                        <button
                                            onClick={() => {

                                                setOpeningInvoice(true);

                                                setTimeout(() => {

                                                    navigate(
                                                        `/invoice/${order.orderId}`
                                                    );

                                                    setOpeningInvoice(false);

                                                }, 500);

                                            }}
                                            className="
                                            px-5
                                            py-2
                                            rounded-xl
                                            bg-blue-600
                                            hover:bg-blue-700
                                            text-white
                                            font-medium
                                            transition
                                        "
                                        >
                                            View Invoice
                                        </button>
                                    )}

                                </div>

                            </div>
                        ))}

                    </div>

                </div>

            </div>

            {openingInvoice && (

                <div className="
                fixed
                inset-0
                bg-black/40
                backdrop-blur-sm
                flex
                items-center
                justify-center
                z-50
            ">

                    <div className="
                    bg-white
                    p-8
                    rounded-3xl
                    shadow-2xl
                    text-center
                ">

                        <div className="
                        h-16
                        w-16
                        mx-auto
                        border-4
                        border-blue-600
                        border-t-transparent
                        rounded-full
                        animate-spin
                    " />

                        <p className="
                        mt-4
                        font-semibold
                        text-lg
                    ">
                            Opening Invoice...
                        </p>

                    </div>

                </div>

            )}

        </>
    );
}
