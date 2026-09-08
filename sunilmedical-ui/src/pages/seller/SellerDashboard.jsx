import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    Clock,
    CreditCard,
    IndianRupee,
    Package,
    Plus,
    RefreshCw,
    ShoppingCart,
    TrendingUp,
    Users,
    XCircle
} from "lucide-react";

import API from "../../services/api";


// =========================================================
// EMPTY DASHBOARD
// =========================================================

const EMPTY_DASHBOARD = {
    sellerName: "",

    totalProducts: 0,
    totalOrders: 0,
    totalOrderItems: 0,
    completedItems: 0,
    pendingOrderItems: 0,

    revenue: 0,
    customers: 0,
    lowStock: 0,

    growth: null,
    subscriptionEnd: null,
    isSubscribed: false,

    payment: {
        cashOnDelivery: 0,
        initiatedPayments: 0,
        pendingPayments: 0,
        completedPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        refundPendingPayments: 0,
        cancelledPayments: 0
    },

    delivery: {
        placed: 0,
        accepted: 0,
        packed: 0,
        shipped: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0
    },

    returns: {
        requested: 0,
        approved: 0,
        returned: 0,
        refunded: 0
    }
};


// =========================================================
// HELPERS
// =========================================================

const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

const firstNumber = (...values) => {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            return toNumber(value);
        }
    }

    return 0;
};

const formatNumber = (value) => {
    return toNumber(value).toLocaleString("en-IN");
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(toNumber(value));
};

const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatUpdatedTime = (value) => {
    if (!value) {
        return "";
    }

    return value.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
};


// =========================================================
// COMPONENT
// =========================================================

