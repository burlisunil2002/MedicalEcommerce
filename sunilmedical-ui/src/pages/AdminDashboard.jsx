import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Boxes,
    CheckCircle2,
    ChevronRight,
    Clock3,
    CreditCard,
    IndianRupee,
    LayoutDashboard,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    ShoppingCart,
    Store,
    Truck,
    Users,
    XCircle
} from "lucide-react";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";

const EMPTY_STATS = {
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
    refundPendingPayments: 0,
    initiatedPayments: 0,
    cancelledPayments: 0,
    codPayments: 0,
    deliveredItems: 0,
    shippedItems: 0,
    outForDeliveryItems: 0,
    placedItems: 0,
    acceptedItems: 0,
    packedItems: 0,
    cancelledItems: 0,
    returnRequested: 0,
    returnApproved: 0,
    returnedItems: 0,
    refundedReturns: 0,
    customers: 0
};

const EMPTY_MONTH = {
    year: 0,
    month: 0,
    orders: 0,
    orderItems: 0,
    customers: 0,
    completed: 0,
    pending: 0,
    revenue: 0,
    placed: 0,
    accepted: 0,
    packed: 0,
    shipped: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    returnRequested: 0,
    returnApproved: 0,
    returned: 0,
    refunded: 0
};

const numberValue = value => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const formatNumber = value =>
    numberValue(value).toLocaleString("en-IN");

