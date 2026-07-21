import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
    Package,
    ShoppingCart,
    IndianRupee,
    Users,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
    CreditCard,
    Plus,
    Boxes,
    Clock,
    Activity
} from "lucide-react";

import API from "../../services/api";

export default function SellerDashboard() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [dashboard, setDashboard] = useState({

        sellerName: "",

        totalProducts: 0,

        totalOrders: 0,

        revenue: 0,

        customers: 0,

        pendingOrders: 0,

        lowStock: 0,

        growth: 18,

        subscriptionEnd: null,

        isSubscribed: false

    });

    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const { data } = await API.get(
                "/api/seller/dashboard"
            );

            setDashboard({

                sellerName:
                    data.sellerName,

                totalProducts:
                    data.totalProducts,

                totalOrders:
                    data.totalOrders,

                revenue:
                    data.revenue,

                customers:
                    data.customers ?? 0,

                pendingOrders:
                    data.pendingOrders ?? 0,

                lowStock:
                    data.lowStock ?? 0,

                growth:
                    data.growth ?? 18,

                subscriptionEnd:
                    data.subscriptionEnd,

                isSubscribed:
                    data.isSubscribed

            });

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    };

    const cards = [

        {

            title: "Products",

            value: dashboard.totalProducts,

            icon: Package,

            bg: "bg-blue-100",

            color: "text-blue-600"

        },

        {

            title: "Orders",

            value: dashboard.totalOrders,

            icon: ShoppingCart,

            bg: "bg-indigo-100",

            color: "text-indigo-600"

        },

        {

            title: "Revenue",

            value: `₹${dashboard.revenue}`,

            icon: IndianRupee,

            bg: "bg-green-100",

            color: "text-green-600"

        },

        {

            title: "Customers",

            value: dashboard.customers,

            icon: Users,

            bg: "bg-purple-100",

            color: "text-purple-600"

        },

        {

            title: "Pending Orders",

            value: dashboard.pendingOrders,

            icon: Clock,

            bg: "bg-orange-100",

            color: "text-orange-600"

        },

        {

            title: "Low Stock",

            value: dashboard.lowStock,

            icon: AlertTriangle,

            bg: "bg-red-100",

            color: "text-red-600"

        }

    ];

    if (loading) {

        return (

            <div className="space-y-6 animate-pulse">

                <div className="h-56 rounded-3xl bg-slate-200"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {[1, 2, 3, 4, 5, 6].map(x => (

                        <div
                            key={x}
                            className="h-40 rounded-3xl bg-slate-200"
                        />

                    ))}

                </div>

            </div>

        );

    }

    return (

        <div className="space-y-8">
            {/* ================= HERO ================= */}

            <motion.div

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: .4 }}

                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white p-6 md:p-10 shadow-2xl"

            >

                <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

                <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-300/10 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col lg:flex-row justify-between gap-8">

                    <div>

                        <h1 className="text-3xl md:text-5xl font-black">

                            Welcome Back 👋

                        </h1>

                        <p className="text-blue-100 mt-3 text-lg">

                            {dashboard.sellerName}

                        </p>

                        <p className="mt-6 max-w-xl text-blue-50">

                            Manage your products, orders, subscriptions and
                            grow your business from one premium seller portal.

                        </p>

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5">

                            <Activity
                                className="mb-3"
                                size={28}
                            />

                            <p className="text-sm">

                                Business Growth

                            </p>

                            <h2 className="text-4xl font-black mt-2">

                                +{dashboard.growth}%

                            </h2>

                        </div>

                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5">

                            <Boxes
                                className="mb-3"
                                size={28}
                            />

                            <p className="text-sm">

                                Products

                            </p>

                            <h2 className="text-4xl font-black mt-2">

                                {dashboard.totalProducts}

                            </h2>

                        </div>

                    </div>

                </div>

            </motion.div>

            {/* ================= KPI ================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

                {

                    cards.map((card, index) => {

                        const Icon = card.icon;

                        return (

                            <motion.div

                                key={card.title}

                                initial={{

                                    opacity: 0,

                                    y: 20

                                }}

                                animate={{

                                    opacity: 1,

                                    y: 0

                                }}

                                transition={{

                                    delay: index * .05

                                }}

                                whileHover={{

                                    y: -5

                                }}

                                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6"

                            >

                                <div className="flex justify-between">

                                    <div>

                                        <p className="text-gray-500">

                                            {card.title}

                                        </p>

                                        <h2 className="text-3xl md:text-4xl font-black mt-4">

                                            {card.value}

                                        </h2>

                                    </div>

                                    <div

                                        className={`${card.bg} w-16 h-16 rounded-2xl flex items-center justify-center`}

                                    >

                                        <Icon

                                            className={card.color}

                                            size={30}

                                        />

                                    </div>

                                </div>

                                <div className="mt-6 flex items-center gap-2 text-green-600">

                                    <ArrowUpRight size={18} />

                                    <span>

                                        12% Growth

                                    </span>

                                </div>

                            </motion.div>

                        );

                    })

                }

            </div>

            {/* ================= Subscription ================= */}

            <motion.div

                initial={{

                    opacity: 0,

                    y: 20

                }}

                animate={{

                    opacity: 1,

                    y: 0

                }}

                className="rounded-3xl bg-white shadow-xl p-8"

            >

                <div className="flex flex-col lg:flex-row justify-between gap-8">

                    <div>

                        <div className="flex items-center gap-3">

                            <CreditCard

                                className="text-blue-600"

                                size={32}

                            />

                            <h2 className="text-2xl font-bold">

                                Subscription Status

                            </h2>

                        </div>

                        <p className="text-gray-500 mt-4">

                            Manage your seller subscription and continue
                            selling products without interruption.

                        </p>

                    </div>

                    <div className="flex flex-col items-start lg:items-end">

                        <span

                            className={`

px-5

py-2

rounded-full

font-semibold

${dashboard.isSubscribed

                                    ? "bg-green-100 text-green-700"

                                    : "bg-red-100 text-red-600"

                                }

`}

                        >

                            {

                                dashboard.isSubscribed

                                    ? "Active"

                                    : "Expired"

                            }

                        </span>

                        {

                            dashboard.subscriptionEnd &&

                            <p className="text-gray-500 mt-4">

                                Valid Till

                                <br />

                                <span className="font-semibold">

                                    {

                                        new Date(

                                            dashboard.subscriptionEnd

                                        ).toLocaleDateString()

                                    }

                                </span>

                            </p>

                        }

                        <button

                            onClick={() =>
                                navigate("/seller/subscription")
                            }

                            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"

                        >

                            Manage Subscription

                        </button>

                    </div>

                </div>

            </motion.div>
            {/* ================= QUICK ACTIONS ================= */}

            <motion.div

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                className="bg-white rounded-3xl shadow-xl p-8"

            >

                <div className="flex items-center justify-between mb-8">

                    <h2 className="text-2xl font-bold">

                        Quick Actions

                    </h2>

                    <span className="text-sm text-gray-500">

                        Frequently Used

                    </span>

                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

                    <motion.button

                        whileHover={{ scale: 1.03 }}

                        whileTap={{ scale: .95 }}

                        onClick={() => navigate("/seller/products")}

                        className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white p-6 transition"

                    >

                        <Plus size={34} className="mx-auto mb-3" />

                        <h3 className="font-semibold">

                            Add Product

                        </h3>

                        <p className="text-xs text-blue-100 mt-2">

                            Create New Product

                        </p>

                    </motion.button>

                    <motion.button

                        whileHover={{ scale: 1.03 }}

                        whileTap={{ scale: .95 }}

                        onClick={() => navigate("/seller/orders")}

                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white p-6 transition"

                    >

                        <ShoppingCart size={34} className="mx-auto mb-3" />

                        <h3 className="font-semibold">

                            Orders

                        </h3>

                        <p className="text-xs text-indigo-100 mt-2">

                            Manage Orders

                        </p>

                    </motion.button>

                    <motion.button

                        whileHover={{ scale: 1.03 }}

                        whileTap={{ scale: .95 }}

                        onClick={() => navigate("/seller/returns")}

                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white p-6 transition"

                    >

                        <ShoppingCart size={34} className="mx-auto mb-3" />

                        <h3 className="font-semibold">

                            Return Orders

                        </h3>

                        <p className="text-xs text-indigo-100 mt-2">

                            Manage Return Orders

                        </p>

                    </motion.button>

                    <motion.button

                        whileHover={{ scale: 1.03 }}

                        whileTap={{ scale: .95 }}

                        onClick={() => navigate("/seller/subscription")}

                        className="rounded-2xl bg-green-600 hover:bg-green-700 text-white p-6 transition"

                    >

                        <CreditCard size={34} className="mx-auto mb-3" />

                        <h3 className="font-semibold">

                            Subscription

                        </h3>

                        <p className="text-xs text-green-100 mt-2">

                            Upgrade Plan

                        </p>

                    </motion.button>

                    <motion.button

                        whileHover={{ scale: 1.03 }}

                        whileTap={{ scale: .95 }}

                        className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white p-6 transition"

                    >

                        <TrendingUp size={34} className="mx-auto mb-3" />

                        <h3 className="font-semibold">

                            Reports

                        </h3>

                        <p className="text-xs text-orange-100 mt-2">

                            Coming Soon

                        </p>

                    </motion.button>

                </div>

            </motion.div>

            {/* ================= BUSINESS SUMMARY ================= */}

            <div className="grid lg:grid-cols-3 gap-6">

                <motion.div

                    initial={{ opacity: 0 }}

                    animate={{ opacity: 1 }}

                    className="bg-white rounded-3xl shadow-lg p-6"

                >

                    <h3 className="text-xl font-bold mb-6">

                        Business Summary

                    </h3>

                    <div className="space-y-5">

                        <div className="flex justify-between">

                            <span className="text-gray-500">

                                Products

                            </span>

                            <span className="font-semibold">

                                {dashboard.totalProducts}

                            </span>

                        </div>

                        <div className="flex justify-between">

                            <span className="text-gray-500">

                                Orders

                            </span>

                            <span className="font-semibold">

                                {dashboard.totalOrders}

                            </span>

                        </div>

                        <div className="flex justify-between">

                            <span className="text-gray-500">

                                Customers

                            </span>

                            <span className="font-semibold">

                                {dashboard.customers}

                            </span>

                        </div>

                        <div className="flex justify-between">

                            <span className="text-gray-500">

                                Revenue

                            </span>

                            <span className="font-bold text-green-600">

                                ₹{dashboard.revenue}

                            </span>

                        </div>

                    </div>

                </motion.div>

                <motion.div

                    initial={{ opacity: 0 }}

                    animate={{ opacity: 1 }}

                    className="bg-white rounded-3xl shadow-lg p-6"

                >

                    <h3 className="text-xl font-bold mb-6">

                        Inventory Status

                    </h3>

                    <div className="flex items-center justify-center h-52">

                        <div className="text-center">

                            <Package

                                className="mx-auto text-blue-600"

                                size={64}

                            />

                            <h2 className="text-4xl font-black mt-4">

                                {dashboard.totalProducts}

                            </h2>

                            <p className="text-gray-500 mt-2">

                                Products Listed

                            </p>

                        </div>

                    </div>

                </motion.div>

                <motion.div

                    initial={{ opacity: 0 }}

                    animate={{ opacity: 1 }}

                    className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-3xl shadow-xl p-6 text-white"

                >

                    <h3 className="text-xl font-bold">

                        Business Tips

                    </h3>

                    <div className="mt-6 space-y-4">

                        <div>

                            ✅ Add more products regularly

                        </div>

                        <div>

                            ✅ Keep stock updated

                        </div>

                        <div>

                            ✅ Respond to orders quickly

                        </div>

                        <div>

                            ✅ Maintain subscription active

                        </div>

                        <div>

                            ✅ Grow your revenue every month

                        </div>

                    </div>

                </motion.div>

            </div>

            {/* ================= FOOTER ================= */}

            <div className="text-center py-8 text-gray-500 text-sm">

                © {new Date().getFullYear()} SunilMedMarket Seller Portal

            </div>

        </div>

    );

}