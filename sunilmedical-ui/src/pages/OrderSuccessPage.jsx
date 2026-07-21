import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";


import {
    CheckCircle,
    Package,
    Truck,
    MapPin,
    ShoppingBag
}
    from "lucide-react";

export default function OrderSuccessPage() {

    const navigate = useNavigate();

    const { id } = useParams();

    const [loading, setLoading] =
        useState(true);

    const [order, setOrder] =
        useState(null);

    useEffect(() => {

        loadOrder();

    }, []);

    const loadOrder = async () => {

        try {

            const { data } =
                await API.get(`/api/order/success-order/${id}`);

            setOrder(data.order);

        }
        catch {

            navigate("/my-orders");

        }
        finally {

            setLoading(false);

        }

    };

    if (loading)
        return (

            <SmallCubeLoader
                title="Confirming Your Order"
                subtitle="Redirecting to your Success Order Page..."
            />

        );

    if (!order)
        return (

            <div className="min-h-screen flex justify-center items-center">

                Order Not Found

            </div>

        );

    return (

        <div className="bg-gray-100 min-h-screen py-10">

            <div className="max-w-6xl mx-auto px-5">
                <div className="bg-white rounded-3xl shadow-xl p-10">

                    <div className="flex flex-col items-center">

                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">

                            <CheckCircle

                                size={60}

                                className="text-green-600"

                            />

                        </div>

                        <h1 className="text-4xl font-bold mt-5">

                            Order Placed Successfully

                        </h1>

                        <p className="text-gray-500 mt-3">

                            Thank you for shopping with

                            <b>

                                Sunil Medical Products

                            </b>

                        </p>

                    </div>

                </div>
                <div className="grid lg:grid-cols-2 gap-6 mt-8">

                    <div className="bg-white rounded-3xl shadow-lg p-7">

                        <div className="flex items-center gap-3 mb-6">

                            <Package
                                className="text-blue-600"
                                size={28}
                            />

                            <h2 className="text-2xl font-bold">
                                Order Details
                            </h2>

                        </div>

                        <div className="space-y-5">

                            <div className="flex justify-between">

                                <span className="text-gray-500">
                                    Order Number
                                </span>

                                <span className="font-semibold">
                                    #{order.orderNumber}
                                </span>

                            </div>

                            <div className="flex justify-between">

                                <span className="text-gray-500">
                                    Order Date
                                </span>

                                <span className="font-semibold">

                                    {new Date(order.orderDate)
                                        .toLocaleDateString()}

                                </span>

                            </div>

                            <div className="flex justify-between">

                                <span className="text-gray-500">
                                    Payment
                                </span>

                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">

                                    {order.paymentStatus}

                                </span>

                            </div>

                            <div className="flex justify-between">

                                <span className="text-gray-500">
                                    Order Status
                                </span>

                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">

                                    {order.orderStatus}

                                </span>

                            </div>

                            <div className="flex justify-between">

                                <span className="text-gray-500">
                                    Estimated Delivery
                                </span>

                                <span className="font-semibold text-green-700">

                                    {new Date(order.estimatedDelivery)
                                        .toLocaleDateString()}

                                </span>

                            </div>

                            <div className="border-t pt-5 flex justify-between">

                                <span className="text-xl font-bold">
                                    Grand Total
                                </span>

                                <span className="text-2xl font-bold text-green-600">

                                    ₹{order.grandTotal.toFixed(2)}

                                </span>

                            </div>

                        </div>

                    </div>
                    <div className="bg-white rounded-3xl shadow-lg p-7">

                        <div className="flex items-center gap-3 mb-6">

                            <MapPin
                                className="text-red-500"
                                size={28}
                            />

                            <h2 className="text-2xl font-bold">

                                Delivery Address

                            </h2>

                        </div>

                        <div className="space-y-3">

                            <h3 className="text-xl font-semibold">

                                {order.customer.name}

                            </h3>

                            <p className="text-gray-600">

                                📞 {order.customer.mobile}

                            </p>

                            <p className="text-gray-700">

                                {order.customer.address}

                            </p>

                            <p className="text-gray-700">

                                {order.customer.city}

                            </p>

                            <p className="text-gray-700">

                                {order.customer.state}

                            </p>

                            <p className="text-gray-700">

                                {order.customer.pincode}

                            </p>

                        </div>

                    </div>

                </div>
                <div className="mt-12 bg-white rounded-3xl shadow-lg p-8">

                    <div className="flex items-center gap-3 mb-8">

                        <Truck
                            size={30}
                            className="text-blue-600"
                        />

                        <h2 className="text-3xl font-bold">

                            Delivery Progress

                        </h2>

                    </div>

                    <div className="grid grid-cols-4 gap-4">

                        <div className="text-center">

                            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto">

                                ✓

                            </div>

                            <p className="mt-3 font-semibold">

                                Order Placed

                            </p>

                        </div>

                        <div className="text-center">

                            <div
                                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white
                ${order.orderStatus === "Packed" ||
                                        order.orderStatus === "Shipped" ||
                                        order.orderStatus === "OutForDelivery" ||
                                        order.orderStatus === "Delivered"
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                            >
                                📦
                            </div>

                            <p className="mt-3 font-semibold">

                                Packed

                            </p>

                        </div>

                        <div className="text-center">

                            <div
                                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white
                ${order.orderStatus === "Shipped" ||
                                        order.orderStatus === "OutForDelivery" ||
                                        order.orderStatus === "Delivered"
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                            >
                                🚚
                            </div>

                            <p className="mt-3 font-semibold">

                                Shipped

                            </p>

                        </div>

                        <div className="text-center">

                            <div
                                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white
                ${order.orderStatus === "Delivered"
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                            >
                                🏠
                            </div>

                            <p className="mt-3 font-semibold">

                                Delivered

                            </p>

                        </div>

                    </div>

                </div>
                <div className="mt-12 grid md:grid-cols-4 gap-5">

                    <button

                        onClick={() => navigate("/")}

                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-3 transition"

                    >

                        <ShoppingBag size={20} />

                        Continue Shopping

                    </button>

                    <button

                        onClick={() => navigate("/my-orders")}

                        className="bg-gray-900 hover:bg-black text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-3 transition"

                    >

                        <Package size={20} />

                        See All Orders

                    </button>

                </div>

            </div>

        </div>

    );
}
