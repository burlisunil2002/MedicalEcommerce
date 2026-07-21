import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function AdminDashboard() {

    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        revenue: 0
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {

            const res = await API.get(
                "/api/admin/admin-dashboard"
            );

            setStats(res.data);

        } catch {
            navigate("/admin-login");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">

            {/* Top Bar */}

            <div className="bg-white shadow px-6 py-4">

                <h1 className="text-3xl font-bold">
                    Admin Dashboard
                </h1>

            </div>

            <div className="flex">

                {/* Sidebar */}

                <div className="w-72 bg-slate-900 min-h-screen text-white">

                    <div className="p-6 border-b border-slate-700">

                        <h2 className="text-xl font-bold">
                            Admin Panel
                        </h2>

                    </div>

                    <div className="p-4 space-y-2">

                        <button
                            onClick={() =>
                                navigate("/products")
                            }
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700"
                        >
                            📦 Explore Products
                        </button>

                        <button
                            onClick={() =>
                                navigate("/product-management")
                            }
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700"
                        >
                            ✏️ Product Management
                        </button>

                        <button
                            onClick={() =>
                                navigate("/enquiries")
                            }
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700"
                        >
                            📋 Enquiry List
                        </button>

                        <button
                            onClick={() =>
                                navigate("/admin-orders")
                            }
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700"
                        >
                            🛒 Orders Management
                        </button>

                        <button
                            onClick={() =>
                                navigate("/admin/returns")
                            }
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700"
                        >
                            🛒 Return Orders Management
                        </button>

                        <button
                            onClick={async () => {

                                try {

                                    await API.post(
                                        "/api/account/logout"
                                    );

                                    localStorage.removeItem("role");

                                    navigate("/admin-login");

                                }
                                catch {

                                    navigate("/admin-login");

                                }

                            }}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500"
                        >
                            🚪 Logout
                        </button>

                    </div>

                </div>

                {/* Main */}

                <div className="flex-1 p-8">

                    <div className="grid md:grid-cols-4 gap-6">

                        <div className="bg-white rounded-3xl p-6 shadow">

                            <h3 className="text-gray-500">
                                Products
                            </h3>

                            <p className="text-4xl font-bold mt-2">
                                {stats.totalProducts}
                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow">

                            <h3 className="text-gray-500">
                                Orders
                            </h3>

                            <p className="text-4xl font-bold mt-2">
                                {stats.totalOrders}
                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow">

                            <h3 className="text-gray-500">
                                Users
                            </h3>

                            <p className="text-4xl font-bold mt-2">
                                {stats.totalUsers}
                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow">

                            <h3 className="text-gray-500">
                                Revenue
                            </h3>

                            <p className="text-4xl font-bold mt-2">
                                ₹{stats.revenue}
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}