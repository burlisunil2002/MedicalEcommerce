import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import DeliveryTracker from "../components/orders/DeliveryTracker";

import {
    Package,
    ShoppingBag,
    Search,
    Receipt,
    CreditCard,
    Truck,
    ChevronRight,
    XCircle,
    Eye
} from "lucide-react";

export default function MyOrdersPage() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);

    const [showCancelDialog, setShowCancelDialog] =
        useState(false);

    useEffect(() => {

        loadOrders();

    }, []);

    const loadOrders = async () => {

        try {

            const res =
                await API.get("/api/order/my-orders");

            setOrders(

                Array.isArray(res.data)

                    ? res.data

                    : res.data.orders ?? []

            );

        }

        catch (err) {

            console.log(err);

            navigate("/login");

        }

        finally {

            setLoading(false);

        }

    };

    const cancelOrder = async () => {

        if (!selectedOrder) return;

        try {

            await API.put(

                `/api/order/cancel/${selectedOrder.orderId}`

            );

            setShowCancelDialog(false);

            setSelectedOrder(null);

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert("Unable to cancel order.");

        }

    };

    const filteredOrders =

        orders.filter(x =>

            x.orderNumber

                ?.toLowerCase()

                .includes(

                    search.toLowerCase()

                )

        );

    // Loading

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-50">

                <div className="max-w-7xl mx-auto px-5 py-8">

                    <div className="h-56 rounded-[35px] bg-gradient-to-r from-blue-50 via-white to-cyan-50 animate-pulse mb-8" />

                    {

                        [1, 2, 3].map(i => (

                            <div

                                key={i}

                                className="bg-white rounded-3xl shadow border p-6 mb-6 animate-pulse"

                            >

                                <div className="h-6 bg-gray-200 rounded w-52 mb-5" />

                                <div className="flex gap-5">

                                    <div className="w-24 h-24 rounded-xl bg-gray-200" />

                                    <div className="flex-1">

                                        <div className="h-5 bg-gray-200 rounded w-80 mb-3" />

                                        <div className="h-4 bg-gray-100 rounded w-48 mb-3" />

                                        <div className="h-4 bg-gray-100 rounded w-24" />

                                    </div>

                                </div>

                            </div>

                        ))

                    }

                </div>

            </div>

        );

    }

    // Empty State

    if (!loading && filteredOrders.length === 0) {

        return (

            <div className="min-h-screen bg-slate-50 flex items-center justify-center">

                <div className="bg-white rounded-[35px] shadow-xl border p-12 max-w-lg text-center">

                    <ShoppingBag

                        size={80}

                        className="mx-auto text-blue-600"

                    />

                    <h2 className="text-3xl font-bold mt-6">

                        No Orders Yet

                    </h2>

                    <p className="mt-3 text-gray-500">

                        Looks like you haven't placed any orders.

                    </p>

                    <button

                        onClick={() => navigate("/")}

                        className="mt-8 px-8 py-3 rounded-xl bg-blue-600 text-white"

                    >

                        Continue Shopping

                    </button>

                </div>

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-slate-50">

            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">

                {/* Hero */}

                <div

                    className="relative overflow-hidden rounded-[35px] bg-gradient-to-r from-blue-50 via-white to-cyan-50 border shadow-sm p-8 lg:p-10 mb-8"

                >

                    <div

                        className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"

                    />

                    <div className="relative flex flex-col lg:flex-row justify-between gap-8 items-center">

                        <div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-5">

                                <Package size={18} />

                                My Orders

                            </div>

                            <h1 className="text-4xl lg:text-5xl font-bold">

                                Track Your Orders

                            </h1>

                            <p className="mt-4 text-gray-600 max-w-xl text-lg">

                                View all your purchases,

                                download invoices,

                                monitor delivery,

                                and manage orders from one place.

                            </p>

                        </div>

                        <div className="w-full lg:w-96">

                            <div className="relative">

                                <Search

                                    size={20}

                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"

                                />

                                <input

                                    value={search}

                                    onChange={(e) => setSearch(e.target.value)}

                                    placeholder="Search Order Number..."

                                    className="w-full h-14 rounded-2xl border pl-12 pr-5 bg-white outline-none focus:ring-2 focus:ring-blue-500"

                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* Orders */}

                <div className="space-y-6">

                    {

                        filteredOrders.map(order => (

                            <div

                                key={order.orderId}

                                className="
bg-white
rounded-[30px]
border
shadow-sm
hover:shadow-xl
hover:-translate-y-1
transition-all
duration-300
"
                            >

                                {/* Top Header */}

                                <div className="border-b bg-slate-50 px-6 py-5">

                                    <div className="flex flex-col lg:flex-row justify-between gap-5">

                                        <div>

                                            <p className="text-sm text-gray-500">

                                                ORDER NUMBER

                                            </p>

                                            <h2 className="font-bold text-lg">

                                                #{order.orderNumber}

                                            </h2>

                                            <p className="text-sm text-gray-500 mt-2">

                                                Placed on

                                                {

                                                    new Date(

                                                        order.orderDate

                                                    ).toLocaleDateString()

                                                }

                                            </p>

                                        </div>

                                        <div className="text-right">

                                            <p className="text-sm text-gray-500">

                                                Grand Total

                                            </p>

                                            <p className="text-3xl font-bold text-green-600">

                                                ₹{order.grandTotal?.toFixed(2)}

                                            </p>

                                        </div>

                                    </div>

                                </div>

                                {/* Items */}

                                <div className="p-6 space-y-6">

                                    {

                                        order.items.map(item => (

                                            <div

                                                key={`${item.productId}-${item.variantId}`}

                                                className="flex flex-col lg:flex-row gap-5 border rounded-2xl p-5 hover:shadow-md transition"

                                            >

                                                {/* Image */}

                                                <img

                                                    src={

                                                        item.productImage ||

                                                        "/images/no-image.png"

                                                    }

                                                    onClick={() =>

                                                        navigate(

                                                            `/product/${item.productId}?variant=${item.variantId}`

                                                        )

                                                    }

                                                    className="
w-28
h-28
rounded-2xl
bg-slate-100
object-contain
cursor-pointer
transition-transform
duration-300
hover:scale-105
"

                                                />

                                                {/* Product */}

                                                <div className="flex-1">

                                                    <h3

                                                        onClick={() =>

                                                            navigate(

                                                                `/product/${item.productId}?variant=${item.variantId}`

                                                            )

                                                        }

                                                        className="

text-lg

font-bold

cursor-pointer

hover:text-blue-600

"

                                                    >

                                                        {item.productName}

                                                    </h3>

                                                    <p className="text-gray-500 mt-2">

                                                        Variant :

                                                        <span className="font-medium">

                                                            {" "}

                                                            {item.variantName}

                                                        </span>

                                                    </p>

                                                    <div className="flex gap-8 mt-4">

                                                        <div>

                                                            <p className="text-xs text-gray-400">

                                                                Quantity

                                                            </p>

                                                            <p className="font-semibold">

                                                                {item.quantity}

                                                            </p>

                                                        </div>

                                                        <div>

                                                            <p className="text-xs text-gray-400">

                                                                Price

                                                            </p>

                                                            <p className="font-semibold text-pink-600">

                                                                ₹{item.itemTotal?.toFixed(2)}

                                                            </p>

                                                        </div>

                                                    </div>


                                                </div>

                                            </div>

                                        ))

                                    }

                                    {/* Payment */}

                                    <div

                                        className="grid lg:grid-cols-2 gap-5"

                                    >

                                        <div

                                            className="rounded-2xl border bg-blue-50 p-5"

                                        >

                                            <div className="flex items-center gap-3">

                                                <CreditCard className="text-blue-600" />

                                                <div>

                                                    <p className="text-sm text-gray-500">

                                                        Payment Status

                                                    </p>

                                                    <h3 className="font-bold">

                                                        {order.paymentStatus}

                                                    </h3>

                                                </div>

                                            </div>

                                        </div>

                                        <div

                                            className="rounded-2xl border bg-green-50 p-5"

                                        >

                                            <div className="flex items-center gap-3">

                                                <Truck className="text-green-600" />

                                                <div>

                                                    <p className="text-sm text-gray-500">

                                                        Order Status

                                                    </p>

                                                    <h3 className="font-bold">

                                                        {order.orderStatus}

                                                    </h3>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                    {/* Delivery Tracker */}

                                    <div className="mt-8">

                                        <DeliveryTracker
                                            status={order.orderStatus}
                                            orderDate={order.orderDate}
                                            modifiedDate={order.modifiedDate}
                                        />

                                    </div>

                                    {/* Footer */}

                                    <div
                                        className="
        mt-8
        border-t
        pt-6
        flex
        flex-col
        lg:flex-row
        justify-between
        items-center
        gap-5
    "
                                    >

                                        {/* Left Buttons */}

                                        <div className="flex flex-wrap gap-3">

                                            {order.paymentStatus === "Completed" && (

                                                <button
                                                    onClick={() =>
                                                        navigate(`/invoice/${order.orderId}`)
                                                    }
                                                    className="
                    h-11
                    px-6
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    font-medium
                    flex
                    items-center
                    gap-2
                "
                                                >
                                                    <Receipt size={18} />

                                                    Download Invoice

                                                </button>

                                            )}

                                        </div>

                                        {/* Right Side */}

                                        <div className="flex flex-wrap gap-3">

                                            {(order.orderStatus === "Placed" ||
                                                order.orderStatus === "Packed") && (

                                                    <button
                                                        onClick={() => {

                                                            setSelectedOrder(order);

                                                            setShowCancelDialog(true);

                                                        }}
                                                        className="
                    h-11
                    px-6
                    rounded-xl
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    font-medium
                "
                                                    >

                                                        Cancel Order

                                                    </button>

                                                )}

                                            <span
                                                className={`
                px-5
                py-2
                rounded-xl
                font-semibold

                ${order.orderStatus === "Placed"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : ""}

                ${order.orderStatus === "Packed"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : ""}

                ${order.orderStatus === "Shipped"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : ""}

                ${order.orderStatus === "OutForDelivery"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : ""}

                ${order.orderStatus === "Delivered"
                                                        ? "bg-green-100 text-green-700"
                                                        : ""}

                ${order.orderStatus === "Cancelled"
                                                        ? "bg-red-100 text-red-700"
                                                        : ""}
            `}
                                            >

                                                {order.orderStatus === "Placed" && "🛒 Order Placed"}

                                                {order.orderStatus === "Packed" && "📦 Packed"}

                                                {order.orderStatus === "Shipped" && "🚚 Shipped"}

                                                {order.orderStatus === "OutForDelivery" &&
                                                    "🚛 Out For Delivery"}

                                                {order.orderStatus === "Delivered" &&
                                                    "✅ Delivered"}

                                                {order.orderStatus === "Cancelled" &&
                                                    "❌ Cancelled"}

                                            </span>

                                        </div>

                                    </div>
                                </div>

                            </div>

                        ))

                    }
                </div>

                {/* CANCEL DIALOG HERE */}

                {showCancelDialog && (

                    <div
                        className="
fixed
inset-0
z-50
bg-black/40
backdrop-blur-sm
flex
items-center
justify-center
p-4
"
                    >

                        <div
                            className="
bg-white
rounded-3xl
shadow-2xl
w-full
max-w-md
p-8
"
                        >

                            <div className="text-center">

                                <div className="text-6xl">

                                    ⚠️

                                </div>

                                <h2 className="text-2xl font-bold mt-5">

                                    Cancel Order?

                                </h2>

                                <p className="text-gray-500 mt-3">

                                    Are you sure you want to cancel this order?

                                </p>

                            </div>

                            <div className="flex gap-4 mt-8">

                                <button

                                    onClick={() => {

                                        setShowCancelDialog(false);

                                        setSelectedOrder(null);

                                    }}

                                    className="
flex-1
h-12
rounded-xl
border
font-semibold
"

                                >

                                    No

                                </button>

                                <button

                                    onClick={cancelOrder}

                                    className="
flex-1
h-12
rounded-xl
bg-red-600
text-white
font-semibold
"

                                >

                                    Yes, Cancel

                                </button>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

}