const formatCurrency = value =>
    `₹${numberValue(value).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;

const getMonthName = month =>
    new Date(2000, numberValue(month) - 1, 1).toLocaleString(
        "en-IN",
        { month: "short" }
    );

const normalizeMonthly = data => {
    const rows =
        Array.isArray(data?.monthlyStatistics)
            ? data.monthlyStatistics
            : Array.isArray(data?.monthlyStats)
                ? data.monthlyStats
                : [];

    return rows
        .map(row => ({
            ...EMPTY_MONTH,
            ...row,
            year: numberValue(row?.year ?? row?.Year),
            month: numberValue(row?.month ?? row?.Month),
            orders: numberValue(row?.orders ?? row?.Orders),
            orderItems: numberValue(
                row?.orderItems ??
                row?.OrderItems ??
                row?.totalOrderItems
            ),
            customers: numberValue(row?.customers ?? row?.Customers),
            completed: numberValue(
                row?.completed ??
                row?.Completed ??
                row?.completedItems
            ),
            pending: numberValue(
                row?.pending ??
                row?.Pending ??
                row?.pendingItems
            ),
            revenue: numberValue(row?.revenue ?? row?.Revenue),
            placed: numberValue(row?.placed ?? row?.Placed),
            accepted: numberValue(row?.accepted ?? row?.Accepted),
            packed: numberValue(row?.packed ?? row?.Packed),
            shipped: numberValue(row?.shipped ?? row?.Shipped),
            outForDelivery: numberValue(
                row?.outForDelivery ?? row?.OutForDelivery
            ),
            delivered: numberValue(
                row?.delivered ?? row?.Delivered
            ),
            cancelled: numberValue(
                row?.cancelled ?? row?.Cancelled
            ),
            returnRequested: numberValue(
                row?.returnRequested ?? row?.ReturnRequested
            ),
            returnApproved: numberValue(
                row?.returnApproved ?? row?.ReturnApproved
            ),
            returned: numberValue(
                row?.returned ?? row?.Returned
            ),
            refunded: numberValue(
                row?.refunded ?? row?.Refunded
            )
        }))
        .filter(row => row.year > 0 && row.month > 0)
        .sort((a, b) =>
            a.year - b.year || a.month - b.month
        );
};

const normalizeSellers = data => {
    const rows =
        Array.isArray(data?.sellers)
            ? data.sellers
            : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data)
                    ? data
                    : [];

    return rows.map((seller, index) => ({
        sellerId: seller?.sellerId ?? seller?.SellerId ?? seller?.id ?? index,
        businessName:
            seller?.businessName ??
            seller?.BusinessName ??
            seller?.name ??
            "Seller",
        ownerName:
            seller?.ownerName ??
            seller?.OwnerName ??
            "-",
        email:
            seller?.email ??
            seller?.Email ??
            "-",
        phone:
            seller?.phone ??
            seller?.Phone ??
            "-",
        productType:
            seller?.productType ??
            seller?.ProductType ??
            "-",
        isActive:
            seller?.isActive ??
            seller?.IsActive ??
            true,
        productCount: numberValue(
            seller?.productCount ??
            seller?.totalProducts ??
            seller?.products
        ),
        orderCount: numberValue(
            seller?.orderCount ??
            seller?.totalOrders ??
            seller?.orders
        ),
        orderItems: numberValue(
            seller?.orderItems ??
            seller?.totalOrderItems ??
            seller?.items
        ),
        completedOrders: numberValue(
            seller?.completedOrders ??
            seller?.completedItems ??
            seller?.completed
        ),
        revenue: numberValue(
            seller?.revenue ??
            seller?.totalRevenue
        ),
        customers: numberValue(
            seller?.customers ??
            seller?.uniqueCustomers
        ),
        pendingOrders: numberValue(
            seller?.pendingOrders ??
            seller?.pendingItems
        ),
        deliveredOrders: numberValue(
            seller?.deliveredOrders ??
            seller?.deliveredItems
        ),
        subscriptionEndDate:
            seller?.subscriptionEndDate ??
            seller?.SubscriptionEndDate ??
            null,
        createdAt:
            seller?.createdAt ??
            seller?.CreatedAt ??
            null
    }));
};

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(EMPTY_STATS);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [sellers, setSellers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [sellerError, setSellerError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const [sellerSearch, setSellerSearch] = useState("");
    const [monthlyRange, setMonthlyRange] = useState(12);

    const loadDashboard = useCallback(async (isRefresh = false) => {
        try {
            setError("");

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [dashboardResult, orderAnalyticsResult, sellerResult] =
                await Promise.allSettled([
                    API.get("/api/admin/dashboard"),
                    API.get("/api/admin/orders", {
                        params: {
                            page: 1,
                            pageSize: 1
                        }
                    }),
                    API.get("/api/admin/orders/sellers")
                ]);

            if (dashboardResult.status === "rejected") {
                throw dashboardResult.reason;
            }

            const dashboard =
                dashboardResult.value?.data || {};

            const orderData =
                orderAnalyticsResult.status === "fulfilled"
                    ? orderAnalyticsResult.value?.data || {}
                    : {};

            const dashboardPayment =
                dashboard?.payment ||
                dashboard?.paymentStatistics ||
                {};

            const dashboardDelivery =
                dashboard?.delivery ||
                dashboard?.deliveryStatistics ||
                {};

            const dashboardReturns =
                dashboard?.returns ||
                dashboard?.returnStatistics ||
                {};

            const orderStatistics =
                orderData?.statistics || {};

            const payment =
                orderStatistics?.payment ||
                orderData?.payment ||
                dashboardPayment ||
                {};

            const delivery =
                orderStatistics?.delivery ||
                orderData?.delivery ||
                dashboardDelivery ||
                {};

            const returns =
                orderStatistics?.returns ||
                orderData?.returns ||
                dashboardReturns ||
                {};

            setStats({
                totalProducts: numberValue(
                    dashboard?.totalProducts
                ),
                totalOrders: numberValue(
                    dashboard?.totalOrders ??
                    orderStatistics?.totalOrders ??
                    orderData?.pagination?.totalOrders
                ),
                totalUsers: numberValue(
                    dashboard?.totalUsers
                ),
                revenue: numberValue(
                    orderStatistics?.revenue ??
                    dashboard?.revenue
                ),
                totalOrderItems: numberValue(
                    orderStatistics?.totalOrderItems ??
                    dashboard?.totalOrderItems ??
                    orderData?.pagination?.totalOrderItems
                ),
                completedItems: numberValue(
                    orderStatistics?.completed ??
                    orderStatistics?.completedItems ??
                    dashboard?.completedItems
                ),
                pendingItems: numberValue(
                    orderStatistics?.pending ??
                    orderStatistics?.pendingItems ??
                    dashboard?.pendingItems
                ),
                completedPayments: numberValue(
                    payment?.completed ??
                    payment?.completedPayments ??
                    dashboard?.completedPayments
                ),
                pendingPayments: numberValue(
                    payment?.pending ??
                    payment?.pendingPayments ??
                    dashboard?.pendingPayments
                ),
                failedPayments: numberValue(
                    payment?.failed ??
                    payment?.failedPayments ??
                    dashboard?.failedPayments
                ),
                refundedPayments: numberValue(
                    payment?.refunded ??
                    payment?.refundedPayments ??
                    dashboard?.refundedPayments
                ),
                refundPendingPayments: numberValue(
                    payment?.refundPending ??
                    payment?.refundPendingPayments
                ),
                initiatedPayments: numberValue(
                    payment?.initiated ??
                    payment?.initiatedPayments
                ),
                cancelledPayments: numberValue(
                    payment?.cancelled ??
                    payment?.cancelledPayments
                ),
                codPayments: numberValue(
                    payment?.cod ??
                    payment?.cashOnDelivery
                ),
                placedItems: numberValue(
                    delivery?.placed ??
                    delivery?.placedItems ??
                    dashboard?.placedItems
                ),
                acceptedItems: numberValue(
                    delivery?.accepted ??
                    delivery?.acceptedItems
                ),
                packedItems: numberValue(
                    delivery?.packed ??
                    delivery?.packedItems ??
                    dashboard?.packedItems
                ),
                shippedItems: numberValue(
                    delivery?.shipped ??
                    delivery?.shippedItems ??
                    dashboard?.shippedItems
                ),
                outForDeliveryItems: numberValue(
                    delivery?.outForDelivery ??
                    delivery?.outForDeliveryItems ??
                    dashboard?.outForDeliveryItems
                ),
                deliveredItems: numberValue(
                    delivery?.delivered ??
                    delivery?.deliveredItems ??
                    dashboard?.deliveredItems
                ),
                cancelledItems: numberValue(
                    delivery?.cancelled ??
                    delivery?.cancelledItems ??
                    dashboard?.cancelledItems
                ),
                returnRequested: numberValue(
                    returns?.requested ??
                    returns?.returnRequested
                ),
                returnApproved: numberValue(
                    returns?.approved ??
                    returns?.returnApproved
                ),
                returnedItems: numberValue(
                    returns?.returned ??
                    returns?.returnedItems
                ),
                refundedReturns: numberValue(
                    returns?.refunded ??
                    returns?.refundedReturns
                ),
                customers: numberValue(
                    orderStatistics?.customers ??
                    dashboard?.customers ??
                    dashboard?.totalUsers
                )
            });

            setMonthlyStats(
                normalizeMonthly(orderData)
            );

            if (sellerResult.status === "fulfilled") {
                setSellerError("");
                setSellers(
                    normalizeSellers(
                        sellerResult.value?.data
                    )
                );
            } else {
                setSellerError(
                    "Seller summary API is not available yet."
                );
            }

            setLastUpdated(new Date());
        } catch (requestError) {
            console.error(
                "ADMIN DASHBOARD ERROR:",
                requestError?.response?.data ||
                requestError
            );

            const status =
                requestError?.response?.status;

            if (status === 401 || status === 403) {
                toast.error("Admin access required.");
                navigate("/admin-login", {
                    replace: true
                });
                return;
            }

            setError(
                requestError?.response?.data?.message ||
                "Unable to load the admin dashboard."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        const timer = setInterval(() => {
            loadDashboard(true);
        }, 60000);

        return () => clearInterval(timer);
    }, [loadDashboard]);

    const paymentTotal = useMemo(
        () =>
            stats.codPayments +
            stats.initiatedPayments +
            stats.pendingPayments +
            stats.completedPayments +
            stats.failedPayments +
            stats.refundPendingPayments +
            stats.refundedPayments +
            stats.cancelledPayments,
        [stats]
    );

    const completionRate = useMemo(() => {
        if (!stats.totalOrderItems) return 0;

        return Math.min(
            100,
            Math.round(
                (stats.completedItems /
                    stats.totalOrderItems) *
                100
            )
        );
    }, [
        stats.completedItems,
        stats.totalOrderItems
    ]);

    const paymentSuccessRate = useMemo(() => {
        const denominator =
            stats.completedPayments +
            stats.pendingPayments +
            stats.failedPayments +
            stats.refundedPayments;

        if (!denominator) return 0;

        return Math.min(
            100,
            Math.round(
                (stats.completedPayments /
                    denominator) *
                100
            )
        );
    }, [stats]);

    const displayedMonths = useMemo(() => {
        if (!monthlyStats.length) return [];

        return monthlyStats
            .slice(-monthlyRange)
            .map(row => ({
                ...row,
                label: `${getMonthName(row.month)} ${String(
                    row.year
                ).slice(-2)}`
            }));
    }, [
        monthlyStats,
        monthlyRange
    ]);

    const sellerRows = useMemo(() => {
        const query = sellerSearch.trim().toLowerCase();

        if (!query) return sellers;

        return sellers.filter(seller =>
            [
                seller.businessName,
                seller.ownerName,
                seller.email,
                seller.phone,
                seller.productType,
                String(seller.sellerId)
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [
        sellers,
        sellerSearch
    ]);

    const openSellerManagement = seller => {
        if (!seller?.sellerId) {
            navigate("/admin/seller-management");
            return;
        }

        navigate(
            `/admin/seller-management?sellerId=${encodeURIComponent(
                seller.sellerId
            )}`
        );
    };

    const sellerSummary = useMemo(() => {
        const total = sellers.length;
        const active = sellers.filter(x => x.isActive).length;
        return {
            total,
            active,
            inactive: Math.max(0, total - active),
            products: sellers.reduce((sum, x) => sum + x.productCount, 0),
            orders: sellers.reduce((sum, x) => sum + x.orderCount, 0),
            orderItems: sellers.reduce((sum, x) => sum + x.orderItems, 0),
            customers: sellers.reduce((sum, x) => sum + x.customers, 0),
            completed: sellers.reduce((sum, x) => sum + x.completedOrders, 0),
            pending: sellers.reduce((sum, x) => sum + x.pendingOrders, 0),
            delivered: sellers.reduce((sum, x) => sum + x.deliveredOrders, 0),
            revenue: sellers.reduce((sum, x) => sum + x.revenue, 0)
        };
    }, [sellers]);

    const paymentChart = useMemo(
        () => [
            {
                name: "COD",
                value: stats.codPayments
            },
            {
                name: "Completed",
                value: stats.completedPayments
            },
            {
                name: "Pending",
                value: stats.pendingPayments
            },
            {
                name: "Failed",
                value: stats.failedPayments
            },
            {
                name: "Refunded",
                value: stats.refundedPayments
            },
            {
                name: "Cancelled",
                value: stats.cancelledPayments
            }
        ].filter(item => item.value > 0),
        [stats]
    );

    const deliveryChart = useMemo(
        () => [
            {
                name: "Placed",
                value: stats.placedItems
            },
            {
                name: "Accepted",
                value: stats.acceptedItems
            },
            {
                name: "Packed",
                value: stats.packedItems
            },
            {
                name: "Shipped",
                value: stats.shippedItems
            },
            {
                name: "Out",
                value: stats.outForDeliveryItems
            },
            {
                name: "Delivered",
                value: stats.deliveredItems
            },
            {
                name: "Cancelled",
                value: stats.cancelledItems
            }
        ],
        [stats]
    );

    const logout = async () => {
        try {
            await API.post("/api/account/logout");
        } catch (logoutError) {
            console.error(logoutError);
        } finally {
            localStorage.removeItem("role");

            navigate("/admin-login", {
                replace: true
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                        <LayoutDashboard
                            className="text-white"
                            size={26}
                        />
                    </div>

                    <div className="mx-auto mt-6 h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />

                    <h2 className="mt-5 text-lg font-black text-slate-900">
                        Loading Admin Dashboard
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Preparing your business overview...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="min-h-16 sm:h-20 py-3 sm:py-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <LayoutDashboard
                                    size={22}
                                    className="text-white"
                                />
                            </div>

                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-black truncate">
                                    Admin Dashboard
                                </h1>

                                <p className="hidden sm:block text-xs text-slate-500">
                                    Complete business control centre
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                                <Activity size={15} />
                                Live data
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    loadDashboard(true)
                                }
                                disabled={refreshing}
                                className="h-10 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white font-bold text-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={16}
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
                                onClick={logout}
                                className="h-10 px-3 sm:px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {refreshing && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 animate-pulse" />
            )}

            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-bold text-red-700">
                                Dashboard data could not be loaded
                            </p>

                            <p className="text-sm text-red-600 mt-1">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                loadDashboard(true)
                            }
                            className="shrink-0 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 font-bold text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white p-5 sm:p-7 lg:p-8 shadow-xl mb-6">
                    <div className="relative z-10">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-100">
                            Executive overview
                        </p>

                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mt-2">
                            <div>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">
                                    Welcome back, Admin
                                </h2>

                                <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                                    Monitor sales, orders, sellers,
                                    customers, payments, delivery,
                                    returns and operational health from
                                    one place.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/admin/orders")
                                    }
                                    className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-black text-sm"
                                >
                                    View Orders
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/product-management")
                                    }
                                    className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/30 font-black text-sm"
                                >
                                    Products
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
                    <div className="absolute right-24 -bottom-44 h-96 w-96 rounded-full bg-white/10" />
                </section>

                {/* =====================================================
                    EXECUTIVE KPI SUMMARY
                    ===================================================== */}
                <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
                    <MetricCard
                        label="Completed Revenue"
                        value={formatCurrency(stats.revenue)}
                        note="Paid + Delivered"
                        icon={<IndianRupee size={15} />}
                        iconClass="bg-emerald-50 text-emerald-600"
                        valueClass="text-2xl sm:text-3xl text-emerald-600"
                    />

                    <MetricCard
                        label="Total Orders"
                        value={formatNumber(stats.totalOrders)}
                        note="Unique orders"
                        icon={<ShoppingCart size={21} />}
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <MetricCard
                        label="Total Order Items"
                        value={formatNumber(stats.totalOrderItems)}
                        note="All order line items"
                        icon={<Package size={21} />}
                        iconClass="bg-cyan-50 text-cyan-600"
                    />

                    <MetricCard
                        label="Customers"
                        value={formatNumber(stats.customers)}
                        note="Unique customers"
                        icon={<Users size={21} />}
                        iconClass="bg-violet-50 text-violet-600"
                    />

                    <MetricCard
                        label="Products"
                        value={formatNumber(stats.totalProducts)}
                        note="Product catalogue"
                        icon={<Boxes size={21} />}
                        iconClass="bg-indigo-50 text-indigo-600"
                    />

                    <MetricCard
                        label="Pending Items"
                        value={formatNumber(stats.pendingItems)}
                        note="Not completed + delivered"
                        icon={<Clock3 size={21} />}
                        iconClass="bg-amber-50 text-amber-600"
                        valueClass="text-amber-600"
                    />
                </section>

                <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                    <MiniStat label="Completed" value={stats.completedItems} icon={<CheckCircle2 size={17} />} />
                    <MiniStat label="Placed" value={stats.placedItems} icon={<Package size={17} />} />
                    <MiniStat label="Accepted" value={stats.acceptedItems} icon={<CheckCircle2 size={17} />} />
                    <MiniStat label="Packed" value={stats.packedItems} icon={<Boxes size={17} />} />
                    <MiniStat label="Shipped" value={stats.shippedItems} icon={<Truck size={17} />} />
                    <MiniStat label="Out for delivery" value={stats.outForDeliveryItems} icon={<Truck size={17} />} />
                    <MiniStat label="Delivered" value={stats.deliveredItems} icon={<CheckCircle2 size={17} />} />
                    <MiniStat label="Cancelled" value={stats.cancelledItems} icon={<XCircle size={17} />} />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    <ProgressCard
                        title="Order Completion"
                        value={`${completionRate}%`}
                        current={stats.completedItems}
                        total={stats.totalOrderItems}
                        icon={<CheckCircle2 size={21} />}
                        barClass="bg-emerald-500"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <ProgressCard
                        title="Payment Success"
                        value={`${paymentSuccessRate}%`}
                        current={stats.completedPayments}
                        total={
                            stats.completedPayments +
                            stats.pendingPayments +
                            stats.failedPayments +
                            stats.refundedPayments
                        }
                        icon={<CreditCard size={21} />}
                        barClass="bg-blue-500"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <ProgressCard
                        title="Delivered Items"
                        value={`${stats.deliveredItems.toLocaleString("en-IN")}`}
                        current={stats.deliveredItems}
                        total={stats.totalOrderItems}
                        icon={<Truck size={21} />}
                        barClass="bg-indigo-500"
                        iconClass="bg-indigo-50 text-indigo-600"
                        suffix=" items"
                    />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
                    <Panel
                        title="Monthly Revenue & Orders"
                        subtitle="Historical monthly performance from the order API"
                        icon={<BarChart3 size={19} />}
                        action={
                            <select
                                value={monthlyRange}
                                onChange={e =>
                                    setMonthlyRange(
                                        Number(e.target.value)
                                    )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none"
                            >
                                <option value={6}>
                                    Last 6 months
                                </option>
                                <option value={12}>
                                    Last 12 months
                                </option>
                                <option value={24}>
                                    Last 24 months
                                </option>
                            </select>
                        }
                    >
                        {displayedMonths.length ? (
                            <div className="h-72">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <AreaChart
                                        data={displayedMonths}
                                        margin={{
                                            top: 10,
                                            right: 8,
                                            left: -18,
                                            bottom: 0
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{
                                                fontSize: 11
                                            }}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 11
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(
                                                value,
                                                name
                                            ) =>
                                                name ===
                                                    "Revenue"
                                                    ? formatCurrency(
                                                        value
                                                    )
                                                    : formatNumber(
                                                        value
                                                    )
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            fill="currentColor"
                                            stroke="currentColor"
                                            className="text-blue-600 fill-blue-50"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState text="Monthly statistics are not available in the current API response." />
                        )}
                    </Panel>

                    <Panel
                        title="Monthly Orders"
                        subtitle="Order volume and completion by month"
                        icon={<ShoppingCart size={19} />}
                    >
                        {displayedMonths.length ? (
                            <div className="h-72">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={displayedMonths}
                                        margin={{
                                            top: 10,
                                            right: 8,
                                            left: -18,
                                            bottom: 0
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{
                                                fontSize: 11
                                            }}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 11
                                            }}
                                        />
                                        <Tooltip
                                            formatter={value =>
                                                formatNumber(value)
                                            }
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="orders"
                                            name="Orders"
                                            fill="currentColor"
                                            className="text-blue-600"
                                            radius={[5, 5, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="completed"
                                            name="Completed"
                                            fill="currentColor"
                                            className="text-emerald-500"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState text="Monthly order statistics are not available yet." />
                        )}
                    </Panel>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    <Panel
                        title="Payment Overview"
                        subtitle="All payment states"
                        icon={<CreditCard size={19} />}
                    >
                        {paymentChart.length ? (
                            <div className="h-64">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={paymentChart}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={58}
                                            outerRadius={88}
                                            paddingAngle={3}
                                        >
                                            {paymentChart.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`${entry.name}-${index}`}
                                                        fill={`hsl(${210 + index * 32} 75% ${48 + (index % 2) * 8}%)`}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={value =>
                                                formatNumber(value)
                                            }
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState text="No payment data available." />
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <InfoPill label="COD" value={stats.codPayments} />
                            <InfoPill label="Initiated" value={stats.initiatedPayments} />
                            <InfoPill label="Pending" value={stats.pendingPayments} />
                            <InfoPill label="Completed" value={stats.completedPayments} />
                            <InfoPill label="Failed" value={stats.failedPayments} />
                            <InfoPill label="Refund pending" value={stats.refundPendingPayments} />
                            <InfoPill label="Refunded" value={stats.refundedPayments} />
                            <InfoPill label="Cancelled" value={stats.cancelledPayments} />
                        </div>
                    </Panel>

                    <Panel
                        title="Delivery Pipeline"
                        subtitle="Current operational status"
                        icon={<Truck size={19} />}
                    >
                        <div className="space-y-3">
                            {deliveryChart.map(item => (
                                <HorizontalStat
                                    key={item.name}
                                    label={item.name}
                                    value={item.value}
                                    total={stats.totalOrderItems}
                                />
                            ))}
                        </div>
                    </Panel>

                    <Panel
                        title="Returns & Refunds"
                        subtitle="Customer return lifecycle"
                        icon={<RotateCcw size={19} />}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <InfoTile label="Requested" value={stats.returnRequested} />
                            <InfoTile label="Approved" value={stats.returnApproved} />
                            <InfoTile label="Returned" value={stats.returnedItems} />
                            <InfoTile label="Refunded" value={stats.refundedReturns} />
                        </div>

                        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-xs font-bold text-slate-500">
                                Revenue rule
                            </p>

                            <p className="text-sm font-bold text-slate-800 mt-1">
                                Only Completed payment + Delivered items
                                are included in revenue.
                            </p>

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-500">
                                    Current Revenue
                                </p>

                                <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-600 break-words">
                                    {formatCurrency(stats.revenue)}
                                </p>
                            </div>
                        </div>
                    </Panel>
                </section>

                <section className="mb-6">
                    <div className="flex items-end justify-between gap-3 mb-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-violet-600">Marketplace partners</p>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Seller Performance</h2>
                            <p className="text-sm text-slate-500 mt-1">Live seller totals across products, orders, order items, customers and recognized revenue.</p>
                        </div>
                        <button type="button" onClick={() => navigate("/admin/seller-management")} className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-black hover:bg-slate-800 transition">
                            Manage sellers <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <MiniStat label="Total Sellers" value={sellerSummary.total} icon={<Store size={16} />} />
                        <MiniStat label="Active Sellers" value={sellerSummary.active} icon={<CheckCircle2 size={16} />} />
                        <MiniStat label="Seller Products" value={sellerSummary.products} icon={<Package size={16} />} />
                        <MiniStat label="Seller Orders" value={sellerSummary.orders} icon={<ShoppingCart size={16} />} />
                        <MiniStat label="Seller Order Items" value={sellerSummary.orderItems} icon={<Boxes size={16} />} />
                        <MiniStat label="Seller Revenue" value={formatCurrency(sellerSummary.revenue)} icon={<IndianRupee size={16} />} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <MiniStat label="Seller Customers" value={sellerSummary.customers} icon={<Users size={16} />} />
                        <MiniStat label="Completed Items" value={sellerSummary.completed} icon={<CheckCircle2 size={16} />} />
                        <MiniStat label="Pending Items" value={sellerSummary.pending} icon={<Clock3 size={16} />} />
                        <MiniStat label="Delivered Items" value={sellerSummary.delivered} icon={<Truck size={16} />} />
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="p-5 sm:p-6 border-b border-slate-100">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <Store size={19} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black">
                                        Seller Overview
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Seller business, contact, product,
                                        order, customer and revenue details.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        value={sellerSearch}
                                        onChange={e =>
                                            setSellerSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search sellers..."
                                        className="h-10 w-full sm:w-64 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/admin/seller-management")
                                    }
                                    className="h-10 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    Seller Management
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {sellerError ? (
                        <div className="p-6">
                            <EmptyState
                                text={sellerError}
                                actionLabel="Open Seller Management"
                                onAction={() =>
                                    navigate(
                                        "/seller-management"
                                    )
                                }
                            />
                        </div>
                    ) : sellerRows.length === 0 ? (
                        <div className="p-6">
                            <EmptyState text="No seller records available." />
                        </div>
                    ) : (
                        <>
                            <div className="hidden xl:block overflow-x-auto">
                                <table className="w-full min-w-[1100px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                                            <th className="px-5 py-3">Seller</th>
                                            <th className="px-5 py-3">Contact</th>
                                            <th className="px-5 py-3">Products</th>
                                            <th className="px-5 py-3">Orders</th>
                                            <th className="px-5 py-3">Order Items</th>
                                            <th className="px-5 py-3">Completed</th>
                                            <th className="px-5 py-3">Customers</th>
                                            <th className="px-5 py-3">Revenue</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {sellerRows.map(seller => (
                                            <tr
                                                key={seller.sellerId}
                                                onClick={() => openSellerManagement(seller)}
                                                onKeyDown={event => {
                                                    if (
                                                        event.key === "Enter" ||
                                                        event.key === " "
                                                    ) {
                                                        event.preventDefault();
                                                        openSellerManagement(seller);
                                                    }
                                                }}
                                                tabIndex={0}
                                                role="button"
                                                className="cursor-pointer hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                                            {String(
                                                                seller.businessName
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <p className="font-black text-sm">
                                                                {seller.businessName}
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                #{seller.sellerId} ·{" "}
                                                                {seller.ownerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold">
                                                        {seller.email}
                                                    </p>

                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {seller.phone}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 font-bold">
                                                    {formatNumber(
                                                        seller.productCount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-bold">
                                                    {formatNumber(
                                                        seller.orderCount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-bold">
                                                    {formatNumber(
                                                        seller.orderItems
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-bold text-emerald-700">
                                                    {formatNumber(
                                                        seller.completedOrders
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-bold">
                                                    {formatNumber(
                                                        seller.customers
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-black text-emerald-600">
                                                    {formatCurrency(
                                                        seller.revenue
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge
                                                            active={
                                                                seller.isActive
                                                            }
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={event => {
                                                                event.stopPropagation();
                                                                openSellerManagement(seller);
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-2.5 py-1.5 text-[11px] font-black hover:bg-slate-800"
                                                        >
                                                            Details
                                                            <ChevronRight size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="xl:hidden divide-y divide-slate-100">
                                {sellerRows.map(seller => (
                                    <div
                                        key={seller.sellerId}
                                        onClick={() => openSellerManagement(seller)}
                                        onKeyDown={event => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                openSellerManagement(seller);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        className="p-4 sm:p-5 cursor-pointer hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                                    {String(
                                                        seller.businessName
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-black truncate">
                                                        {seller.businessName}
                                                    </p>

                                                    <p className="text-xs text-slate-500 mt-1">
                                                        #{seller.sellerId} ·{" "}
                                                        {seller.ownerName}
                                                    </p>
                                                </div>
                                            </div>

                                            <StatusBadge
                                                active={
                                                    seller.isActive
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                                            <InfoTile
                                                label="Products"
                                                value={seller.productCount}
                                            />

                                            <InfoTile
                                                label="Orders"
                                                value={seller.orderCount}
                                            />

                                            <InfoTile
                                                label="Order Items"
                                                value={seller.orderItems}
                                            />

                                            <InfoTile
                                                label="Completed"
                                                value={seller.completedOrders}
                                            />

                                            <InfoTile
                                                label="Customers"
                                                value={seller.customers}
                                            />

                                            <InfoTile
                                                label="Revenue"
                                                value={formatCurrency(
                                                    seller.revenue
                                                )}
                                            />
                                        </div>

                                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
                                            <p className="font-semibold text-slate-700">
                                                {seller.email}
                                            </p>

                                            <p className="text-slate-500 mt-1">
                                                {seller.phone}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={event => {
                                                event.stopPropagation();
                                                openSellerManagement(seller);
                                            }}
                                            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-black hover:bg-slate-800"
                                        >
                                            View Seller Details
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <QuickAction
                        title="Order Management"
                        description="All orders, payments and delivery"
                        icon={<ShoppingCart size={20} />}
                        onClick={() =>
                            navigate("/admin/orders")
                        }
                    />

                    <QuickAction
                        title="Seller Management"
                        description="Seller accounts and business details"
                        icon={<Store size={20} />}
                        onClick={() =>
                            navigate("/admin/seller-management")
                        }
                    />

                    <QuickAction
                        title="Product Management"
                        description="Catalogue and product operations"
                        icon={<Package size={20} />}
                        onClick={() =>
                            navigate("/product-management")
                        }
                    />

                    <QuickAction
                        title="Returns"
                        description="Review return and refund activity"
                        icon={<RotateCcw size={20} />}
                        onClick={() =>
                            navigate("/admin/returns")
                        }
                    />
                </section>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
                    <span>
                        Admin dashboard · Live operational view
                    </span>

                    <span>
                        {lastUpdated
                            ? `Last updated ${lastUpdated.toLocaleTimeString(
                                "en-IN",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            )}`
                            : "Updating..."}
                    </span>
                </div>
            </main>
        </div>
    );
}

function MetricCard({
    label,
    value,
    note,
    icon,
    iconClass = "bg-slate-100 text-slate-600",
    valueClass = "text-slate-900"
}) {
    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-3">

                {/* Text section */}
                <div className="min-w-0 flex-1">
                    <p
                        className="text-xs sm:text-sm font-bold text-slate-600 truncate"
                        title={label}
                    >
                        {label}
                    </p>

                    <p
                        className={`mt-2 font-black leading-none whitespace-nowrap ${valueClass}`}
                        title={String(value ?? "")}
                    >
                        {value}
                    </p>

                    <p
                        className="text-xs text-slate-400 font-medium mt-3 truncate"
                        title={note}
                    >
                        {note}
                    </p>
                </div>

                {/* Icon */}
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, icon }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">
                    {icon}
                </span>

                <span className="text-lg font-black text-slate-900">
                    {typeof value === "number" ? formatNumber(value) : value}
                </span>
            </div>

            <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-2">
                {label}
            </p>
        </div>
    );
}

function ProgressCard({
    title,
    value,
    current,
    total,
    icon,
    barClass,
    iconClass,
    suffix = ""
}) {
    const percentage =
        total > 0
            ? Math.min(
                100,
                Math.round(
                    (numberValue(current) /
                        numberValue(total)) *
                    100
                )
            )
            : 0;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-500">
                        {title}
                    </p>

                    <p className="text-3xl font-black mt-2">
                        {value}
                        {suffix}
                    </p>
                </div>

                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconClass}`}>
                    {icon}
                </div>
            </div>

            <div className="mt-5 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${barClass}`}
                    style={{
                        width: `${percentage}%`
                    }}
                />
            </div>

            <div className="flex justify-between mt-2 text-xs">
                <span className="text-slate-400">
                    {formatNumber(current)} /{" "}
                    {formatNumber(total)}
                </span>

                <span className="font-black text-slate-600">
                    {percentage}%
                </span>
            </div>
        </div>
    );
}

