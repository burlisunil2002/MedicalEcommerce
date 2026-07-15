import { useState, useEffect } from "react";

import {
    Outlet,
    useNavigate,
    useLocation
} from "react-router-dom";

import { motion } from "framer-motion";

import Swal from "sweetalert2";

import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    CreditCard,
    Bell,
    LogOut,
    Menu,
    ChevronRight,
    BadgeCheck,
    X
} from "lucide-react";
export default function SellerLayout() {

    const navigate = useNavigate();

    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const seller =
        JSON.parse(
            localStorage.getItem("seller")
        );

    const titles = {

        "/seller/dashboard":
            "Dashboard",

        "/seller/products":
            "Product Management",

        "/seller/orders":
            "Order Management",

        "/seller/subscription":
            "Subscription"

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

        Swal.fire({

            title: "Logout?",

            text: "Are you sure you want to logout?",

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Logout",

            confirmButtonColor: "#2563eb"

        }).then(result => {

            if (!result.isConfirmed)
                return;

            localStorage.clear();

            sessionStorage.clear();

            navigate("/seller-login");

        });

    };

    const toggleSidebar = () => {

        if (window.innerWidth >= 1024) {

            setDesktopCollapsed(prev => !prev);

        } else {

            setSidebarOpen(prev => !prev);

        }

    };

    useEffect(() => {

        if (sidebarOpen) {

            document.body.style.overflow = "hidden";

        }

        else {

            document.body.style.overflow = "auto";

        }

        return () => {

            document.body.style.overflow = "auto";

        };

    }, [sidebarOpen]);

    useEffect(() => {

        if (window.innerWidth >= 1024) {

            setSidebarOpen(true);

        }

    }, []);

    return (

        <div className="min-h-screen bg-slate-100">

            {
                sidebarOpen &&

                <div

                    onClick={() =>
                        setSidebarOpen(false)
                    }

                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"

                />

            }

            <motion.aside
                initial={false}
                animate={{
                    x: sidebarOpen ? 0 : -320
                }}
                transition={{
                    duration: 0.3
                }}
                className={`
fixed
top-0
left-0
h-screen
bg-white
shadow-2xl
z-50
transition-all
duration-300
ease-in-out

${desktopCollapsed ? "lg:w-20" : "lg:w-72"}

w-72

${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

lg:translate-x-0
`}            >

                {/* Logo */}


                <div className="flex items-center justify-between p-6 border-b">

                    {

                        !desktopCollapsed &&

                        <div>

                            <h1 className="text-2xl font-black text-blue-600">

                                SunilMedMarket

                            </h1>

                            <p className="text-sm text-gray-500">

                                Seller Portal

                            </p>

                        </div>

                    }

                    <button

                        onClick={toggleSidebar}

                        className="p-2 rounded-lg hover:bg-gray-100"

                    >

                        {

                            (window.innerWidth >= 1024)

                                ?

                                (desktopCollapsed ? <Menu size={22} /> : <X size={22} />)

                                :

                                <X size={22} />

                        }

                    </button>

                </div>
                

                {/* Menu */}

                <nav className="flex-1 p-4 overflow-y-auto">

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

mb-2

flex

items-center

justify-between

px-4

py-3

rounded-xl

transition-all

duration-300

${active

                                            ?

                                            "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"

                                            :

                                            "hover:bg-slate-100 text-slate-700"

                                        }

`}

                                >

                                    <div className="flex items-center gap-3">

                                        <Icon size={20} />

                                        {

                                            !desktopCollapsed && item.name

                                        }
                                    </div>

                                    <ChevronRight size={18} />

                                </button>

                            );

                        })

                    }

                </nav>
                {/* Logout */}

                <div className="p-4 border-t bg-white">

                    <button

                        onClick={logout}

                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"

                    >

                        <LogOut size={20} />

                        {

                            !desktopCollapsed &&

                            "Logout"

                        }
                    </button>

                </div>

            </motion.aside>

            {/* ==========================
                Main Content
            ========================== */}

            <div
                className={`
transition-all
duration-300
${desktopCollapsed ? "lg:ml-20" : "lg:ml-72"}
`}
            >
                {/* Header */}

                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b shadow-sm">

                    <div className="flex items-center justify-between px-4 md:px-8 h-20">

                        {/* Left */}

                        <div className="flex items-center gap-4">

                            <button

                                onClick={() =>
                                    setSidebarOpen(true)
                                }

                                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"

                            >

                                <Menu size={24} />

                            </button>

                            <div>

                                <h1 className="text-xl md:text-3xl font-bold text-slate-800">

                                    {titles[location.pathname] || "Seller Portal"}

                                </h1>

                                <p className="text-sm text-slate-500 hidden md:block">

                                    Welcome back 👋

                                </p>

                            </div>

                        </div>

                        {/* Right */}

                        <div className="flex items-center gap-4">

                            {/* Notification */}

                            <button className="relative p-3 rounded-xl bg-slate-100 hover:bg-blue-50 transition">

                                <Bell size={22} />

                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">

                                    0

                                </span>

                            </button>

                            {/* Seller */}

                            {

                                !desktopCollapsed &&

                                <div className="hidden md:flex items-center gap-3">
                                    <div className="text-right">

                                        <h3 className="font-semibold text-slate-800">

                                            {seller?.businessName || "Seller"}

                                        </h3>

                                        <p className="text-xs text-slate-500">

                                            {seller?.email || "seller@medmarket.com"}

                                        </p>

                                    </div>

                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow">

                                        {seller?.businessName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "S"}

                                    </div>

                                </div>
                            }

                        </div>

                    </div>

                </header>

                {/* Page Content */}

                <main className="flex-1 p-4 md:p-8">

                    <motion.div

                        initial={{
                            opacity: 0,
                            y: 25
                        }}

                        animate={{
                            opacity: 1,
                            y: 0
                        }}

                        transition={{
                            duration: .35
                        }}

                    >

                        <Outlet />

                    </motion.div>

                </main>

                {/* Footer */}

                <footer className="border-t bg-white px-6 py-4">

                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">

                        <p className="text-sm text-slate-500">

                            © {new Date().getFullYear()} MedMarket Seller Portal

                        </p>

                        <p className="text-sm text-slate-400">

                            Powered by Sunil Medical Products

                        </p>

                    </div>

                </footer>

            </div>

        </div>

    );

}