export default function SellerDashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);


    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await API.get(
                    "/api/seller/dashboard"
                );

                const data = response?.data || {};

                /*
                 * Supports both response formats:
                 *
                 * 1. Direct:
                 *    data.totalOrders
                 *    data.payment.completed
                 *
                 * 2. Statistics:
                 *    data.statistics.totalOrders
                 *    data.statistics.payment.completed
                 *
                 * This makes the page tolerant to the current
                 * seller dashboard API response.
                 */

                const statistics =
                    data?.statistics || data;

                const payment =
                    data?.payment ||
                    statistics?.payment ||
                    {};

                const delivery =
                    data?.delivery ||
                    statistics?.delivery ||
                    {};

                const returns =
                    data?.returns ||
                    statistics?.returns ||
                    {};

                setDashboard({
                    sellerName:
                        data?.sellerName ||
                        data?.seller?.businessName ||
                        data?.seller?.name ||
                        "",

                    totalProducts: firstNumber(
                        data?.totalProducts,
                        statistics?.totalProducts
                    ),

                    totalOrders: firstNumber(
                        data?.totalOrders,
                        statistics?.totalOrders
                    ),

                    totalOrderItems: firstNumber(
                        data?.totalOrderItems,
                        statistics?.totalOrderItems,
                        data?.pagination?.totalOrderItems,
                        data?.pagination?.totalItems
                    ),

                    completedItems: firstNumber(
                        data?.completedItems,
                        statistics?.completedItems,
                        statistics?.completed
                    ),

                    pendingOrderItems: firstNumber(
                        data?.pendingOrderItems,
                        data?.pendingOrders,
                        statistics?.pendingOrderItems,
                        statistics?.pending
                    ),

                    revenue: firstNumber(
                        data?.revenue,
                        statistics?.revenue
                    ),

                    customers: firstNumber(
                        data?.customers,
                        statistics?.customers,
                        data?.uniqueCustomers
                    ),

                    lowStock: firstNumber(
                        data?.lowStock,
                        statistics?.lowStock
                    ),

                    growth:
                        data?.growth !== undefined &&
                            data?.growth !== null &&
                            data?.growth !== ""
                            ? toNumber(data.growth)
                            : statistics?.growth !== undefined &&
                                statistics?.growth !== null &&
                                statistics?.growth !== ""
                                ? toNumber(statistics.growth)
                                : null,

                    subscriptionEnd:
                        data?.subscriptionEnd ||
                        data?.subscription?.endDate ||
                        null,

                    isSubscribed: Boolean(
                        data?.isSubscribed ??
                        data?.subscription?.isActive ??
                        false
                    ),

                    payment: {
                        cashOnDelivery: firstNumber(
                            payment?.cashOnDelivery,
                            payment?.cod,
                            data?.cashOnDelivery
                        ),

                        initiatedPayments: firstNumber(
                            payment?.initiatedPayments,
                            payment?.initiated,
                            data?.initiatedPayments
                        ),

                        pendingPayments: firstNumber(
                            payment?.pendingPayments,
                            payment?.pending,
                            data?.pendingPayments
                        ),

                        completedPayments: firstNumber(
                            payment?.completedPayments,
                            payment?.completed,
                            data?.completedPayments
                        ),

                        failedPayments: firstNumber(
                            payment?.failedPayments,
                            payment?.failed,
                            data?.failedPayments
                        ),

                        refundedPayments: firstNumber(
                            payment?.refundedPayments,
                            payment?.refunded,
                            data?.refundedPayments
                        ),

                        refundPendingPayments: firstNumber(
                            payment?.refundPendingPayments,
                            payment?.refundPending,
                            payment?.refundpending,
                            data?.refundPendingPayments
                        ),

                        cancelledPayments: firstNumber(
                            payment?.cancelledPayments,
                            payment?.cancelled,
                            data?.cancelledPayments
                        )
                    },

                    delivery: {
                        placed: firstNumber(
                            delivery?.placed,
                            delivery?.placedItems,
                            data?.placedItems
                        ),

                        accepted: firstNumber(
                            delivery?.accepted,
                            delivery?.acceptedItems,
                            data?.acceptedItems
                        ),

                        packed: firstNumber(
                            delivery?.packed,
                            delivery?.packedItems,
                            data?.packedItems
                        ),

                        shipped: firstNumber(
                            delivery?.shipped,
                            delivery?.shippedItems,
                            data?.shippedItems
                        ),

                        outForDelivery: firstNumber(
                            delivery?.outForDelivery,
                            delivery?.outForDeliveryItems,
                            data?.outForDeliveryItems
                        ),

                        delivered: firstNumber(
                            delivery?.delivered,
                            delivery?.deliveredItems,
                            data?.deliveredItems
                        ),

                        cancelled: firstNumber(
                            delivery?.cancelled,
                            delivery?.cancelledItems,
                            data?.cancelledItems
                        )
                    },

                    returns: {
                        requested: firstNumber(
                            returns?.requested,
                            returns?.returnRequested,
                            data?.returnRequested
                        ),

                        approved: firstNumber(
                            returns?.approved,
                            returns?.returnApproved,
                            data?.returnApproved
                        ),

                        returned: firstNumber(
                            returns?.returned,
                            data?.returned
                        ),

                        refunded: firstNumber(
                            returns?.refunded,
                            data?.refunded
                        )
                    }
                });

                setLastUpdated(new Date());
            } catch (err) {
                console.error(
                    "Seller dashboard load error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Unable to load seller dashboard data. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    // =========================================================
    // INITIAL LOAD + AUTO REFRESH
    // =========================================================

    useEffect(() => {
        loadDashboard();

        const interval = setInterval(() => {
            loadDashboard(true);
        }, 60000);

        return () => clearInterval(interval);
    }, [loadDashboard]);


    // =========================================================
    // MAIN CARDS
    // =========================================================

    const cards = useMemo(
        () => [
            {
                title: "Products",
                value: formatNumber(
                    dashboard.totalProducts
                ),
                icon: Package,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                description: "Products listed"
            },
            {
                title: "Unique Orders",
                value: formatNumber(
                    dashboard.totalOrders
                ),
                icon: ShoppingCart,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
                description: "Unique orders received"
            },
            {
                title: "Total Order Items",
                value: formatNumber(
                    dashboard.totalOrderItems
                ),
                icon: Boxes,
                iconBg: "bg-violet-50",
                iconColor: "text-violet-600",
                description: "All seller order items"
            },
            {
                title: "Pending Order Items",
                value: formatNumber(
                    dashboard.pendingOrderItems
                ),
                icon: Clock,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                description: "Items not completed yet"
            },
            {
                title: "Delivered Items",
                value: formatNumber(
                    dashboard.delivery.delivered
                ),
                icon: CheckCircle2,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                description: "Successfully delivered"
            },
            {
                title: "Customers",
                value: formatNumber(
                    dashboard.customers
                ),
                icon: Users,
                iconBg: "bg-cyan-50",
                iconColor: "text-cyan-600",
                description: "Unique customers"
            },
            {
                title: "Revenue",
                value: formatCurrency(
                    dashboard.revenue
                ),
                icon: IndianRupee,
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
                description: "Paid and delivered"
            },
            {
                title: "Low Stock",
                value: formatNumber(
                    dashboard.lowStock
                ),
                icon: AlertTriangle,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-600",
                description: "Inventory alerts"
            }
        ],
        [dashboard]
    );


    // =========================================================
    // SUBSCRIPTION
    // =========================================================

    const subscriptionDays = useMemo(() => {
        if (!dashboard.subscriptionEnd) {
            return null;
        }

        const end = new Date(
            dashboard.subscriptionEnd
        );

        if (Number.isNaN(end.getTime())) {
            return null;
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        return Math.ceil(
            (end - today) / 86400000
        );
    }, [dashboard.subscriptionEnd]);

    const subscriptionMessage =
        dashboard.isSubscribed
            ? subscriptionDays === null
                ? "Your seller subscription is active."
                : subscriptionDays > 0
                    ? `${subscriptionDays} day${subscriptionDays === 1 ? "" : "s"} remaining`
                    : "Subscription expires today"
            : "Renew your subscription to continue selling";


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-64 rounded-3xl bg-slate-200" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                        (item) => (
                            <div
                                key={item}
                                className="h-40 rounded-2xl bg-slate-200"
                            />
                        )
                    )}
                </div>

                <div className="h-80 rounded-2xl bg-slate-200" />
            </div>
        );
    }


    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-full space-y-6 pb-10">

            {/* HEADER */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-blue-600">
                        Seller Overview
                    </p>

                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                        Dashboard
                    </h1>

                    <p className="text-sm text-slate-500 mt-1">
                        Monitor your products, orders,
                        payments, deliveries and returns.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="hidden sm:block text-xs text-slate-500">
                            Updated{" "}
                            {formatUpdatedTime(lastUpdated)}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>
            </div>


            {/* ERROR */}

            {error && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <div className="flex items-center gap-2">
                        <XCircle size={18} />
                        <span>{error}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadDashboard(true)}
                        className="font-semibold underline underline-offset-2"
                    >
                        Try again
                    </button>
                </div>
            )}


            {/* HERO */}

            <motion.section
                initial={{
                    opacity: 0,
                    y: 16
                }}
                animate={{
                    opacity: 1,
                    y: 0
                }}
                transition={{
                    duration: 0.35
                }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-900 to-cyan-700 text-white shadow-xl"
            >
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

                <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 p-7 md:p-10">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                            <Activity size={15} />
                            Seller Control Center
                        </div>

                        <h2 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">
                            Welcome back
                            {dashboard.sellerName
                                ? `, ${dashboard.sellerName}`
                                : ""}.
                        </h2>

                        <p className="mt-4 text-sm md:text-base leading-7 text-blue-100 max-w-xl">
                            Manage products, process orders,
                            monitor payments and deliveries,
                            and track returns from one place.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/seller/products"
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50"
                            >
                                <Plus size={18} />
                                Add Product
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/seller/orders"
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20"
                            >
                                <ShoppingCart size={17} />
                                View Orders
                                <ArrowUpRight size={17} />
                            </button>
                        </div>
                    </div>


                    {/* HERO MINI STATS */}

                    <div className="grid grid-cols-2 gap-3 self-start lg:min-w-[310px]">
                        <MiniStat
                            icon={Boxes}
                            label="Unique Orders"
                            value={dashboard.totalOrders}
                        />

                        <MiniStat
                            icon={Package}
                            label="Order Items"
                            value={dashboard.totalOrderItems}
                        />

                        <MiniStat
                            icon={CheckCircle2}
                            label="Delivered"
                            value={dashboard.delivery.delivered}
                        />

                        <MiniStat
                            icon={Clock}
                            label="Pending Items"
                            value={dashboard.pendingOrderItems}
                        />
                    </div>
                </div>
            </motion.section>


            {/* MAIN CARDS */}

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                        Store Performance
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                        Live values calculated from your seller data.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {cards.map((card, index) => {
                        const Icon = card.icon;

                        return (
                            <motion.div
                                key={card.title}
                                initial={{
                                    opacity: 0,
                                    y: 12
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.04
                                }}
                                whileHover={{
                                    y: -3
                                }}
                                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {card.title}
                                        </p>

                                        <h3 className="mt-3 text-2xl md:text-3xl font-black text-slate-900 break-words">
                                            {card.value}
                                        </h3>
                                    </div>

                                    <div
                                        className={`shrink-0 h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center`}
                                    >
                                        <Icon
                                            size={24}
                                            className={card.iconColor}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                                    <ArrowUpRight size={15} />
                                    {card.description}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>


            {/* ORDER PERFORMANCE */}

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Delivery Performance
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            Current seller order-item delivery status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/seller/orders")
                        }
                        className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                    >
                        Manage Orders
                        <ArrowUpRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                    <StatusBox
                        label="Placed"
                        value={dashboard.delivery.placed}
                    />

                    <StatusBox
                        label="Accepted"
                        value={dashboard.delivery.accepted}
                    />

                    <StatusBox
                        label="Packed"
                        value={dashboard.delivery.packed}
                    />

                    <StatusBox
                        label="Shipped"
                        value={dashboard.delivery.shipped}
                    />

                    <StatusBox
                        label="Out for Delivery"
                        value={dashboard.delivery.outForDelivery}
                    />

                    <StatusBox
                        label="Delivered"
                        value={dashboard.delivery.delivered}
                        valueClass="text-emerald-600"
                    />

                    <StatusBox
                        label="Cancelled"
                        value={dashboard.delivery.cancelled}
                        valueClass="text-red-600"
                    />
                </div>
            </section>


            {/* PAYMENT PERFORMANCE */}

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                        <CreditCard
                            size={22}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Payment Performance
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            Payment status captured from seller orders.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                    <StatusBox
                        label="Cash on Delivery"
                        value={
                            dashboard.payment.cashOnDelivery
                        }
                    />

                    <StatusBox
                        label="Initiated"
                        value={
                            dashboard.payment.initiatedPayments
                        }
                    />

                    <StatusBox
                        label="Pending"
                        value={
                            dashboard.payment.pendingPayments
                        }
                    />

                    <StatusBox
                        label="Completed"
                        value={
                            dashboard.payment.completedPayments
                        }
                        valueClass="text-emerald-600"
                    />

                    <StatusBox
                        label="Failed"
                        value={
                            dashboard.payment.failedPayments
                        }
                        valueClass="text-red-600"
                    />

                    <StatusBox
                        label="Refund Pending"
                        value={
                            dashboard.payment.refundPendingPayments
                        }
                        valueClass="text-amber-600"
                    />

                    <StatusBox
                        label="Refunded"
                        value={
                            dashboard.payment.refundedPayments
                        }
                    />

                    <StatusBox
                        label="Cancelled"
                        value={
                            dashboard.payment.cancelledPayments
                        }
                        valueClass="text-red-600"
                    />
                </div>
            </section>


            {/* RETURNS */}

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Package
                            size={22}
                            className="text-orange-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Returns & Refunds
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            Current return status for seller order items.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatusBox
                        label="Requested"
                        value={
                            dashboard.returns.requested
                        }
                        valueClass="text-amber-600"
                    />

                    <StatusBox
                        label="Approved"
                        value={
                            dashboard.returns.approved
                        }
                    />

                    <StatusBox
                        label="Returned"
                        value={
                            dashboard.returns.returned
                        }
                    />

                    <StatusBox
                        label="Refunded"
                        value={
                            dashboard.returns.refunded
                        }
                        valueClass="text-emerald-600"
                    />
                </div>
            </section>


            {/* PAYMENT + RETURNS SUMMARY */}

            <div className="grid lg:grid-cols-2 gap-5">
                <SummaryCard title="Payment Summary">
                    <SummaryRow
                        label="Cash On Delivery"
                        value={formatNumber(
                            dashboard.payment.cashOnDelivery
                        )}
                    />

                    <SummaryRow
                        label="Initiated Payments"
                        value={formatNumber(
                            dashboard.payment.initiatedPayments
                        )}
                    />

                    <SummaryRow
                        label="Pending Payments"
                        value={formatNumber(
                            dashboard.payment.pendingPayments
                        )}
                    />

                    <SummaryRow
                        label="Completed Payments"
                        value={formatNumber(
                            dashboard.payment.completedPayments
                        )}
                        valueClass="text-emerald-600"
                    />

                    <SummaryRow
                        label="Failed Payments"
                        value={formatNumber(
                            dashboard.payment.failedPayments
                        )}
                        valueClass="text-red-600"
                    />

                    <SummaryRow
                        label="Refund Pending"
                        value={formatNumber(
                            dashboard.payment.refundPendingPayments
                        )}
                        valueClass="text-amber-600"
                    />

                    <SummaryRow
                        label="Refunded Payments"
                        value={formatNumber(
                            dashboard.payment.refundedPayments
                        )}
                    />

                    <SummaryRow
                        label="Cancelled Payments"
                        value={formatNumber(
                            dashboard.payment.cancelledPayments
                        )}
                        valueClass="text-red-600"
                    />

                    <div className="border-t border-slate-100 pt-3">
                        <SummaryRow
                            label="Recognized Revenue"
                            value={formatCurrency(
                                dashboard.revenue
                            )}
                            valueClass="text-emerald-600"
                        />
                    </div>
                </SummaryCard>


                <SummaryCard title="Returns Summary">
                    <SummaryRow
                        label="Requested"
                        value={formatNumber(
                            dashboard.returns.requested
                        )}
                    />

                    <SummaryRow
                        label="Approved"
                        value={formatNumber(
                            dashboard.returns.approved
                        )}
                    />

                    <SummaryRow
                        label="Returned"
                        value={formatNumber(
                            dashboard.returns.returned
                        )}
                    />

                    <SummaryRow
                        label="Refunded"
                        value={formatNumber(
                            dashboard.returns.refunded
                        )}
                        valueClass="text-emerald-600"
                    />
                </SummaryCard>
            </div>


            {/* BUSINESS SUMMARY */}

            <div className="grid lg:grid-cols-2 gap-5">
                <SummaryCard title="Business Summary">
                    <SummaryRow
                        label="Products"
                        value={formatNumber(
                            dashboard.totalProducts
                        )}
                    />

                    <SummaryRow
                        label="Unique Orders"
                        value={formatNumber(
                            dashboard.totalOrders
                        )}
                    />

                    <SummaryRow
                        label="Total Order Items"
                        value={formatNumber(
                            dashboard.totalOrderItems
                        )}
                    />

                    <SummaryRow
                        label="Completed Items"
                        value={formatNumber(
                            dashboard.completedItems
                        )}
                        valueClass="text-emerald-600"
                    />

                    <SummaryRow
                        label="Pending Order Items"
                        value={formatNumber(
                            dashboard.pendingOrderItems
                        )}
                        valueClass="text-amber-600"
                    />

                    <SummaryRow
                        label="Delivered Items"
                        value={formatNumber(
                            dashboard.delivery.delivered
                        )}
                    />

                    <SummaryRow
                        label="Customers"
                        value={formatNumber(
                            dashboard.customers
                        )}
                    />

                    <SummaryRow
                        label="Revenue"
                        value={formatCurrency(
                            dashboard.revenue
                        )}
                        valueClass="text-emerald-600"
                    />
                </SummaryCard>


                <SummaryCard title="Inventory Status">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Package
                                    size={20}
                                    className="text-blue-600"
                                />
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Listed products
                                </p>

                                <p className="text-xl font-black text-slate-900">
                                    {formatNumber(
                                        dashboard.totalProducts
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`mt-3 flex items-center justify-between rounded-xl p-4 ${dashboard.lowStock > 0
                                ? "bg-amber-50"
                                : "bg-emerald-50"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle
                                size={20}
                                className={
                                    dashboard.lowStock > 0
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                }
                            />

                            <div>
                                <p className="text-xs text-slate-500">
                                    Low stock alerts
                                </p>

                                <p className="text-xl font-black text-slate-900">
                                    {formatNumber(
                                        dashboard.lowStock
                                    )}
                                </p>
                            </div>
                        </div>

                        {dashboard.lowStock > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/seller/products"
                                    )
                                }
                                className="text-xs font-bold text-amber-700 hover:underline"
                            >
                                Review
                            </button>
                        )}
                    </div>
                </SummaryCard>
            </div>


            {/* SUBSCRIPTION */}

            <motion.section
                initial={{
                    opacity: 0,
                    y: 12
                }}
                animate={{
                    opacity: 1,
                    y: 0
                }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                            <CreditCard
                                size={24}
                                className="text-blue-600"
                            />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Subscription
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                {subscriptionMessage}
                            </p>

                            {dashboard.subscriptionEnd && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Valid till{" "}
                                    <span className="font-semibold text-slate-700">
                                        {formatDate(
                                            dashboard.subscriptionEnd
                                        )}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${dashboard.isSubscribed
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {dashboard.isSubscribed ? (
                                <CheckCircle2 size={15} />
                            ) : (
                                <XCircle size={15} />
                            )}

                            {dashboard.isSubscribed
                                ? "Active"
                                : "Expired"}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/seller/subscription"
                                )
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                        >
                            Manage
                        </button>
                    </div>
                </div>
            </motion.section>


            {/* QUICK ACTIONS */}

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-lg font-bold text-slate-900">
                        Quick Actions
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                        Common seller tasks.
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <ActionButton
                        icon={Plus}
                        title="Add Product"
                        description="Create product"
                        onClick={() =>
                            navigate(
                                "/seller/products"
                            )
                        }
                    />

                    <ActionButton
                        icon={ShoppingCart}
                        title="Orders"
                        description="Manage orders"
                        onClick={() =>
                            navigate(
                                "/seller/orders"
                            )
                        }
                    />

                    <ActionButton
                        icon={Package}
                        title="Returns"
                        description="Manage returns"
                        onClick={() =>
                            navigate(
                                "/seller/returns"
                            )
                        }
                    />

                    <ActionButton
                        icon={CreditCard}
                        title="Subscription"
                        description="Manage plan"
                        onClick={() =>
                            navigate(
                                "/seller/subscription"
                            )
                        }
                    />
                </div>
            </section>


            {/* CHECKLIST */}

            <section className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <Activity size={22} />

                    <h2 className="text-lg font-bold">
                        Seller Checklist
                    </h2>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
                    <ChecklistItem
                        text="Keep product information accurate"
                        done={true}
                    />

                    <ChecklistItem
                        text="Keep inventory quantities updated"
                        done={
                            dashboard.lowStock === 0
                        }
                    />

                    <ChecklistItem
                        text="Process pending order items quickly"
                        done={
                            dashboard.pendingOrderItems === 0
                        }
                    />

                    <ChecklistItem
                        text={
                            dashboard.isSubscribed
                                ? "Subscription is active"
                                : "Renew your seller subscription"
                        }
                        done={
                            dashboard.isSubscribed
                        }
                    />

                    <ChecklistItem
                        text={
                            dashboard.returns.requested > 0
                                ? `${formatNumber(
                                    dashboard.returns.requested
                                )} return request(s) need attention`
                                : "No pending return requests"
                        }
                        done={
                            dashboard.returns.requested === 0
                        }
                    />
                </div>
            </section>


            <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} SunilMedMarket Seller Portal
            </footer>
        </div>
    );
}


// =========================================================
// MINI STAT
// =========================================================

function MiniStat({
    icon: Icon,
    label,
    value
}) {
    return (
        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/10">
            <Icon size={25} />

            <p className="mt-4 text-xs text-blue-100">
                {label}
            </p>

            <p className="mt-1 text-3xl font-black">
                {formatNumber(value)}
            </p>
        </div>
    );
}


// =========================================================
// STATUS BOX
// =========================================================

function StatusBox({
    label,
    value,
    valueClass = "text-slate-900"
}) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p
                className={`mt-2 text-2xl font-black ${valueClass}`}
            >
                {formatNumber(value)}
            </p>
        </div>
    );
}


// =========================================================
// ACTION BUTTON
// =========================================================

function ActionButton({
    icon: Icon,
    title,
    description,
    onClick
}) {
    return (
        <motion.button
            type="button"
            whileHover={{
                y: -2
            }}
            whileTap={{
                scale: 0.98
            }}
            onClick={onClick}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Icon
                        size={19}
                        className="text-blue-600"
                    />
                </div>

                <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                        {title}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {description}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}


// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
    title,
    children
}) {
    return (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-5">
                {title}
            </h2>

            <div className="space-y-3">
                {children}
            </div>
        </section>
    );
}


// =========================================================
// SUMMARY ROW
// =========================================================

function SummaryRow({
    label,
    value,
    valueClass = "text-slate-900"
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg py-1">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span
                className={`text-sm font-bold ${valueClass}`}
            >
                {value}
            </span>
        </div>
    );
}


// =========================================================
// CHECKLIST
// =========================================================

function ChecklistItem({
    text,
    done = false
}) {
    return (
        <div className="flex items-start gap-3">
            <CheckCircle2
                size={18}
                className={
                    done
                        ? "text-emerald-300"
                        : "text-white/70"
                }
            />

            <span className="text-blue-50 leading-6">
                {text}
            </span>
        </div>
    );
}