function Panel({
    title,
    subtitle,
    icon,
    action,
    children
}) {
    return (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        {icon}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-black text-slate-900">
                            {title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {action}
            </div>

            {children}
        </section>
    );
}

function InfoPill({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-[10px] text-slate-400 font-bold">
                {label}
            </p>

            <p className="text-sm font-black mt-0.5">
                {formatNumber(value)}
            </p>
        </div>
    );
}

function InfoTile({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                {label}
            </p>

            <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                {typeof value === "number"
                    ? formatNumber(value)
                    : value}
            </p>
        </div>
    );
}

function HorizontalStat({
    label,
    value,
    total
}) {
    const percentage =
        total > 0
            ? Math.min(
                100,
                Math.round(
                    (numberValue(value) /
                        numberValue(total)) *
                    100
                )
            )
            : 0;

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600">
                    {label}
                </span>

                <span className="text-xs font-black text-slate-900">
                    {formatNumber(value)}
                </span>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                        width: `${percentage}%`
                    }}
                />
            </div>
        </div>
    );
}

function StatusBadge({ active }) {
    return (
        <span
            className={
                active
                    ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-black"
                    : "inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[11px] font-black"
            }
        >
            <span
                className={
                    active
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                        : "h-1.5 w-1.5 rounded-full bg-slate-400"
                }
            />

            {active ? "Active" : "Inactive"}
        </span>
    );
}

function EmptyState({
    text,
    actionLabel,
    onAction
}) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <BarChart3
                size={30}
                className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-bold text-slate-600">
                {text}
            </p>

            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

function QuickAction({
    title,
    description,
    icon,
    onClick
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-left bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition"
        >
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {icon}
            </div>

            <h4 className="font-black mt-4">
                {title}
            </h4>

            <p className="text-xs text-slate-500 mt-1">
                {description}
            </p>

            <div className="mt-4 flex items-center gap-1 text-xs font-black text-slate-500">
                Open
                <ArrowUpRight size={13} />
            </div>
        </button>
    );
}
