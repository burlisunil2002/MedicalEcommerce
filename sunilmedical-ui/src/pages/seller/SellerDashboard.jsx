import { useEffect, useState } from "react";
import {
    Package,
    ShoppingCart,
    IndianRupee,
    TrendingUp,
    AlertTriangle,
    Users,
    ArrowUpRight
} from "lucide-react";

import API from "../../services/api";
export default function SellerDashboard() {

    const [dashboard, setDashboard] = useState({

        sellerName: "Seller",

        totalProducts: 0,

        totalOrders: 0,

        revenue: 0,

        pendingOrders: 0,

        lowStock: 0,

        customers: 0,

        growth: 18

    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const { data } = await API.get("/api/Seller/dashboard");

            setDashboard({

                sellerName: data.sellerName,

                totalProducts: data.totalProducts,

                totalOrders: data.totalOrders,

                revenue: data.revenue,

                pendingOrders: data.pendingOrders ?? 0,

                lowStock: data.lowStock ?? 0,

                customers: data.customers ?? 0,

                growth: data.growth ?? 18

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
            color: "blue"
        },

        {
            title: "Orders",
            value: dashboard.totalOrders,
            icon: ShoppingCart,
            color: "indigo"
        },

        {
            title: "Revenue",
            value: `₹${dashboard.revenue}`,
            icon: IndianRupee,
            color: "green"
        },

        {
            title: "Customers",
            value: dashboard.customers,
            icon: Users,
            color: "purple"
        },

        {
            title: "Pending",
            value: dashboard.pendingOrders,
            icon: TrendingUp,
            color: "orange"
        },

        {
            title: "Low Stock",
            value: dashboard.lowStock,
            icon: AlertTriangle,
            color: "red"
        }

    ];

    if (loading) {

        return (

            <div className="flex justify-center items-center h-[70vh]">

                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600" />

            </div>

        );

    }

    return (

        <div className="space-y-8">

            <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white p-10 shadow-xl">

                <div className="flex justify-between items-center">

                    <div>

                        <h1 className="text-4xl font-black">

                            Welcome Back 👋

                        </h1>

                        <p className="mt-3 text-blue-100">

                            {dashboard.sellerName}

                        </p>

                        <p className="mt-5 text-lg">

                            Manage your products, orders and business from one dashboard.

                        </p>

                    </div>

                    <div className="hidden lg:block">

                        <div className="bg-white/20 rounded-2xl px-8 py-5">

                            <p className="text-sm">

                                Business Growth

                            </p>

                            <p className="text-4xl font-black mt-2">

                                +{dashboard.growth}%

                            </p>

                        </div>

                    </div>

                </div>

            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

                {

                    cards.map((card) => {

                        const Icon = card.icon;

                        return (

                            <div

                                key={card.title}

                                className="bg-white rounded-3xl shadow hover:shadow-xl transition p-8"

                            >

                                <div className="flex justify-between">

                                    <div>

                                        <p className="text-gray-500">

                                            {card.title}

                                        </p>

                                        <h2 className="text-4xl font-bold mt-4">

                                            {card.value}

                                        </h2>

                                    </div>

                                    <div className={`

w-16

h-16

rounded-2xl

flex

items-center

justify-center

bg-${card.color}-100

`}

                                    >

                                        <Icon

                                            className={`text-${card.color}-600`}

                                            size={30}

                                        />

                                    </div>

                                </div>

                                <div className="mt-8 flex items-center gap-2 text-green-600">

                                    <ArrowUpRight size={18} />

                                    12% this month

                                </div>

                            </div>

                        );

                    })

                }

            </div>
            <div className="bg-white rounded-3xl shadow p-8">

                <h2 className="text-2xl font-bold mb-8">

                    Quick Actions

                </h2>

                <div className="grid md:grid-cols-4 gap-6">

                    <button className="rounded-xl bg-blue-600 text-white py-4 hover:bg-blue-700">

                        + Add Product

                    </button>

                    <button className="rounded-xl bg-indigo-600 text-white py-4">

                        Orders

                    </button>

                    <button className="rounded-xl bg-green-600 text-white py-4">

                        Subscription

                    </button>

                    <button className="rounded-xl bg-orange-500 text-white py-4">

                        Reports

                    </button>

                </div>

            </div>
        </div>

    );
}
