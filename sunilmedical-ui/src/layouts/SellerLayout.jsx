import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    CreditCard,
    Bell,
    User,
    LogOut,
    Menu,
    Search
} from "lucide-react";

export default function SellerLayout() {

    const navigate = useNavigate();

    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const titles = {
        "/seller/dashboard": "Dashboard",
        "/seller/products": "Product Management",
        "/seller/orders": "Order Management",
        "/seller/subscription": "Subscription"
    };

    const menuItems = [

        {
            name: "Dashboard",
            icon: LayoutDashboard,
            path: "/seller/dashboard"
        },

        {
            name: "Product Management",
            icon: Package,
            path: "/seller/products"
        },

        {
            name: "Order Management",
            icon: ShoppingCart,
            path: "/seller/orders"
        },

        {
            name: "Subscription",
            icon: CreditCard,
            path: "/seller/subscription"
        }

    ];

    const logout = () => {

        localStorage.removeItem("seller");
        localStorage.removeItem("token");
        sessionStorage.clear();

        navigate("/seller-login");

    };

    const seller =
        JSON.parse(localStorage.getItem("seller"));

    return (

        <div className="min-h-screen bg-slate-100">

            {/* Mobile Overlay */}

            {
                sidebarOpen &&

                <div

                    onClick={() => setSidebarOpen(false)}

                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"

                />

            }
            <motion.aside

                initial={{ x: -300 }}

                animate={{ x: 0 }}

                className={`

fixed

top-0

left-0

h-screen

w-72

bg-white

shadow-2xl

z-50

transition-all

duration-300

${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

lg:translate-x-0

`}

            >

                <div className="p-8 border-b">

                    <h1 className="text-2xl font-black text-blue-600">

                        MedMarket

                    </h1>

                    <p className="text-gray-500 mt-2">

                        Seller Portal

                    </p>

                </div>
                <nav className="p-5 space-y-2">

                    {

                        menuItems.map(item => {

                            const Icon = item.icon;

                            const active =

                                location.pathname === item.path;

                            return (

                                <button

                                    key={item.path}

                                    onClick={() => {

                                        navigate(item.path);

                                        setSidebarOpen(false);

                                    }}

                                    className={`

w-full

flex

items-center

gap-4

px-5

py-3

rounded-xl

transition

${active

                                            ?

                                            "bg-blue-600 text-white"

                                            :

                                            "text-gray-600 hover:bg-blue-50"

                                        }

`}

                                >

                                    <Icon size={20} />

                                    {item.name}

                                </button>

                            );

                        })

                    }

                </nav>
                <div className="absolute bottom-6 left-0 w-full px-5">

                    <button

                        onClick={logout}

                        className="w-full flex items-center justify-center gap-3 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition"

                    >

                        <LogOut />

                        Logout

                    </button>

                </div>

            </motion.aside>
            <div className="lg:ml-72">

                <header className="sticky top-0 bg-white shadow-sm z-30">

                    <div className="flex items-center justify-between px-6 py-4">

                        <div className="flex items-center gap-4">

                            <button

                                onClick={() => setSidebarOpen(true)}

                                className="lg:hidden"

                            >

                                <Menu />

                            </button>

                            <h2 className="font-bold text-xl">
                                {titles[location.pathname] || "Seller Portal"}
                            </h2>

                        </div>
                        <div className="flex items-center gap-5">

                            

                            <div className="hidden md:flex items-center gap-3">

                                <div>

                                    <p className="font-semibold">

                                        <p className="font-semibold">
                                            {seller?.businessName || "Seller"}
                                        </p>

                                    </p>

                                    <p className="text-sm text-gray-500">

                                        <p className="text-sm text-gray-500">
                                            {seller?.status || "Verified"}
                                        </p>

                                    </p>

                                </div>

                                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center">

                                    <User />

                                </div>

                            </div>

                        </div>

                    </div>

                </header>
                <main className="p-8">

                    <Outlet />

                </main>

            </div>

        </div>

    );

}