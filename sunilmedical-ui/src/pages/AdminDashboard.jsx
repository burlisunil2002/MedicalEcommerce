
import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Activity,
    ArrowUpRight,
    BarChart3,
    Boxes,
    CheckCircle2,
    Clock3,
    CreditCard,
    IndianRupee,
    LayoutDashboard,
    Package,
    RefreshCw,
    RotateCcw,
    ShoppingCart,
    Truck,
    Users,
    XCircle
} from "lucide-react";

import API from "../services/api";
import toast from "react-hot-toast";
export default function AdminDashboard() {

    // =========================================================
    // STATE
    // =========================================================

    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        revenue: 0,

        totalOrderItems: 0,
        completedItems: 0,
        pendingItems: 0,

        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,

        deliveredItems: 0,
        shippedItems: 0,
        outForDeliveryItems: 0,
        placedItems: 0,
        packedItems: 0,
        cancelledItems: 0
    });


    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);


    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = useCallback(
        async (isRefresh = false) => {

            try {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }


                const response =
                    await API.get(
                        "/api/admin/dashboard"
                    );


                const data =
                    response?.data || {};

                console.log(
                    "ADMIN DASHBOARD DATA:",
                    data
                );


                setStats({
                    totalProducts:
                        Number(
                            data.totalProducts || 0
                        ),

                    totalOrders:
                        Number(
                            data.totalOrders || 0
                        ),

                    totalUsers:
                        Number(
                            data.totalUsers || 0
                        ),

                    revenue:
                        Number(
                            data.revenue || 0
                        ),

                    totalOrderItems:
                        Number(
                            data.totalOrderItems || 0
                        ),

                    completedItems:
                        Number(
                            data.completedItems || 0
                        ),

                    pendingItems:
                        Number(
                            data.pendingItems || 0
                        ),

                    completedPayments:
                        Number(
                            data.completedPayments || 0
                        ),

                    pendingPayments:
                        Number(
                            data.pendingPayments || 0
                        ),

                    failedPayments:
                        Number(
                            data.failedPayments || 0
                        ),

                    refundedPayments:
                        Number(
                            data.refundedPayments || 0
                        ),

                    deliveredItems:
                        Number(
                            data.deliveredItems || 0
                        ),

                    shippedItems:
                        Number(
                            data.shippedItems || 0
                        ),

                    outForDeliveryItems:
                        Number(
                            data.outForDeliveryItems || 0
                        ),

                    placedItems:
                        Number(
                            data.placedItems || 0
                        ),

                    packedItems:
                        Number(
                            data.packedItems || 0
                        ),

                    cancelledItems:
                        Number(
                            data.cancelledItems || 0
                        )
                });


            } catch (error) {

                console.error(
                    "ADMIN DASHBOARD API ERROR:",
                    error?.response?.status,
                    error?.response?.data,
                    error
                );


                if (
                    error?.response?.status === 401 ||
                    error?.response?.status === 403
                ) {

                    toast.error(
                        "Admin access required."
                    );

                    setTimeout(() => {
                        window.location.href = "/admin-login";
                    }, 800);

                } else {

                    toast.error(
                        error?.response?.data?.message ||
                        "Unable to load dashboard."
                    );

                }

            } finally {

                setLoading(false);
                setRefreshing(false);

            }

        },
        []
    );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadDashboard();

    }, [
        loadDashboard
    ]);



    // =========================================================
    // COMPLETION RATE
    // =========================================================

    const completionRate = useMemo(() => {

        if (
            stats.totalOrderItems <= 0
        ) {
            return 0;
        }

        return Math.round(
            (
                stats.completedItems /
                stats.totalOrderItems
            ) * 100
        );

    }, [
        stats.completedItems,
        stats.totalOrderItems
    ]);


    // =========================================================
    // PAYMENT SUCCESS RATE
    // =========================================================

    const paymentSuccessRate = useMemo(() => {

        const total =
            stats.completedPayments +
            stats.pendingPayments +
            stats.failedPayments +
            stats.refundedPayments;

        if (total <= 0) {
            return 0;
        }

        return Math.round(
            (
                stats.completedPayments /
                total
            ) * 100
        );

    }, [stats]);


    const paymentTotal =
        stats.completedPayments +
        stats.pendingPayments +
        stats.failedPayments +
        stats.refundedPayments;


    // =========================================================
    // CURRENCY FORMATTER
    // =========================================================

    const formatCurrency = value => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        );

    };


    // =========================================================
    // NUMBER FORMATTER
    // =========================================================

    const formatNumber = value => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-IN"
        );

    };


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = async () => {

        try {

            await API.post(
                "/api/account/logout"
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        } finally {

            localStorage.removeItem(
                "role"
            );

            navigate(
                "/admin-login"
            );

        }

    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">

                    <div className="w-14 h-14 mx-auto rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />

                    <h2 className="text-lg font-bold text-slate-800 mt-5">
                        Loading Admin Dashboard
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Preparing your business overview...
                    </p>

                </div>

            </div>
        );

    }


    // =========================================================
    // MAIN
    // =========================================================

    return (

        <div className="min-h-screen bg-slate-100">


            {/* =====================================================
                TOP HEADER
            ===================================================== */}

            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="h-20 flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">

                                <LayoutDashboard
                                    size={23}
                                    className="text-white"
                                />

                            </div>


                            <div>

                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    Admin Dashboard
                                </h1>

                                <p className="hidden sm:block text-xs text-slate-500">
                                    Business overview & performance
                                </p>

                            </div>

                        </div>


                        <div className="flex items-center gap-2 sm:gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    loadDashboard(true)
                                }
                                disabled={refreshing}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                            >

                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                <span className="hidden sm:inline">
                                    Refresh
                                </span>

                            </button>


                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-3 sm:px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            </header>


            {/* =====================================================
                CONTENT
            ===================================================== */}

            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">


                {/* =================================================
                    WELCOME BANNER
                ================================================= */}

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 mb-6 shadow-xl">

                    <div className="relative z-10 max-w-3xl">

                        <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">
                            Business Overview
                        </p>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">
                            Welcome back, Admin
                        </h2>

                        <p className="text-blue-100 mt-3 max-w-2xl">
                            Monitor orders, payments, deliveries and
                            revenue from one place.
                        </p>


                        <div className="flex flex-wrap gap-3 mt-6">

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href = "/admin/orders"
                                }
                                className="px-5 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition"
                            >
                                View Orders
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href = "/product-management"
                                }
                                className="px-5 py-3 rounded-xl bg-white/15 border border-white/30 text-white font-bold hover:bg-white/20 transition"
                            >
                                Manage Products
                            </button>

                        </div>

                    </div>


                    <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />

                    <div className="absolute right-20 -bottom-32 w-80 h-80 rounded-full bg-white/10" />

                </div>


                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">


                    {/* PRODUCTS */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-semibold text-slate-500">
                                    Total Products
                                </p>

                                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                                    {formatNumber(
                                        stats.totalProducts
                                    )}
                                </h3>

                                <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">

                                    <ArrowUpRight
                                        size={14}
                                    />

                                    Product catalogue

                                </p>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">

                                <Boxes
                                    size={24}
                                    className="text-blue-600"
                                />

                            </div>

                        </div>

                    </div>


                    {/* ORDERS */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-semibold text-slate-500">
                                    Total Orders
                                </p>

                                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                                    {formatNumber(
                                        stats.totalOrders
                                    )}
                                </h3>

                                <p className="text-xs text-blue-600 font-semibold mt-3 flex items-center gap-1">

                                    <ShoppingCart
                                        size={14}
                                    />

                                    Marketplace orders

                                </p>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">

                                <ShoppingCart
                                    size={24}
                                    className="text-indigo-600"
                                />

                            </div>

                        </div>

                    </div>


                    {/* USERS */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-semibold text-slate-500">
                                    Total Users
                                </p>

                                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                                    {formatNumber(
                                        stats.totalUsers
                                    )}
                                </h3>

                                <p className="text-xs text-purple-600 font-semibold mt-3 flex items-center gap-1">

                                    <Users
                                        size={14}
                                    />

                                    Registered customers

                                </p>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">

                                <Users
                                    size={24}
                                    className="text-purple-600"
                                />

                            </div>

                        </div>

                    </div>


                    {/* REVENUE */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-semibold text-slate-500">
                                    Completed Revenue
                                </p>

                                <h3 className="text-3xl font-bold text-emerald-600 mt-3">
                                    ₹
                                    {formatCurrency(
                                        stats.revenue
                                    )}
                                </h3>

                                <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">

                                    <CheckCircle2
                                        size={14}
                                    />

                                    Paid + Delivered

                                </p>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">

                                <IndianRupee
                                    size={24}
                                    className="text-emerald-600"
                                />

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    PERFORMANCE CARDS
                ================================================= */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">


                    {/* COMPLETION */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500 font-semibold">
                                    Order Completion
                                </p>

                                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                    {completionRate}%
                                </h3>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">

                                <CheckCircle2
                                    size={24}
                                    className="text-emerald-600"
                                />

                            </div>

                        </div>


                        <div className="mt-5 h-3 rounded-full bg-slate-100 overflow-hidden">

                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                style={{
                                    width: `${Math.min(
                                        completionRate,
                                        100
                                    )}%`
                                }}
                            />

                        </div>


                        <div className="flex justify-between text-xs mt-3">

                            <span className="text-slate-500">
                                Completed
                            </span>

                            <span className="font-bold text-emerald-600">
                                {formatNumber(
                                    stats.completedItems
                                )}
                            </span>

                        </div>

                    </div>


                    {/* PAYMENT SUCCESS */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500 font-semibold">
                                    Payment Success
                                </p>

                                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                    {paymentSuccessRate}%
                                </h3>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">

                                <CreditCard
                                    size={24}
                                    className="text-blue-600"
                                />

                            </div>

                        </div>


                        <div className="mt-5 h-3 rounded-full bg-slate-100 overflow-hidden">

                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                                style={{
                                    width: `${Math.min(
                                        paymentSuccessRate,
                                        100
                                    )}%`
                                }}
                            />

                        </div>


                        <div className="flex justify-between text-xs mt-3">

                            <span className="text-slate-500">
                                Successful payments
                            </span>

                            <span className="font-bold text-blue-600">
                                {formatNumber(
                                    stats.completedPayments
                                )}
                            </span>

                        </div>

                    </div>


                    {/* PENDING */}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500 font-semibold">
                                    Pending Orders
                                </p>

                                <h3 className="text-3xl font-bold text-amber-500 mt-2">
                                    {formatNumber(
                                        stats.pendingItems
                                    )}
                                </h3>

                            </div>


                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">

                                <Clock3
                                    size={24}
                                    className="text-amber-600"
                                />

                            </div>

                        </div>


                        <p className="text-xs text-slate-500 mt-5">
                            Orders not yet fully completed
                            and delivered.
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                window.location.href = "/admin/orders"
                            }
                            className="mt-4 text-sm font-bold text-amber-600 hover:text-amber-700"
                        >
                            View pending orders →
                        </button>

                    </div>

                </div>


                {/* =================================================
                    CHARTS
                ================================================= */}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">

                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">

                        <div className="flex items-center justify-between mb-6">

                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Payment Overview
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    Current payment status distribution
                                </p>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <CreditCard
                                    size={20}
                                    className="text-blue-600"
                                />
                            </div>

                        </div>

                        <div className="space-y-5">

                            <DashboardBar
                                label="Completed"
                                value={stats.completedPayments}
                                total={paymentTotal}
                                className="bg-emerald-500"
                            />

                            <DashboardBar
                                label="Pending"
                                value={stats.pendingPayments}
                                total={paymentTotal}
                                className="bg-amber-500"
                            />

                            <DashboardBar
                                label="Failed"
                                value={stats.failedPayments}
                                total={paymentTotal}
                                className="bg-red-500"
                            />

                            <DashboardBar
                                label="Refunded"
                                value={stats.refundedPayments}
                                total={paymentTotal}
                                className="bg-purple-500"
                            />

                            {paymentTotal === 0 && (
                                <div className="py-8 text-center text-slate-400">
                                    No payment data available.
                                </div>
                            )}

                        </div>

                    </div>


                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">

                        <div className="flex items-center justify-between mb-6">

                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Delivery Pipeline
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    Order items by delivery stage
                                </p>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Truck
                                    size={20}
                                    className="text-indigo-600"
                                />
                            </div>

                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                            <StatusBox
                                label="Placed"
                                value={stats.placedItems}
                                icon={<Package size={18} />}
                                className="bg-blue-50 text-blue-600"
                            />

                            <StatusBox
                                label="Packed"
                                value={stats.packedItems}
                                icon={<Boxes size={18} />}
                                className="bg-purple-50 text-purple-600"
                            />

                            <StatusBox
                                label="Shipped"
                                value={stats.shippedItems}
                                icon={<Truck size={18} />}
                                className="bg-indigo-50 text-indigo-600"
                            />

                            <StatusBox
                                label="Out for Delivery"
                                value={stats.outForDeliveryItems}
                                icon={<Truck size={18} />}
                                className="bg-orange-50 text-orange-600"
                            />

                            <StatusBox
                                label="Delivered"
                                value={stats.deliveredItems}
                                icon={<CheckCircle2 size={18} />}
                                className="bg-emerald-50 text-emerald-600"
                            />

                            <StatusBox
                                label="Cancelled"
                                value={stats.cancelledItems}
                                icon={<XCircle size={18} />}
                                className="bg-red-50 text-red-600"
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    BUSINESS HEALTH
                ================================================= */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">


                    {/* ORDER HEALTH */}

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">

                        <div className="flex items-center gap-3 mb-6">

                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                <Activity
                                    size={20}
                                    className="text-slate-700"
                                />

                            </div>

                            <div>

                                <h3 className="font-bold text-slate-900">
                                    Order Health
                                </h3>

                                <p className="text-sm text-slate-500">
                                    Current operational status
                                </p>

                            </div>

                        </div>


                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">


                            <StatusBox
                                label="Placed"
                                value={
                                    stats.placedItems
                                }
                                icon={
                                    <Package
                                        size={18}
                                    />
                                }
                                className="bg-blue-50 text-blue-600"
                            />


                            <StatusBox
                                label="Packed"
                                value={
                                    stats.packedItems
                                }
                                icon={
                                    <Boxes
                                        size={18}
                                    />
                                }
                                className="bg-purple-50 text-purple-600"
                            />


                            <StatusBox
                                label="Shipped"
                                value={
                                    stats.shippedItems
                                }
                                icon={
                                    <Truck
                                        size={18}
                                    />
                                }
                                className="bg-indigo-50 text-indigo-600"
                            />


                            <StatusBox
                                label="Out for Delivery"
                                value={
                                    stats.outForDeliveryItems
                                }
                                icon={
                                    <Truck
                                        size={18}
                                    />
                                }
                                className="bg-orange-50 text-orange-600"
                            />


                            <StatusBox
                                label="Delivered"
                                value={
                                    stats.deliveredItems
                                }
                                icon={
                                    <CheckCircle2
                                        size={18}
                                    />
                                }
                                className="bg-emerald-50 text-emerald-600"
                            />


                            <StatusBox
                                label="Cancelled"
                                value={
                                    stats.cancelledItems
                                }
                                icon={
                                    <XCircle
                                        size={18}
                                    />
                                }
                                className="bg-red-50 text-red-600"
                            />

                        </div>

                    </div>


                    {/* PAYMENT HEALTH */}

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">

                        <div className="flex items-center gap-3 mb-6">

                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                <CreditCard
                                    size={20}
                                    className="text-slate-700"
                                />

                            </div>

                            <div>

                                <h3 className="font-bold text-slate-900">
                                    Payment Health
                                </h3>

                                <p className="text-sm text-slate-500">
                                    Payment processing overview
                                </p>

                            </div>

                        </div>


                        <div className="space-y-4">


                            <HealthRow
                                label="Completed Payments"
                                value={
                                    stats.completedPayments
                                }
                                total={
                                    stats.completedPayments +
                                    stats.pendingPayments +
                                    stats.failedPayments +
                                    stats.refundedPayments
                                }
                                icon={
                                    <CheckCircle2
                                        size={18}
                                    />
                                }
                                className="text-emerald-600 bg-emerald-50"
                            />


                            <HealthRow
                                label="Pending Payments"
                                value={
                                    stats.pendingPayments
                                }
                                total={
                                    stats.completedPayments +
                                    stats.pendingPayments +
                                    stats.failedPayments +
                                    stats.refundedPayments
                                }
                                icon={
                                    <Clock3
                                        size={18}
                                    />
                                }
                                className="text-amber-600 bg-amber-50"
                            />


                            <HealthRow
                                label="Failed Payments"
                                value={
                                    stats.failedPayments
                                }
                                total={
                                    stats.completedPayments +
                                    stats.pendingPayments +
                                    stats.failedPayments +
                                    stats.refundedPayments
                                }
                                icon={
                                    <XCircle
                                        size={18}
                                    />
                                }
                                className="text-red-600 bg-red-50"
                            />


                            <HealthRow
                                label="Refunded Payments"
                                value={
                                    stats.refundedPayments
                                }
                                total={
                                    stats.completedPayments +
                                    stats.pendingPayments +
                                    stats.failedPayments +
                                    stats.refundedPayments
                                }
                                icon={
                                    <RotateCcw
                                        size={18}
                                    />
                                }
                                className="text-purple-600 bg-purple-50"
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    QUICK REPORTS
                ================================================= */}

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                        <div>

                            <h3 className="text-lg font-bold text-slate-900">
                                Quick Reports
                            </h3>

                            <p className="text-sm text-slate-500 mt-1">
                                Quickly access important admin areas.
                            </p>

                        </div>

                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


                        <QuickReport
                            title="Order Management"
                            description="View and manage all orders"
                            icon={
                                <ShoppingCart
                                    size={21}
                                />
                            }
                            className="bg-blue-50 text-blue-600"
                            onClick={() =>
                                navigate(
                                    "/admin-orders"
                                )
                            }
                        />


                        <QuickReport
                            title="Products"
                            description="Manage product catalogue"
                            icon={
                                <Package
                                    size={21}
                                />
                            }
                            className="bg-purple-50 text-purple-600"
                            onClick={() =>
                                navigate(
                                    "/product-management"
                                )
                            }
                        />


                        <QuickReport
                            title="Returns"
                            description="Review customer returns"
                            icon={
                                <RotateCcw
                                    size={21}
                                />
                            }
                            className="bg-orange-50 text-orange-600"
                            onClick={() =>
                                navigate(
                                    "/admin/returns"
                                )
                            }
                        />


                        <QuickReport
                            title="Enquiries"
                            description="Review customer enquiries"
                            icon={
                                <BarChart3
                                    size={21}
                                />
                            }
                            className="bg-emerald-50 text-emerald-600"
                            onClick={() =>
                                navigate(
                                    "/enquiries"
                                )
                            }
                        />

                    </div>

                </div>

            </main>

        </div>

    );
}


// =============================================================
// DASHBOARD BAR
// =============================================================

function DashboardBar({
    label,
    value,
    total,
    className
}) {

    const safeValue = Number(value || 0);
    const safeTotal = Number(total || 0);

    const percentage =
        safeTotal > 0
            ? Math.min(
                Math.round(
                    (safeValue / safeTotal) * 100
                ),
                100
            )
            : 0;

    return (
        <div>

            <div className="flex items-center justify-between mb-2">

                <span className="text-sm font-semibold text-slate-700">
                    {label}
                </span>

                <span className="text-sm font-bold text-slate-900">
                    {safeValue.toLocaleString("en-IN")}
                </span>

            </div>

            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">

                <div
                    className={`h-full rounded-full transition-all ${className}`}
                    style={{
                        width: `${percentage}%`
                    }}
                />

            </div>

            <div className="text-xs text-slate-400 mt-1 text-right">
                {percentage}%
            </div>

        </div>
    );
}


// =============================================================
// STATUS BOX
// =============================================================

function StatusBox({
    label,
    value,
    icon,
    className
}) {

    return (

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

            <div
                className={
                    `w-9 h-9 rounded-xl flex items-center justify-center ${className}`
                }
            >
                {icon}
            </div>


            <p className="text-xs text-slate-500 mt-3">
                {label}
            </p>


            <p className="text-xl font-bold text-slate-900 mt-1">
                {Number(
                    value || 0
                ).toLocaleString("en-IN")}
            </p>

        </div>

    );

}


// =============================================================
// HEALTH ROW
// =============================================================

function HealthRow({
    label,
    value,
    total,
    icon,
    className
}) {

    const percentage =
        total > 0
            ? Math.round(
                (
                    Number(value || 0) /
                    Number(total || 1)
                ) * 100
            )
            : 0;


    return (

        <div>

            <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                    <div
                        className={
                            `w-9 h-9 rounded-xl flex items-center justify-center ${className}`
                        }
                    >
                        {icon}
                    </div>


                    <span className="text-sm font-semibold text-slate-700">
                        {label}
                    </span>

                </div>


                <div className="text-right">

                    <span className="font-bold text-slate-900">
                        {Number(
                            value || 0
                        ).toLocaleString("en-IN")}
                    </span>

                    <span className="text-xs text-slate-400 ml-2">
                        {percentage}%
                    </span>

                </div>

            </div>


            <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">

                <div
                    className="h-full rounded-full bg-slate-400 transition-all"
                    style={{
                        width: `${Math.min(
                            percentage,
                            100
                        )}%`
                    }}
                />

            </div>

        </div>

    );

}


// =============================================================
// QUICK REPORT
// =============================================================

function QuickReport({
    title,
    description,
    icon,
    className,
    onClick
}) {

    return (

        <button
            type="button"
            onClick={onClick}
            className="text-left rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition bg-white"
        >

            <div
                className={
                    `w-10 h-10 rounded-xl flex items-center justify-center ${className}`
                }
            >
                {icon}
            </div>


            <h4 className="font-bold text-slate-900 mt-4">
                {title}
            </h4>


            <p className="text-xs text-slate-500 mt-1">
                {description}
            </p>


            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mt-4">

                Open

                <ArrowUpRight
                    size={13}
                />

            </div>

        </button>

    );

}