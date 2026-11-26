import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    RotateCcw,
    Bell,
    LogOut,
    Menu,
    ChevronRight,
    X,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";

const NAV_ITEMS = [
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
        name: "Return Order Management",
        icon: RotateCcw,
        path: "/seller/returns"
    }
];

const PAGE_TITLES = [
    { path: "/seller/dashboard", title: "Dashboard" },
    { path: "/seller/products", title: "Product Management" },
    { path: "/seller/orders", title: "Order Management" },
    { path: "/seller/returns", title: "Return Order Management" }
];

function readSeller() {
    try {
        return JSON.parse(localStorage.getItem("seller") || "null");
    } catch {
        return null;
    }
}

export default function SellerLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [seller] = useState(readSeller);

    const pageTitle = useMemo(() => {
        const match = PAGE_TITLES
            .filter(item =>
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`)
            )
            .sort((a, b) => b.path.length - a.path.length)[0];

        return match?.title || "Seller Portal";
    }, [location.pathname]);

    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileSidebarOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const closeOnEscape = event => {
            if (event.key === "Escape") setMobileSidebarOpen(false);
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [mobileSidebarOpen]);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Logout?",
            text: "Are you sure you want to log out of the seller portal?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Logout",
            cancelButtonText: "Stay signed in",
            confirmButtonColor: "#dc2626",
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        // Keep the existing application logout behavior.
        localStorage.clear();
        sessionStorage.clear();
        navigate("/seller-login", { replace: true });
    };

    const isActive = path =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col",
                    "border-r border-slate-200 bg-white shadow-xl",
                    "transition-[width,transform] duration-300 ease-in-out",
                    mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:translate-x-0",
                    desktopCollapsed ? "lg:w-[5.25rem]" : "lg:w-72"
                ].join(" ")}
            >
                {/* Brand */}
                <div className={`flex h-[76px] shrink-0 items-center border-b border-slate-100 px-4 ${desktopCollapsed ? "lg:justify-center" : "justify-between"}`}>
                    {!desktopCollapsed && (
                        <button
                            type="button"
                            onClick={() => navigate("/seller/dashboard")}
                            className="min-w-0 text-left"
                            aria-label="Go to seller dashboard"
                        >
                            <span className="block truncate text-xl font-black tracking-tight text-blue-700">
                                JEDEMedMarket
                            </span>
                            <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                Seller Portal
                            </span>
                        </button>
                    )}

                    {desktopCollapsed && (
                        <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white lg:flex">
                            J
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(false)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setDesktopCollapsed(value => !value)}
                        className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
                        aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {desktopCollapsed
                            ? <PanelLeftOpen size={19} />
                            : <PanelLeftClose size={19} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Seller navigation">
                    <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${desktopCollapsed ? "lg:hidden" : ""}`}>
                        Workspace
                    </p>

                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileSidebarOpen(false);
                                }}
                                title={desktopCollapsed ? item.name : undefined}
                                aria-current={active ? "page" : undefined}
                                className={[
                                    "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left",
                                    "text-sm font-semibold transition-all duration-200",
                                    desktopCollapsed ? "lg:justify-center lg:px-2" : "",
                                    active
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                ].join(" ")}
                            >
                                <Icon size={19} className="shrink-0" />
                                <span className={`min-w-0 flex-1 truncate ${desktopCollapsed ? "lg:hidden" : ""}`}>
                                    {item.name}
                                </span>
                                {!desktopCollapsed && (
                                    <ChevronRight
                                        size={16}
                                        className={`shrink-0 transition-transform ${active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Seller profile + logout */}
                <div className="shrink-0 border-t border-slate-100 p-3">
                    {!desktopCollapsed && (
                        <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white">
                                {seller?.businessName?.trim()?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                    {seller?.businessName || "Seller Account"}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {seller?.email || "Seller Portal"}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        title={desktopCollapsed ? "Logout" : undefined}
                        className={`flex w-full items-center justify-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 ${desktopCollapsed ? "lg:px-2" : ""}`}
                    >
                        <LogOut size={19} />
                        <span className={desktopCollapsed ? "lg:hidden" : ""}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main application area */}
            <div
                className={[
                    "min-h-screen min-w-0 transition-[margin] duration-300",
                    desktopCollapsed ? "lg:ml-[5.25rem]" : "lg:ml-72"
                ].join(" ")}
            >
                {/* Top header */}
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
                    <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(true)}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                                aria-label="Open navigation menu"
                            >
                                <Menu size={21} />
                            </button>

                            <div className="min-w-0">
                                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                                    {pageTitle}
                                </h1>
                                <p className="hidden text-xs text-slate-500 sm:mt-1 sm:block">
                                    Manage your seller workspace
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="max-w-[180px] truncate text-sm font-bold text-slate-800">
                                    {seller?.businessName || "Seller"}
                                </p>
                                <p className="max-w-[180px] truncate text-xs text-slate-500">
                                    {seller?.email || ""}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                                {seller?.businessName?.trim()?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Routed page content */}
                <main className="min-h-[calc(100vh-132px)] min-w-0 p-3 sm:p-5 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="mx-auto w-full max-w-[1600px] min-w-0"
                    >
                        <Outlet />
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} JEDEMedMarket Seller Portal
                        </p>
                        <p className="text-xs text-slate-400">
                            Powered by JEDE Medical Products
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
