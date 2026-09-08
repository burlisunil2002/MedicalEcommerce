import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    Search,
    Download,
    RefreshCw,
    Package,
    CircleDollarSign,
    Clock,
    CheckCircle,
    Truck,
    CreditCard,
    RotateCcw,
    Users,
    XCircle,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    TrendingUp,
    BarChart3,
    Boxes,
    Filter,
    Loader2
} from "lucide-react";

import API from "../services/api";
import toast from "react-hot-toast";


// =========================================================
// CONSTANTS
// =========================================================

const CACHE_KEY = "seller_admin_orders_v3";
const PAGE_SIZE = 100;
const SEARCH_DELAY = 450;

const EMPTY_STATS = {
    totalOrders: 0,
    totalOrderItems: 0,
    completed: 0,
    pending: 0,
    revenue: 0,
    customers: 0,

    payment: {
        cashOnDelivery: 0,
        initiatedPayments: 0,
        pendingPayments: 0,
        completedPayments: 0,
        failedPayments: 0,
        refundPendingPayments: 0,
        refundedPayments: 0,
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

const EMPTY_FILTERS = {
    search: "",
    fromDate: "",
    toDate: "",
    paymentStatus: "",
    orderStatus: "",
    page: 1
};

const PAYMENT_STATUSES = [
    "",
    "Pending",
    "Completed",
    "Failed",
    "Refunded",
    "Cash On Delivery",
    "Refund Pending"
];

const DELIVERY_STATUSES = [
    "",
    "Placed",
    "Accepted",
    "Packed",
    "Shipped",
    "OutForDelivery",
    "Delivered",
    "Cancelled"
];


// =========================================================
// HELPERS
// =========================================================

const numberValue = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(numberValue(value));

const number = (value) =>
    numberValue(value).toLocaleString("en-IN");

const dateText = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const normalize = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const isCompletedOrderItem = (order) =>
    normalize(order?.paymentStatus) === "completed" &&
    normalize(
        order?.orderStatus ||
        order?.orderItemStatus
    ) === "delivered";

const safeJsonParse = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};


// =========================================================
// COMPONENT
// =========================================================

export default function AdminOrders() {

    // ---------------------------------------------------------
    // ROLE
    // ---------------------------------------------------------

    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const isAdmin = role === "Admin";
    const isSeller = role === "Seller";


    // ---------------------------------------------------------
    // DATA
    // ---------------------------------------------------------

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [monthlyStats, setMonthlyStats] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: PAGE_SIZE,
        totalPages: 0,
        totalOrders: 0,
        totalOrderItems: 0
    });


    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const [activeTab, setActiveTab] = useState("ALL");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const [editedOrders, setEditedOrders] = useState({});

    const [lastUpdated, setLastUpdated] = useState(null);


    // ---------------------------------------------------------
    // FILTERS
    // ---------------------------------------------------------

    const [filters, setFilters] = useState(
        EMPTY_FILTERS
    );

    const searchTimer = useRef(null);


    // =========================================================
    // CACHE
    // =========================================================

    const restoreCache = useCallback(() => {
        try {
            const raw = sessionStorage.getItem(
                CACHE_KEY
            );

            if (!raw) return;

            const cached = safeJsonParse(raw);

            if (!cached) return;

            if (Array.isArray(cached.orders)) {
                setOrders(cached.orders);
            }

            if (cached.stats) {
                setStats({
                    ...EMPTY_STATS,
                    ...cached.stats,
                    payment: {
                        ...EMPTY_STATS.payment,
                        ...(cached.stats.payment || {})
                    },
                    delivery: {
                        ...EMPTY_STATS.delivery,
                        ...(cached.stats.delivery || {})
                    },
                    returns: {
                        ...EMPTY_STATS.returns,
                        ...(cached.stats.returns || {})
                    }
                });
            }

            if (Array.isArray(cached.monthlyStats)) {
                setMonthlyStats(
                    cached.monthlyStats
                );
            }

            if (cached.pagination) {
                setPagination(
                    cached.pagination
                );
            }

            if (cached.updatedAt) {
                setLastUpdated(
                    new Date(cached.updatedAt)
                );
            }

            setInitialLoading(false);
        } catch (error) {
            console.warn(
                "Unable to restore order cache.",
                error
            );
        }
    }, [role]);


    useEffect(() => {
        restoreCache();
    }, [restoreCache]);


    // =========================================================
    // CURRENT USER
    // =========================================================

    const loadCurrentUser = useCallback(
        async () => {
            try {
                setRoleLoading(true);

                const response =
                    await API.get("/api/user");

                const data =
                    response?.data || {};

                const user =
                    data?.user || data;

                const roles =
                    user?.roles ||
                    user?.Roles ||
                    data?.roles ||
                    data?.Roles ||
                    [];

                let returnedRole =
                    user?.role ||
                    user?.Role ||
                    data?.role ||
                    data?.Role;

                /*
                 * Seller accounts can have both Customer
                 * and Seller roles. Always prefer Admin,
                 * then Seller, then Customer.
                 */

                if (Array.isArray(roles)) {
                    const normalizedRoles =
                        roles.map(
                            item =>
                                String(item)
                                    .trim()
                                    .toLowerCase()
                        );

                    if (
                        normalizedRoles.includes(
                            "admin"
                        )
                    ) {
                        returnedRole = "Admin";
                    } else if (
                        normalizedRoles.includes(
                            "seller"
                        )
                    ) {
                        returnedRole = "Seller";
                    }
                }

                const normalizedRole =
                    String(returnedRole || "")
                        .trim()
                        .toLowerCase();

                if (
                    normalizedRole === "admin"
                ) {
                    setRole("Admin");
                } else if (
                    normalizedRole === "seller"
                ) {
                    setRole("Seller");
                } else {
                    setRole(null);

                    toast.error(
                        "You are not authorized to manage orders."
                    );
                }
            } catch (error) {
                console.error(
                    "Role identification error:",
                    error
                );

                setRole(null);

                if (
                    error?.response?.status ===
                    401
                ) {
                    toast.error(
                        "Your session has expired. Please login again."
                    );
                } else {
                    toast.error(
                        "Unable to identify your account."
                    );
                }
            } finally {
                setRoleLoading(false);
            }
        },
        []
    );


    useEffect(() => {
        loadCurrentUser();
    }, [loadCurrentUser]);


    // =========================================================
    // LOAD ORDERS
    // =========================================================

    const loadOrders = useCallback(
        async ({
            showInitialLoader = false,
            showRefresh = false
        } = {}) => {

            if (!role) {
                return;
            }

            try {
                if (showInitialLoader) {
                    setInitialLoading(true);
                }

                if (showRefresh) {
                    setRefreshing(true);
                }

                setLoading(true);

                const endpoint = isAdmin
                    ? "/api/admin/orders"
                    : "/api/Seller/orders";

                const params = {
                    search:
                        filters.search.trim() ||
                        undefined,

                    fromDate:
                        filters.fromDate ||
                        undefined,

                    toDate:
                        filters.toDate ||
                        undefined,

                    paymentStatus:
                        isAdmin
                            ? (
                                filters.paymentStatus ||
                                undefined
                            )
                            : undefined,

                    orderStatus:
                        filters.orderStatus ||
                        undefined,

                    page:
                        filters.page,

                    pageSize:
                        PAGE_SIZE
                };

                const response =
                    await API.get(
                        endpoint,
                        { params }
                    );

                const data =
                    response?.data || {};

                const receivedOrders =
                    Array.isArray(data.orders)
                        ? data.orders
                        : [];

                const statistics =
                    data.statistics || {};

                const payment =
                    statistics.payment ||
                    data.payment ||
                    {};

                const delivery =
                    statistics.delivery ||
                    data.delivery ||
                    {};

                const returns =
                    statistics.returns ||
                    data.returns ||
                    {};

                const nextStats = {
                    totalOrders:
                        numberValue(
                            statistics.totalOrders ??
                            data?.pagination?.totalOrders
                        ),

                    totalOrderItems:
                        numberValue(
                            statistics.totalOrderItems ??
                            data?.pagination?.totalOrderItems ??
                            data?.pagination?.totalItems
                        ),

                    completed:
                        numberValue(
                            statistics.completed ??
                            statistics.completedItems
                        ),

                    pending:
                        numberValue(
                            statistics.pending ??
                            statistics.pendingItems
                        ),

                    revenue:
                        numberValue(
                            statistics.revenue
                        ),

                    customers:
                        numberValue(
                            statistics.customers ??
                            statistics.uniqueCustomers ??
                            data?.customers
                        ),

                    payment: {
                        cashOnDelivery:
                            numberValue(
                                payment.cashOnDelivery ??
                                payment.cod
                            ),

                        initiatedPayments:
                            numberValue(
                                payment.initiatedPayments ??
                                payment.initiated
                            ),

                        pendingPayments:
                            numberValue(
                                payment.pendingPayments ??
                                payment.pending
                            ),

                        completedPayments:
                            numberValue(
                                payment.completedPayments ??
                                payment.completed
                            ),

                        failedPayments:
                            numberValue(
                                payment.failedPayments ??
                                payment.failed
                            ),

                        refundPendingPayments:
                            numberValue(
                                payment.refundPendingPayments ??
                                payment.refundPending ??
                                payment.refundpending
                            ),

                        refundedPayments:
                            numberValue(
                                payment.refundedPayments ??
                                payment.refunded
                            ),

                        cancelledPayments:
                            numberValue(
                                payment.cancelledPayments ??
                                payment.cancelled
                            )
                    },

                    delivery: {
                        placed:
                            numberValue(
                                delivery.placed ??
                                delivery.placedItems
                            ),

                        accepted:
                            numberValue(
                                delivery.accepted ??
                                delivery.acceptedItems
                            ),

                        packed:
                            numberValue(
                                delivery.packed ??
                                delivery.packedItems
                            ),

                        shipped:
                            numberValue(
                                delivery.shipped ??
                                delivery.shippedItems
                            ),

                        outForDelivery:
                            numberValue(
                                delivery.outForDelivery ??
                                delivery.outForDeliveryItems
                            ),

                        delivered:
                            numberValue(
                                delivery.delivered ??
                                delivery.deliveredItems
                            ),

                        cancelled:
                            numberValue(
                                delivery.cancelled ??
                                delivery.cancelledItems
                            )
                    },

                    returns: {
                        requested:
                            numberValue(
                                returns.requested ??
                                returns.returnRequested
                            ),

                        approved:
                            numberValue(
                                returns.approved ??
                                returns.returnApproved
                            ),

                        returned:
                            numberValue(
                                returns.returned
                            ),

                        refunded:
                            numberValue(
                                returns.refunded
                            )
                    }
                };

                const nextPagination = {
                    page:
                        numberValue(
                            data?.pagination?.page ??
                            filters.page
                        ),

                    pageSize:
                        numberValue(
                            data?.pagination?.pageSize ??
                            PAGE_SIZE
                        ),

                    totalPages:
                        numberValue(
                            data?.pagination?.totalPages
                        ),

                    totalOrders:
                        numberValue(
                            data?.pagination?.totalOrders ??
                            nextStats.totalOrders
                        ),

                    totalOrderItems:
                        numberValue(
                            data?.pagination?.totalOrderItems ??
                            nextStats.totalOrderItems
                        )
                };

                /*
                 * Preferred backend property:
                 *
                 * monthlyStatistics: [
                 *   {
                 *     month: "2026-01",
                 *     label: "Jan 2026",
                 *     totalOrders: 10,
                 *     totalOrderItems: 15,
                 *     completed: 8,
                 *     pending: 7,
                 *     revenue: 25000,
                 *     payment: {...},
                 *     delivery: {...},
                 *     returns: {...}
                 *   }
                 * ]
                 */

                const receivedMonthly =
                    Array.isArray(
                        data.monthlyStatistics
                    )
                        ? data.monthlyStatistics
                        : Array.isArray(
                            data.monthlyStats
                        )
                            ? data.monthlyStats
                            : [];

                setOrders(receivedOrders);
                setStats(nextStats);
                setPagination(nextPagination);

                if (
                    receivedMonthly.length > 0
                ) {
                    setMonthlyStats(
                        receivedMonthly
                    );
                }

                const now =
                    new Date();

                setLastUpdated(now);

                try {
                    sessionStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({
                            role,
                            orders:
                                receivedOrders,
                            stats:
                                nextStats,
                            monthlyStats:
                                receivedMonthly.length
                                    ? receivedMonthly
                                    : monthlyStats,
                            pagination:
                                nextPagination,
                            updatedAt:
                                now.toISOString()
                        })
                    );
                } catch (cacheError) {
                    console.warn(
                        "Unable to save order cache.",
                        cacheError
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load orders:",
                    error
                );

                /*
                 * Do not destroy the current screen on
                 * background refresh. Existing data remains
                 * visible while the API is unavailable.
                 */

                if (!orders.length) {
                    toast.error(
                        error?.response?.data?.message ||
                        "Failed to load orders."
                    );
                }
            } finally {
                setLoading(false);
                setInitialLoading(false);
                setRefreshing(false);
            }
        },
        [
            role,
            isAdmin,
            filters,
            orders.length,
            monthlyStats
        ]
    );


    // =========================================================
    // INITIAL DATA LOAD
    // =========================================================

    useEffect(() => {
        if (
            !roleLoading &&
            role
        ) {
            loadOrders({
                showInitialLoader:
                    orders.length === 0
            });
        }
    }, [
        roleLoading,
        role
    ]);


    // =========================================================
    // FILTER / SEARCH
    //
    // Search is debounced so typing does not fire an API
    // request for every single character.
    // =========================================================

    useEffect(() => {
        if (
            roleLoading ||
            !role
        ) {
            return;
        }

        clearTimeout(
            searchTimer.current
        );

        searchTimer.current =
            setTimeout(() => {
                loadOrders({
                    showInitialLoader: false
                });
            }, SEARCH_DELAY);

        return () => {
            clearTimeout(
                searchTimer.current
            );
        };
    }, [
        filters.search
    ]);


    // =========================================================
    // NON-SEARCH FILTERS + PAGINATION
    // =========================================================

    useEffect(() => {
        if (
            roleLoading ||
            !role
        ) {
            return;
        }

        loadOrders({
            showInitialLoader: false
        });
    }, [
        filters.fromDate,
        filters.toDate,
        filters.paymentStatus,
        filters.orderStatus,
        filters.page
    ]);


    // =========================================================
    // UPDATE STATUS
    // =========================================================

    const updateStatus = async (
        orderItemId,
        paymentStatus,
        orderStatus
    ) => {

        if (!orderItemId) {
            toast.error(
                "Invalid order item."
            );
            return;
        }

        try {
            setUpdatingId(
                orderItemId
            );

            if (isAdmin) {
                await API.put(
                    `/api/admin/orders/items/${orderItemId}/status`,
                    {
                        paymentStatus,
                        itemOrderStatus:
                            orderStatus
                    }
                );
            } else if (isSeller) {
                await API.put(
                    `/api/Seller/orders/items/${orderItemId}/status`,
                    {
                        itemOrderStatus:
                            orderStatus
                    }
                );
            } else {
                toast.error(
                    "You are not authorized."
                );
                return;
            }

            /*
             * Optimistic row update.
             * The complete server statistics are refreshed
             * immediately afterwards.
             */

            setOrders(prev =>
                prev.map(order =>
                    order.orderItemId ===
                        orderItemId
                        ? {
                            ...order,
                            paymentStatus:
                                isAdmin
                                    ? paymentStatus
                                    : order.paymentStatus,
                            orderStatus
                        }
                        : order
                )
            );

            setEditedOrders(prev => {
                const copy = {
                    ...prev
                };

                delete copy[
                    orderItemId
                ];

                return copy;
            });

            toast.success(
                "Order updated successfully."
            );

            await loadOrders({
                showInitialLoader: false
            });
        } catch (error) {
            console.error(
                "Order status update error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Failed to update order."
            );
        } finally {
            setUpdatingId(null);
        }
    };


    // =========================================================
    // EXPORT
    // =========================================================

    const exportExcel = () => {
        const endpoint = isAdmin
            ? "/api/admin/orders/export"
            : "/api/Seller/orders/export";

        const baseURL =
            API.defaults?.baseURL || "";

        const query = new URLSearchParams();

        if (filters.search) {
            query.set(
                "search",
                filters.search
            );
        }

        if (filters.fromDate) {
            query.set(
                "fromDate",
                filters.fromDate
            );
        }

        if (filters.toDate) {
            query.set(
                "toDate",
                filters.toDate
            );
        }

        if (
            isAdmin &&
            filters.paymentStatus
        ) {
            query.set(
                "paymentStatus",
                filters.paymentStatus
            );
        }

        if (filters.orderStatus) {
            query.set(
                "orderStatus",
                filters.orderStatus
            );
        }

        window.open(
            `${baseURL}${endpoint}?${query.toString()}`,
            "_blank",
            "noopener,noreferrer"
        );
    };


    // =========================================================
    // TABS
    // =========================================================

    const visibleOrders = useMemo(() => {
        if (activeTab === "ALL") {
            return orders;
        }

        if (activeTab === "COMPLETED") {
            return orders.filter(
                isCompletedOrderItem
            );
        }

        return orders.filter(
            order =>
                !isCompletedOrderItem(
                    order
                )
        );
    }, [
        orders,
        activeTab
    ]);


    // =========================================================
    // TAB COUNTS
    // =========================================================

    const tabCounts = useMemo(() => {
        let completed = 0;

        orders.forEach(order => {
            if (
                isCompletedOrderItem(
                    order
                )
            ) {
                completed++;
            }
        });

        return {
            all: orders.length,
            completed,
            pending:
                orders.length - completed
        };
    }, [orders]);


    // =========================================================
    // MONTHLY DATA
    // =========================================================

    const usableMonthlyStats =
        useMemo(() => {

            if (
                !Array.isArray(
                    monthlyStats
                )
            ) {
                return [];
            }

            return monthlyStats
                .map((item) => ({
                    ...item,

                    totalOrders:
                        numberValue(
                            item.totalOrders
                        ),

                    totalOrderItems:
                        numberValue(
                            item.totalOrderItems
                        ),

                    completed:
                        numberValue(
                            item.completed ??
                            item.completedItems
                        ),

                    pending:
                        numberValue(
                            item.pending ??
                            item.pendingItems
                        ),

                    revenue:
                        numberValue(
                            item.revenue
                        )
                }))
                .sort((a, b) =>
                    String(
                        a.month ||
                        a.key ||
                        a.label ||
                        ""
                    ).localeCompare(
                        String(
                            b.month ||
                            b.key ||
                            b.label ||
                            ""
                        )
                    )
                );
        }, [
            monthlyStats
        ]);


    // =========================================================
    // LOADING
    // =========================================================

    if (
        roleLoading ||
        (
            initialLoading &&
            orders.length === 0
        )
    ) {
        return (
            <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
                <div className="max-w-[1700px] mx-auto">
                    <div className="h-8 w-52 bg-slate-200 rounded-xl animate-pulse" />

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {Array.from({
                            length: 4
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="h-32 bg-white rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>

                    <div className="h-96 bg-white rounded-2xl mt-6 animate-pulse" />
                </div>
            </div>
        );
    }


    // =========================================================
    // ACCESS DENIED
    // =========================================================

    if (
        !isAdmin &&
        !isSeller
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-md">
                    <Package
                        size={48}
                        className="mx-auto text-slate-300"
                    />

                    <h2 className="text-xl font-bold text-slate-800 mt-4">
                        Access Denied
                    </h2>

                    <p className="text-slate-500 mt-2">
                        You do not have permission
                        to manage orders.
                    </p>
                </div>
            </div>
        );
    }


    // =========================================================
    // MAIN
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-100 p-3 sm:p-5 lg:p-8">

            <div className="max-w-[1700px] mx-auto">

                {/* BACKGROUND REFRESH BAR */}

                {loading && !initialLoading && (
                    <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-blue-100">
                        <div className="h-full w-1/3 bg-blue-600 animate-[loadingbar_1.2s_ease-in-out_infinite]" />
                    </div>
                )}


                {/* HEADER */}

                <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                                Order Management
                            </h1>

                            <span
                                className={`px-3 py-1 rounded-full text-[11px] font-black ${isAdmin
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                            >
                                {isAdmin
                                    ? "ADMIN"
                                    : "SELLER"}
                            </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-2 max-w-3xl">
                            Track orders, order items,
                            payments, deliveries, returns,
                            customers and recognized revenue
                            in one production dashboard.
                        </p>

                        {lastUpdated && (
                            <p className="text-xs text-slate-400 mt-2">
                                Last synced{" "}
                                {lastUpdated.toLocaleTimeString(
                                    "en-IN",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit"
                                    }
                                )}
                            </p>
                        )}
                    </div>


                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                loadOrders({
                                    showRefresh: true
                                })
                            }
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-60"
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
                                ? "Syncing..."
                                : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={exportExcel}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-sm"
                        >
                            <Download size={17} />
                            <span className="hidden sm:inline">
                                Export
                            </span>
                            Excel
                        </button>
                    </div>
                </header>


                {/* MAIN KPI CARDS */}

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">

                    <KpiCard
                        title={
                            isAdmin
                                ? "Unique Orders"
                                : "My Orders"
                        }
                        value={stats.totalOrders}
                        icon={Package}
                        iconClass="text-blue-600"
                        bgClass="bg-blue-50"
                        description="Distinct order IDs"
                    />

                    <KpiCard
                        title="Order Items"
                        value={
                            stats.totalOrderItems
                        }
                        icon={Boxes}
                        iconClass="text-indigo-600"
                        bgClass="bg-indigo-50"
                        description="Seller order items"
                    />

                    <KpiCard
                        title="Pending Items"
                        value={stats.pending}
                        icon={Clock}
                        iconClass="text-amber-600"
                        bgClass="bg-amber-50"
                        description="Not completed"
                    />

                    <KpiCard
                        title="Delivered Items"
                        value={
                            stats.delivery.delivered
                        }
                        icon={CheckCircle}
                        iconClass="text-emerald-600"
                        bgClass="bg-emerald-50"
                        description="Successfully delivered"
                    />

                    <KpiCard
                        title="Completed"
                        value={stats.completed}
                        icon={CheckCircle}
                        iconClass="text-green-600"
                        bgClass="bg-green-50"
                        description="Paid + delivered"
                    />

                    <KpiCard
                        title="Customers"
                        value={
                            /*
                             * Backend should return unique
                             * customer count in statistics.
                             */
                            stats.customers || 0
                        }
                        icon={Users}
                        iconClass="text-violet-600"
                        bgClass="bg-violet-50"
                        description="Unique customers"
                    />

                    <KpiCard
                        title={
                            isAdmin
                                ? "Marketplace Revenue"
                                : "My Revenue"
                        }
                        value={money(
                            stats.revenue
                        )}
                        icon={CircleDollarSign}
                        iconClass="text-emerald-600"
                        bgClass="bg-emerald-50"
                        description="Paid + delivered only"
                        moneyValue
                    />

                    <KpiCard
                        title="Returned / Refunded"
                        value={
                            number(
                                stats.returns.returned +
                                stats.returns.refunded
                            )
                        }
                        icon={RotateCcw}
                        iconClass="text-orange-600"
                        bgClass="bg-orange-50"
                        description="Return activity"
                    />

                </section>


                {/* PAYMENT + DELIVERY + RETURNS */}

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">

                    <StatPanel
                        title="Payment Overview"
                        icon={CreditCard}
                        iconClass="text-blue-600"
                        bgClass="bg-blue-50"
                    >
                        <MiniStat
                            label="COD"
                            value={
                                stats.payment.cashOnDelivery
                            }
                        />

                        <MiniStat
                            label="Initiated"
                            value={
                                stats.payment.initiatedPayments
                            }
                        />

                        <MiniStat
                            label="Pending"
                            value={
                                stats.payment.pendingPayments
                            }
                        />

                        <MiniStat
                            label="Completed"
                            value={
                                stats.payment.completedPayments
                            }
                            valueClass="text-emerald-600"
                        />

                        <MiniStat
                            label="Failed"
                            value={
                                stats.payment.failedPayments
                            }
                            valueClass="text-red-600"
                        />

                        <MiniStat
                            label="Refund Pending"
                            value={
                                stats.payment.refundPendingPayments
                            }
                            valueClass="text-amber-600"
                        />

                        <MiniStat
                            label="Refunded"
                            value={
                                stats.payment.refundedPayments
                            }
                        />

                        <MiniStat
                            label="Cancelled"
                            value={
                                stats.payment.cancelledPayments
                            }
                            valueClass="text-red-600"
                        />
                    </StatPanel>


                    <StatPanel
                        title="Delivery Overview"
                        icon={Truck}
                        iconClass="text-indigo-600"
                        bgClass="bg-indigo-50"
                    >
                        <MiniStat
                            label="Placed"
                            value={
                                stats.delivery.placed
                            }
                        />

                        <MiniStat
                            label="Accepted"
                            value={
                                stats.delivery.accepted
                            }
                        />

                        <MiniStat
                            label="Packed"
                            value={
                                stats.delivery.packed
                            }
                        />

                        <MiniStat
                            label="Shipped"
                            value={
                                stats.delivery.shipped
                            }
                        />

                        <MiniStat
                            label="Out for Delivery"
                            value={
                                stats.delivery.outForDelivery
                            }
                        />

                        <MiniStat
                            label="Delivered"
                            value={
                                stats.delivery.delivered
                            }
                            valueClass="text-emerald-600"
                        />

                        <MiniStat
                            label="Cancelled"
                            value={
                                stats.delivery.cancelled
                            }
                            valueClass="text-red-600"
                        />
                    </StatPanel>


                    <StatPanel
                        title="Returns & Refunds"
                        icon={RotateCcw}
                        iconClass="text-orange-600"
                        bgClass="bg-orange-50"
                    >
                        <MiniStat
                            label="Requested"
                            value={
                                stats.returns.requested
                            }
                            valueClass="text-amber-600"
                        />

                        <MiniStat
                            label="Approved"
                            value={
                                stats.returns.approved
                            }
                        />

                        <MiniStat
                            label="Returned"
                            value={
                                stats.returns.returned
                            }
                        />

                        <MiniStat
                            label="Refunded"
                            value={
                                stats.returns.refunded
                            }
                            valueClass="text-emerald-600"
                        />

                        <div className="col-span-2 mt-2 rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">
                                Total return activity
                            </p>

                            <p className="text-xl font-black text-slate-900 mt-1">
                                {number(
                                    stats.returns.requested +
                                    stats.returns.approved +
                                    stats.returns.returned +
                                    stats.returns.refunded
                                )}
                            </p>
                        </div>
                    </StatPanel>

                </section>


                {/* MONTHLY PERFORMANCE */}

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 mb-5">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">

                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                <BarChart3
                                    size={20}
                                    className="text-slate-700"
                                />
                            </div>

                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Monthly Performance
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Order items, completed items,
                                    pending items and revenue by month.
                                </p>
                            </div>
                        </div>

                        <span className="text-xs text-slate-400">
                            Server-side monthly statistics
                        </span>
                    </div>


                    {usableMonthlyStats.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                            <CalendarDays
                                size={30}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-2 text-sm font-semibold text-slate-600">
                                Monthly data is not available
                                from the current API response.
                            </p>

                            <p className="mt-1 text-xs text-slate-400 max-w-xl mx-auto">
                                Add a monthlyStatistics array to
                                /api/admin/orders and /api/Seller/orders
                                so the dashboard can show all historical
                                months without loading thousands of rows.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                                        <th className="p-3">
                                            Month
                                        </th>
                                        <th className="p-3">
                                            Orders
                                        </th>
                                        <th className="p-3">
                                            Order Items
                                        </th>
                                        <th className="p-3">
                                            Completed
                                        </th>
                                        <th className="p-3">
                                            Pending
                                        </th>
                                        <th className="p-3">
                                            Delivered
                                        </th>
                                        <th className="p-3">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {usableMonthlyStats.map(
                                        (month, index) => (
                                            <tr
                                                key={
                                                    month.month ||
                                                    month.key ||
                                                    index
                                                }
                                                className="border-b border-slate-50 hover:bg-slate-50"
                                            >
                                                <td className="p-3 font-bold text-slate-800">
                                                    {
                                                        month.label ||
                                                        month.month ||
                                                        month.key ||
                                                        "-"
                                                    }
                                                </td>

                                                <td className="p-3 font-semibold">
                                                    {number(
                                                        month.totalOrders
                                                    )}
                                                </td>

                                                <td className="p-3 font-semibold">
                                                    {number(
                                                        month.totalOrderItems
                                                    )}
                                                </td>

                                                <td className="p-3 font-bold text-emerald-600">
                                                    {number(
                                                        month.completed
                                                    )}
                                                </td>

                                                <td className="p-3 font-bold text-amber-600">
                                                    {number(
                                                        month.pending
                                                    )}
                                                </td>

                                                <td className="p-3 font-semibold">
                                                    {number(
                                                        month?.delivery?.delivered ??
                                                        month.delivered ??
                                                        0
                                                    )}
                                                </td>

                                                <td className="p-3 font-bold text-indigo-600">
                                                    {money(
                                                        month.revenue
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </section>


                {/* FILTERS */}

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-5 mb-5">

                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h2 className="font-black text-slate-900">
                                Search & Filters
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Search is applied automatically after typing.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setMobileFiltersOpen(
                                    value => !value
                                )
                            }
                            className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                    </div>


                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 ${mobileFiltersOpen
                                ? "block"
                                : "hidden lg:grid"
                            }`}
                    >

                        <div className="relative sm:col-span-2 lg:col-span-2">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={
                                    filters.search
                                }
                                onChange={event =>
                                    setFilters(
                                        prev => ({
                                            ...prev,
                                            search:
                                                event.target.value,
                                            page: 1
                                        })
                                    )
                                }
                                placeholder="Search order, customer, product..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>


                        <input
                            type="date"
                            value={
                                filters.fromDate
                            }
                            onChange={event =>
                                setFilters(
                                    prev => ({
                                        ...prev,
                                        fromDate:
                                            event.target.value,
                                        page: 1
                                    })
                                )
                            }
                            className="px-3 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />


                        <input
                            type="date"
                            value={
                                filters.toDate
                            }
                            onChange={event =>
                                setFilters(
                                    prev => ({
                                        ...prev,
                                        toDate:
                                            event.target.value,
                                        page: 1
                                    })
                                )
                            }
                            className="px-3 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />


                        {isAdmin && (
                            <select
                                value={
                                    filters.paymentStatus
                                }
                                onChange={event =>
                                    setFilters(
                                        prev => ({
                                            ...prev,
                                            paymentStatus:
                                                event.target.value,
                                            page: 1
                                        })
                                    )
                                }
                                className="px-3 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    All Payments
                                </option>

                                {PAYMENT_STATUSES
                                    .filter(Boolean)
                                    .map(status => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {status}
                                        </option>
                                    ))}
                            </select>
                        )}


                        <select
                            value={
                                filters.orderStatus
                            }
                            onChange={event =>
                                setFilters(
                                    prev => ({
                                        ...prev,
                                        orderStatus:
                                            event.target.value,
                                        page: 1
                                    })
                                )
                            }
                            className="px-3 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">
                                All Delivery
                            </option>

                            {DELIVERY_STATUSES
                                .filter(Boolean)
                                .map(status => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                ))}
                        </select>


                        <button
                            type="button"
                            onClick={() =>
                                setFilters(
                                    EMPTY_FILTERS
                                )
                            }
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100"
                        >
                            Clear
                        </button>

                    </div>

                </section>


                {/* TABS */}

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 mb-5">

                    <div className="grid grid-cols-3 gap-2">

                        <TabButton
                            active={
                                activeTab === "ALL"
                            }
                            onClick={() =>
                                setActiveTab("ALL")
                            }
                            label="All"
                            count={
                                tabCounts.all
                            }
                            color="slate"
                        />

                        <TabButton
                            active={
                                activeTab === "PENDING"
                            }
                            onClick={() =>
                                setActiveTab(
                                    "PENDING"
                                )
                            }
                            label="Pending"
                            count={
                                tabCounts.pending
                            }
                            color="amber"
                        />

                        <TabButton
                            active={
                                activeTab ===
                                "COMPLETED"
                            }
                            onClick={() =>
                                setActiveTab(
                                    "COMPLETED"
                                )
                            }
                            label="Completed"
                            count={
                                tabCounts.completed
                            }
                            color="emerald"
                        />

                    </div>

                </section>


                {/* ORDER TABLE */}

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                {activeTab === "ALL"
                                    ? "All Orders"
                                    : activeTab ===
                                        "COMPLETED"
                                        ? "Completed Order Items"
                                        : "Pending Order Items"}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Showing{" "}
                                {number(
                                    visibleOrders.length
                                )}{" "}
                                rows on this page
                                {pagination.totalOrderItems
                                    ? ` of ${number(
                                        pagination.totalOrderItems
                                    )} total items`
                                    : ""}
                            </p>
                        </div>

                        {loading && (
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600">
                                <Loader2
                                    size={15}
                                    className="animate-spin"
                                />
                                Syncing latest data...
                            </div>
                        )}

                    </div>


                    {/* MOBILE CARDS */}

                    <div className="block lg:hidden">

                        {visibleOrders.length === 0 ? (
                            <EmptyOrders />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {visibleOrders.map(
                                    order => (
                                        <MobileOrderCard
                                            key={
                                                order.orderItemId
                                            }
                                            order={
                                                order
                                            }
                                            isAdmin={
                                                isAdmin
                                            }
                                            edited={
                                                editedOrders[
                                                order.orderItemId
                                                ] || {}
                                            }
                                            updating={
                                                updatingId ===
                                                order.orderItemId
                                            }
                                            onEdit={(
                                                field,
                                                value
                                            ) =>
                                                setEditedOrders(
                                                    prev => ({
                                                        ...prev,
                                                        [order.orderItemId]:
                                                        {
                                                            ...prev[
                                                            order.orderItemId
                                                            ],
                                                            [field]:
                                                                value
                                                        }
                                                    })
                                                )
                                            }
                                            onUpdate={(
                                                paymentStatus,
                                                orderStatus
                                            ) =>
                                                updateStatus(
                                                    order.orderItemId,
                                                    paymentStatus,
                                                    orderStatus
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}

                    </div>


                    {/* DESKTOP TABLE */}

                    <div className="hidden lg:block overflow-x-auto">

                        <table className="w-full min-w-[1450px]">

                            <thead className="bg-slate-50 border-b border-slate-200">

                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">

                                    <th className="p-4">
                                        Order
                                    </th>

                                    <th className="p-4">
                                        Date
                                    </th>

                                    <th className="p-4">
                                        Customer
                                    </th>

                                    {isAdmin && (
                                        <th className="p-4">
                                            Seller
                                        </th>
                                    )}

                                    <th className="p-4">
                                        Product
                                    </th>

                                    <th className="p-4">
                                        Qty
                                    </th>

                                    <th className="p-4">
                                        Amount
                                    </th>

                                    <th className="p-4">
                                        Payment
                                    </th>

                                    <th className="p-4">
                                        Delivery
                                    </th>

                                    <th className="p-4">
                                        Return
                                    </th>

                                    <th className="p-4">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {visibleOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                isAdmin
                                                    ? 11
                                                    : 10
                                            }
                                        >
                                            <EmptyOrders />
                                        </td>
                                    </tr>
                                ) : (
                                    visibleOrders.map(
                                        order => (
                                            <DesktopOrderRow
                                                key={
                                                    order.orderItemId
                                                }
                                                order={
                                                    order
                                                }
                                                isAdmin={
                                                    isAdmin
                                                }
                                                edited={
                                                    editedOrders[
                                                    order.orderItemId
                                                    ] || {}
                                                }
                                                updating={
                                                    updatingId ===
                                                    order.orderItemId
                                                }
                                                onEdit={(
                                                    field,
                                                    value
                                                ) =>
                                                    setEditedOrders(
                                                        prev => ({
                                                            ...prev,
                                                            [order.orderItemId]:
                                                            {
                                                                ...prev[
                                                                order.orderItemId
                                                                ],
                                                                [field]:
                                                                    value
                                                            }
                                                        })
                                                    )
                                                }
                                                onUpdate={(
                                                    paymentStatus,
                                                    orderStatus
                                                ) =>
                                                    updateStatus(
                                                        order.orderItemId,
                                                        paymentStatus,
                                                        orderStatus
                                                    )
                                                }
                                            />
                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* PAGINATION */}

                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <p className="text-xs text-slate-500">
                                Page{" "}
                                <strong>
                                    {pagination.page}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {pagination.totalPages}
                                </strong>
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={
                                        pagination.page <=
                                        1 ||
                                        loading
                                    }
                                    onClick={() =>
                                        setFilters(
                                            prev => ({
                                                ...prev,
                                                page:
                                                    Math.max(
                                                        1,
                                                        prev.page -
                                                        1
                                                    )
                                            })
                                        )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-40"
                                >
                                    <ChevronLeft
                                        size={16}
                                    />
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.page >=
                                        pagination.totalPages ||
                                        loading
                                    }
                                    onClick={() =>
                                        setFilters(
                                            prev => ({
                                                ...prev,
                                                page:
                                                    Math.min(
                                                        pagination.totalPages,
                                                        prev.page +
                                                        1
                                                    )
                                            })
                                        )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight
                                        size={16}
                                    />
                                </button>

                            </div>

                        </div>
                    )}

                </section>

            </div>


            <style>
                {`
                    @keyframes loadingbar {
                        0% {
                            transform: translateX(-120%);
                        }
                        50% {
                            transform: translateX(220%);
                        }
                        100% {
                            transform: translateX(420%);
                        }
                    }
                `}
            </style>

        </div>
    );
}


// =========================================================
// KPI CARD
// =========================================================

function KpiCard({
    title,
    value,
    icon: Icon,
    iconClass,
    bgClass,
    description,
    moneyValue = false
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 min-w-0">

            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                        {title}
                    </p>

                    <p
                        className={`mt-2 font-black text-slate-900 break-words ${moneyValue
                                ? "text-lg sm:text-2xl"
                                : "text-2xl sm:text-3xl"
                            }`}
                    >
                        {moneyValue
                            ? value
                            : number(value)}
                    </p>

                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1 truncate">
                        {description}
                    </p>
                </div>

                <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl ${bgClass} flex items-center justify-center`}
                >
                    <Icon
                        size={21}
                        className={iconClass}
                    />
                </div>

            </div>

        </div>
    );
}


// =========================================================
// STAT PANEL
// =========================================================

function StatPanel({
    title,
    icon: Icon,
    iconClass,
    bgClass,
    children
}) {
    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">

            <div className="flex items-center gap-3 mb-4">

                <div
                    className={`h-10 w-10 rounded-xl ${bgClass} flex items-center justify-center`}
                >
                    <Icon
                        size={19}
                        className={iconClass}
                    />
                </div>

                <h2 className="font-black text-slate-900">
                    {title}
                </h2>

            </div>

            <div className="grid grid-cols-2 gap-2">
                {children}
            </div>

        </section>
    );
}


// =========================================================
// MINI STAT
// =========================================================

function MiniStat({
    label,
    value,
    valueClass = "text-slate-900"
}) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">

            <p className="text-[11px] text-slate-500 truncate">
                {label}
            </p>

            <p
                className={`mt-1 text-lg font-black ${valueClass}`}
            >
                {number(value)}
            </p>

        </div>
    );
}


// =========================================================
// TAB BUTTON
// =========================================================

function TabButton({
    active,
    onClick,
    label,
    count,
    color
}) {
    const activeClass =
        color === "amber"
            ? "bg-amber-500 text-white"
            : color === "emerald"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`py-2.5 sm:py-3 rounded-xl text-sm font-black transition ${active
                    ? activeClass
                    : "text-slate-600 hover:bg-slate-100"
                }`}
        >
            {label}

            <span
                className={`ml-1.5 ${active
                        ? "opacity-90"
                        : "text-slate-400"
                    }`}
            >
                ({number(count)})
            </span>
        </button>
    );
}


// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
    value,
    type = "delivery"
}) {
    const normalized =
        normalize(value);

    let className =
        "bg-slate-100 text-slate-700";

    if (
        normalized === "completed" ||
        normalized === "delivered" ||
        normalized === "refunded" ||
        normalized === "returned"
    ) {
        className =
            "bg-emerald-50 text-emerald-700";
    } else if (
        normalized === "failed" ||
        normalized === "cancelled"
    ) {
        className =
            "bg-red-50 text-red-700";
    } else if (
        normalized === "pending" ||
        normalized === "placed" ||
        normalized === "requested"
    ) {
        className =
            "bg-amber-50 text-amber-700";
    } else if (
        normalized === "approved" ||
        normalized === "packed" ||
        normalized === "shipped" ||
        normalized === "outfordelivery" ||
        normalized === "accepted"
    ) {
        className =
            "bg-blue-50 text-blue-700";
    }

    return (
        <span
            className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap ${className}`}
        >
            {value || "-"}
        </span>
    );
}


// =========================================================
// DESKTOP ROW
// =========================================================

function DesktopOrderRow({
    order,
    isAdmin,
    edited,
    updating,
    onEdit,
    onUpdate
}) {
    const paymentStatus =
        edited.paymentStatus ??
        order.paymentStatus ??
        "Pending";

    const orderStatus =
        edited.orderStatus ??
        order.orderStatus ??
        order.orderItemStatus ??
        "Placed";

    const isCompleted =
        normalize(paymentStatus) ===
        "completed" &&
        normalize(orderStatus) ===
        "delivered";

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50/80">

            <td className="p-4 align-top">
                <p className="font-black text-blue-600">
                    #
                    {order.orderNumber ||
                        order.orderId ||
                        order.orderItemId}
                </p>

                <p className="text-[11px] text-slate-400 mt-1">
                    Item #{order.orderItemId}
                </p>
            </td>


            <td className="p-4 align-top text-sm text-slate-600 whitespace-nowrap">
                {dateText(
                    order.orderDate
                )}
            </td>


            <td className="p-4 align-top">
                <p className="font-bold text-slate-800 max-w-[170px] truncate">
                    {order.customer ||
                        order.customerName ||
                        "-"}
                </p>
            </td>


            {isAdmin && (
                <td className="p-4 align-top">
                    <p className="font-medium text-slate-700 max-w-[170px] truncate">
                        {order.sellerName ||
                            order.seller ||
                            "-"}
                    </p>
                </td>
            )}


            <td className="p-4 align-top">
                <p className="font-bold text-slate-800 max-w-[230px]">
                    {order.productName ||
                        "-"}
                </p>

                {order.variantName && (
                    <p className="text-[11px] text-slate-400 mt-1">
                        {order.variantName}
                    </p>
                )}
            </td>


            <td className="p-4 align-top font-bold text-slate-800">
                {number(
                    order.quantity
                )}
            </td>


            <td className="p-4 align-top">
                <p className="font-black text-emerald-600 whitespace-nowrap">
                    {money(
                        isAdmin
                            ? (
                                order.grandTotal ??
                                order.finalPaidAmount ??
                                0
                            )
                            : (
                                order.sellerAmount ??
                                order.finalPaidAmount ??
                                order.lineTotal ??
                                0
                            )
                    )}
                </p>
            </td>


            <td className="p-4 align-top">
                {isAdmin ? (
                    <select
                        value={
                            paymentStatus
                        }
                        disabled={
                            updating
                        }
                        onChange={event =>
                            onEdit(
                                "paymentStatus",
                                event.target.value
                            )
                        }
                        className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PAYMENT_STATUSES
                            .filter(Boolean)
                            .map(status => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>
                            ))}
                    </select>
                ) : (
                    <StatusBadge
                        value={
                            paymentStatus
                        }
                        type="payment"
                    />
                )}
            </td>


            <td className="p-4 align-top">
                <select
                    value={
                        orderStatus
                    }
                    disabled={
                        updating
                    }
                    onChange={event =>
                        onEdit(
                            "orderStatus",
                            event.target.value
                        )
                    }
                    className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {DELIVERY_STATUSES
                        .filter(Boolean)
                        .map(status => (
                            <option
                                key={status}
                                value={status}
                            >
                                {status ===
                                    "OutForDelivery"
                                    ? "Out For Delivery"
                                    : status}
                            </option>
                        ))}
                </select>
            </td>


            <td className="p-4 align-top">
                <StatusBadge
                    value={
                        order.returnStatus ||
                        "No Return"
                    }
                />
            </td>


            <td className="p-4 align-top">
                <div className="flex flex-col gap-2 min-w-[100px]">

                    <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                            onUpdate(
                                paymentStatus,
                                orderStatus
                            )
                        }
                        className={`px-3 py-2 rounded-lg text-xs font-black ${updating
                                ? "bg-slate-300 text-slate-600"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                    >
                        {updating
                            ? "Updating..."
                            : "Update"}
                    </button>

                    {isCompleted && (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black">
                            <CheckCircle
                                size={12}
                            />
                            Completed
                        </span>
                    )}

                </div>
            </td>

        </tr>
    );
}


// =========================================================
// MOBILE CARD
// =========================================================

function MobileOrderCard({
    order,
    isAdmin,
    edited,
    updating,
    onEdit,
    onUpdate
}) {
    const paymentStatus =
        edited.paymentStatus ??
        order.paymentStatus ??
        "Pending";

    const orderStatus =
        edited.orderStatus ??
        order.orderStatus ??
        order.orderItemStatus ??
        "Placed";

    const isCompleted =
        normalize(paymentStatus) ===
        "completed" &&
        normalize(orderStatus) ===
        "delivered";

    return (
        <article className="p-4">

            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                    <p className="font-black text-blue-600">
                        #
                        {order.orderNumber ||
                            order.orderId ||
                            order.orderItemId}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                        {dateText(
                            order.orderDate
                        )}
                    </p>
                </div>

                <StatusBadge
                    value={
                        isCompleted
                            ? "Completed"
                            : orderStatus
                    }
                />

            </div>


            <div className="mt-4 rounded-xl bg-slate-50 p-3">

                <p className="text-sm font-black text-slate-800">
                    {order.productName ||
                        "-"}
                </p>

                {order.variantName && (
                    <p className="text-xs text-slate-400 mt-1">
                        {order.variantName}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3">

                    <Info label="Customer">
                        {order.customer ||
                            order.customerName ||
                            "-"}
                    </Info>

                    {isAdmin && (
                        <Info label="Seller">
                            {order.sellerName ||
                                order.seller ||
                                "-"}
                        </Info>
                    )}

                    <Info label="Quantity">
                        {number(
                            order.quantity
                        )}
                    </Info>

                    <Info label="Amount">
                        {money(
                            isAdmin
                                ? (
                                    order.grandTotal ??
                                    order.finalPaidAmount ??
                                    0
                                )
                                : (
                                    order.sellerAmount ??
                                    order.finalPaidAmount ??
                                    order.lineTotal ??
                                    0
                                )
                        )}
                    </Info>

                    <Info label="Return">
                        <StatusBadge
                            value={
                                order.returnStatus ||
                                "No Return"
                            }
                        />
                    </Info>

                </div>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">

                <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Payment
                    </p>

                    {isAdmin ? (
                        <select
                            value={
                                paymentStatus
                            }
                            disabled={
                                updating
                            }
                            onChange={event =>
                                onEdit(
                                    "paymentStatus",
                                    event.target.value
                                )
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {PAYMENT_STATUSES
                                .filter(Boolean)
                                .map(status => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                ))}
                        </select>
                    ) : (
                        <StatusBadge
                            value={
                                paymentStatus
                            }
                        />
                    )}
                </div>


                <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Delivery
                    </p>

                    <select
                        value={
                            orderStatus
                        }
                        disabled={
                            updating
                        }
                        onChange={event =>
                            onEdit(
                                "orderStatus",
                                event.target.value
                            )
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {DELIVERY_STATUSES
                            .filter(Boolean)
                            .map(status => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status ===
                                        "OutForDelivery"
                                        ? "Out For Delivery"
                                        : status}
                                </option>
                            ))}
                    </select>
                </div>

            </div>


            <button
                type="button"
                disabled={updating}
                onClick={() =>
                    onUpdate(
                        paymentStatus,
                        orderStatus
                    )
                }
                className={`w-full mt-3 py-2.5 rounded-xl text-sm font-black ${updating
                        ? "bg-slate-300 text-slate-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
            >
                {updating
                    ? "Updating..."
                    : "Save Order Update"}
            </button>

        </article>
    );
}


// =========================================================
// INFO
// =========================================================

function Info({
    label,
    children
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                {label}
            </p>

            <div className="text-sm font-semibold text-slate-700 mt-1 break-words">
                {children}
            </div>
        </div>
    );
}


// =========================================================
// EMPTY
// =========================================================

function EmptyOrders() {
    return (
        <div className="p-10 sm:p-14 text-center">
            <Package
                size={42}
                className="mx-auto text-slate-200"
            />

            <p className="mt-3 font-bold text-slate-500">
                No orders found
            </p>

            <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filters.
            </p>
        </div>
    );
}
