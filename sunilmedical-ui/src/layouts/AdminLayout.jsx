import React, { useState } from "react";
import {
    NavLink,
    Outlet,
    useNavigate
} from "react-router-dom";

import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    RotateCcw,
    Users,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ShieldCheck
} from "lucide-react";

import API from "../services/api";
import toast from "react-hot-toast";


export default function AdminLayout() {

    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);


    // =====================================================
    // ADMIN MENU
    // =====================================================

    const menuItems = [
        {
            label: "Dashboard",
            path: "/admin/dashboard",
            icon: LayoutDashboard
        },
        {
            label: "Order Management",
            path: "/admin/orders",
            icon: ShoppingCart
        },
        {
            label: "Product Management",
            path: "/admin/products",
            icon: Package
        },
        {
            label: "Return Order Management",
            path: "/admin/returns",
            icon: RotateCcw
        },
        {
            label: "Users",
            path: "/admin/users",
            icon: Users
        },
        {
            label: "Enquiries",
            path: "/admin/enquiries",
            icon: MessageSquare
        }
    ];


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = async () => {

        if (loggingOut) {
            return;
        }

        try {

            setLoggingOut(true);

            await API.post("/api/account/logout");

            toast.success(
                "Logged out successfully."
            );

        } catch (error) {

            console.error(
                "Admin logout error:",
                error
            );

        } finally {

            // Always leave the admin portal.
            window.location.href = "/admin-login";

        }
    };


    // =====================================================
    // CLOSE MOBILE MENU
    // =====================================================

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };


    return (
        <div className="min-h-screen bg-slate-100">


            {/* =================================================
                MOBILE TOP BAR
            ================================================= */}

            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200">

                <div className="h-full px-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                            <ShieldCheck size={21} />
                        </div>

                        <div>
                            <h1 className="text-base font-bold text-slate-900">
                                SunilMedMarket
                            </h1>

                            <p className="text-[11px] text-slate-500">
                                Admin Portal
                            </p>
                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            setMobileOpen(
                                previous => !previous
                            )
                        }
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 transition"
                        aria-label="Toggle admin menu"
                    >

                        {mobileOpen ? (
                            <X size={23} />
                        ) : (
                            <Menu size={23} />
                        )}

                    </button>

                </div>

            </header>


            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close admin menu"
                    onClick={closeMobileMenu}
                    className="lg:hidden fixed inset-0 z-40 bg-black/40"
                />
            )}


            <div className="flex min-h-screen">


                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside
                    className={`
                        fixed
                        lg:sticky
                        top-0
                        left-0
                        z-50
                        h-screen
                        w-72
                        bg-white
                        border-r
                        border-slate-200
                        flex
                        flex-col
                        transition-transform
                        duration-300
                        ease-in-out
                        ${mobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                        }
                    `}
                >


                    {/* =================================================
                        BRAND
                    ================================================= */}

                    <div className="h-20 px-5 border-b border-slate-200 flex items-center">

                        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">

                            <ShieldCheck size={23} />

                        </div>


                        <div className="ml-3">

                            <h1 className="text-lg font-bold text-slate-900">
                                SunilMedMarket
                            </h1>

                            <p className="text-xs text-slate-500">
                                Admin Portal
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        ADMIN PROFILE
                    ================================================= */}

                    <div className="px-4 pt-5">

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">

                                    A

                                </div>

                                <div className="min-w-0">

                                    <p className="font-semibold text-slate-900 truncate">
                                        Administrator
                                    </p>

                                    <p className="text-xs text-slate-500 flex items-center gap-1">

                                        <ShieldCheck
                                            size={13}
                                        />

                                        Admin Access

                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        NAVIGATION
                    ================================================= */}

                    <nav className="flex-1 px-4 py-5 overflow-y-auto">

                        <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Administration
                        </p>


                        <div className="space-y-1.5">

                            {menuItems.map(
                                item => {

                                    const Icon =
                                        item.icon;

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={
                                                closeMobileMenu
                                            }
                                            className={({
                                                isActive
                                            }) =>
                                                `
                                                group
                                                flex
                                                items-center
                                                gap-3
                                                px-3
                                                py-3
                                                rounded-xl
                                                font-medium
                                                transition-all
                                                duration-200
                                                ${isActive
                                                    ? "bg-blue-600 text-white shadow-md"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                }
                                                `
                                            }
                                        >

                                            {({
                                                isActive
                                            }) => (
                                                <>
                                                    <span
                                                        className={`
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            flex
                                                            items-center
                                                            justify-center
                                                            flex-shrink-0
                                                            ${isActive
                                                                ? "bg-white/15"
                                                                : "bg-slate-100 group-hover:bg-white"
                                                            }
                                                        `}
                                                    >

                                                        <Icon
                                                            size={19}
                                                        />

                                                    </span>


                                                    <span className="flex-1">
                                                        {item.label}
                                                    </span>


                                                    <ChevronRight
                                                        size={17}
                                                        className={`
                                                            transition-transform
                                                            ${isActive
                                                                ? "translate-x-0 opacity-100"
                                                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                                            }
                                                        `}
                                                    />

                                                </>
                                            )}

                                        </NavLink>
                                    );

                                }
                            )}

                        </div>

                    </nav>


                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <div className="p-4 border-t border-slate-200">

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="
                                w-full
                                h-12
                                flex
                                items-center
                                justify-center
                                gap-3
                                rounded-xl
                                bg-red-500
                                hover:bg-red-600
                                disabled:bg-red-300
                                text-white
                                font-semibold
                                transition
                                shadow-sm
                            "
                        >

                            <LogOut size={19} />

                            <span>
                                {loggingOut
                                    ? "Logging out..."
                                    : "Logout"}
                            </span>

                        </button>

                    </div>

                </aside>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main className="flex-1 min-w-0">

                    {/* Mobile spacing */}
                    <div className="lg:hidden h-16" />

                    <Outlet />

                </main>

            </div>

        </div>
    );
}