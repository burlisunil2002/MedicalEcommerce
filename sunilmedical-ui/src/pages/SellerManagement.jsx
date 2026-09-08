import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";
import {
    Activity,
    Building2,
    CheckCircle2,
    ChevronRight,
    Mail,
    Package,
    Phone,
    RefreshCw,
    Search,
    ShoppingCart,
    Store,
    Truck,
    Users,
    X,
    Clock3,
    IndianRupee
} from "lucide-react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";

const EMPTY = {
    totalSellers: 0,
    activeSellers: 0,
    inactiveSellers: 0,
    sellers: []
};

const toNumber = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const money = value =>
    `₹${toNumber(value).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;

const number = value =>
    toNumber(value).toLocaleString("en-IN");

const normalize = data => {
    const rows = Array.isArray(data?.sellers)
        ? data.sellers
        : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
                ? data
                : [];

    return rows.map((s, index) => ({
        sellerId: s?.sellerId ?? s?.SellerId ?? s?.id ?? index,
        businessName:
            s?.businessName ?? s?.BusinessName ?? s?.name ?? "Seller",
        ownerName:
            s?.ownerName ?? s?.OwnerName ?? "-",
        email: s?.email ?? s?.Email ?? "-",
        phone: s?.phone ?? s?.Phone ?? "-",
        productType:
            s?.productType ?? s?.ProductType ?? "-",
        isActive:
            s?.isActive ?? s?.IsActive ?? true,
        subscriptionEndDate:
            s?.subscriptionEndDate ?? s?.SubscriptionEndDate ?? null,
        createdAt: s?.createdAt ?? s?.CreatedAt ?? null,
        productCount: toNumber(
            s?.productCount ?? s?.totalProducts
        ),
        orderCount: toNumber(
            s?.orderCount ?? s?.totalOrders
        ),
        orderItems: toNumber(
            s?.orderItems ?? s?.totalOrderItems
        ),
        customers: toNumber(
            s?.customers ?? s?.uniqueCustomers
        ),
        completedOrders: toNumber(
            s?.completedOrders ?? s?.completedItems ?? s?.completed
        ),
        pendingOrders: toNumber(
            s?.pendingOrders ?? s?.pendingItems
        ),
        deliveredOrders: toNumber(
            s?.deliveredOrders ?? s?.deliveredItems
        ),
        revenue: toNumber(
            s?.revenue ?? s?.totalRevenue
        )
    }));
};

const formatDate = value => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const subscriptionState = value => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.getTime() >= Date.now() ? "Active" : "Expired";
};

export default function SellerManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("revenue");
    const [selected, setSelected] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const requestedSellerId = searchParams.get("sellerId");

    const openSellerDetails = useCallback(async (seller) => {
        if (!seller) return;

        // Show the row immediately, then replace it with the authoritative
        // single-seller response from the backend.
        setSelected(seller);
        setSearchParams(
            { sellerId: String(seller.sellerId) },
            { replace: false }
        );

        try {
            setDetailsLoading(true);

            const response = await API.get(
                `/api/admin/orders/sellers/${seller.sellerId}`
            );

            const detail = response?.data?.seller;

            if (detail) {
                const normalized = normalize({
                    sellers: [detail]
                })[0];

                setSelected(normalized);
            }
        } catch (err) {
            console.error("Seller details load error:", err);
            toast.error(
                err?.response?.data?.message ||
                "Unable to load the latest seller details."
            );
        } finally {
            setDetailsLoading(false);
        }
    }, [setSearchParams]);

    const closeSellerDetails = useCallback(() => {
        setSelected(null);
        setDetailsLoading(false);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("sellerId");

        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams]);

    const loadSellers = useCallback(async (background = false) => {
        try {
            setError("");
            if (background) setRefreshing(true);
            else setLoading(true);

            const response = await API.get("/api/admin/orders/sellers");
            const next = response?.data || {};
            const sellers = normalize(next);

            setData({
                totalSellers: toNumber(
                    next?.totalSellers ?? sellers.length
                ),
                activeSellers: toNumber(
                    next?.activeSellers ?? sellers.filter(x => x.isActive).length
                ),
                inactiveSellers: toNumber(
                    next?.inactiveSellers ?? sellers.filter(x => !x.isActive).length
                ),
                sellers
            });

            try {
                sessionStorage.setItem(
                    "admin-seller-management",
                    JSON.stringify({
                        savedAt: Date.now(),
                        totalSellers: next?.totalSellers,
                        activeSellers: next?.activeSellers,
                        inactiveSellers: next?.inactiveSellers,
                        sellers
                    })
                );
            } catch {
                // Cache is optional.
            }
        } catch (err) {
            console.error("Seller management load error:", err);
            setError(
                err?.response?.data?.message ||
                "Unable to load seller management data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        try {
            const cached = sessionStorage.getItem("admin-seller-management");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed?.sellers)) {
                    setData({
                        totalSellers: toNumber(parsed.totalSellers ?? parsed.sellers.length),
                        activeSellers: toNumber(parsed.activeSellers ?? parsed.sellers.filter(x => x.isActive).length),
                        inactiveSellers: toNumber(parsed.inactiveSellers ?? parsed.sellers.filter(x => !x.isActive).length),
                        sellers: parsed.sellers
                    });
                    setLoading(false);
                }
            }
        } catch {
            // Ignore invalid cache.
        }

        loadSellers(Boolean(sessionStorage.getItem("admin-seller-management")));

        const timer = setInterval(() => {
            loadSellers(true);
        }, 60000);

        return () => clearInterval(timer);
    }, [loadSellers]);

    useEffect(() => {
        if (!requestedSellerId || !data.sellers.length) {
            return;
        }

        const seller = data.sellers.find(
            item => String(item.sellerId) === String(requestedSellerId)
        );

        if (seller) {
            setSelected(seller);
        } else if (!loading) {
            setSelected(null);
        }
    }, [requestedSellerId, data.sellers, loading]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        const rows = data.sellers.filter(seller => {
            const matchesSearch = !q || [
                seller.businessName,
                seller.ownerName,
                seller.email,
                seller.phone,
                seller.productType,
                String(seller.sellerId)
            ].join(" ").toLowerCase().includes(q);

            const matchesStatus =
                status === "all" ||
                (status === "active" && seller.isActive) ||
                (status === "inactive" && !seller.isActive);

            return matchesSearch && matchesStatus;
        });

        return [...rows].sort((a, b) => {
            if (sort === "revenue") return b.revenue - a.revenue;
            if (sort === "orders") return b.orderCount - a.orderCount;
            if (sort === "items") return b.orderItems - a.orderItems;
            if (sort === "products") return b.productCount - a.productCount;
            if (sort === "customers") return b.customers - a.customers;
            if (sort === "name") return a.businessName.localeCompare(b.businessName);
            return 0;
        });
    }, [data.sellers, search, status, sort]);

    const summary = useMemo(() => ({
        products: data.sellers.reduce((sum, x) => sum + x.productCount, 0),
        orders: data.sellers.reduce((sum, x) => sum + x.orderCount, 0),
        items: data.sellers.reduce((sum, x) => sum + x.orderItems, 0),
        customers: data.sellers.reduce((sum, x) => sum + x.customers, 0),
        completed: data.sellers.reduce((sum, x) => sum + x.completedOrders, 0),
        pending: data.sellers.reduce((sum, x) => sum + x.pendingOrders, 0),
        delivered: data.sellers.reduce((sum, x) => sum + x.deliveredOrders, 0),
        revenue: data.sellers.reduce((sum, x) => sum + x.revenue, 0)
    }), [data.sellers]);

    const handleRefresh = async () => {
        await loadSellers(true);
        toast.success("Seller data refreshed");
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/dashboard")}
                                className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
                                aria-label="Back to dashboard"
                            >
                                <ChevronRight size={18} className="rotate-180" />
                            </button>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Store size={20} className="text-violet-600 shrink-0" />
                                    <h1 className="text-xl sm:text-2xl font-black truncate">Seller Management</h1>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                                    Monitor seller accounts, products, orders, order items, customers and revenue.
                                </p>
                                {requestedSellerId && selected && (
                                    <p className="text-[11px] text-violet-600 font-bold mt-1">
                                        Showing details for Seller #{selected.sellerId}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-10 px-3 sm:px-4 rounded-xl bg-slate-900 text-white text-sm font-black inline-flex items-center gap-2 disabled:opacity-60"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {refreshing && <div className="h-0.5 bg-violet-500 animate-pulse" />}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
                {error && (
                    <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-black text-rose-800">Seller data could not be loaded</p>
                            <p className="text-sm text-rose-600 mt-1">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadSellers(false)}
                            className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-sm font-black text-rose-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
                    <Kpi title="Total Sellers" value={data.totalSellers} icon={<Store size={18} />} />
                    <Kpi title="Active Sellers" value={data.activeSellers} icon={<CheckCircle2 size={18} />} />
                    <Kpi title="Inactive Sellers" value={data.inactiveSellers} icon={<Activity size={18} />} />
                    <Kpi title="Seller Products" value={summary.products} icon={<Package size={18} />} />
                    <Kpi title="Order Items" value={summary.items} icon={<ShoppingCart size={18} />} />
                    <Kpi title="Seller Revenue" value={money(summary.revenue)} icon={<IndianRupee size={18} />} />
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Mini label="Seller Orders" value={summary.orders} icon={<ShoppingCart size={16} />} />
                    <Mini label="Customers Served" value={summary.customers} icon={<Users size={16} />} />
                    <Mini label="Completed Items" value={summary.completed} icon={<CheckCircle2 size={16} />} />
                    <Mini label="Pending Items" value={summary.pending} icon={<Clock3 size={16} />} />
                    <Mini label="Delivered Items" value={summary.delivered} icon={<Truck size={16} />} />
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black">All Sellers</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Showing {number(filtered.length)} of {number(data.sellers.length)} seller accounts
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative min-w-0 sm:w-72">
                                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search seller, owner, email..."
                                        className="h-11 w-full pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                    />
                                </div>

                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                                >
                                    <option value="revenue">Revenue: High</option>
                                    <option value="orders">Orders: High</option>
                                    <option value="items">Items: High</option>
                                    <option value="products">Products: High</option>
                                    <option value="customers">Customers: High</option>
                                    <option value="name">Name: A-Z</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading && !data.sellers.length ? (
                        <SellerSkeleton />
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <Store size={34} className="mx-auto text-slate-300" />
                            <p className="mt-3 font-black text-slate-700">No sellers found</p>
                            <p className="text-sm text-slate-400 mt-1">Try changing your search or filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden xl:block overflow-x-auto">
                                <table className="w-full min-w-[1250px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 text-left">
                                            <th className="px-5 py-3">Seller</th>
                                            <th className="px-5 py-3">Contact</th>
                                            <th className="px-5 py-3">Products</th>
                                            <th className="px-5 py-3">Orders</th>
                                            <th className="px-5 py-3">Items</th>
                                            <th className="px-5 py-3">Customers</th>
                                            <th className="px-5 py-3">Completed</th>
                                            <th className="px-5 py-3">Pending</th>
                                            <th className="px-5 py-3">Revenue</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map(seller => (
                                            <tr key={seller.sellerId} className="hover:bg-slate-50/70">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={seller.businessName} />
                                                        <div className="min-w-0">
                                                            <p className="font-black text-sm truncate max-w-[220px]">{seller.businessName}</p>
                                                            <p className="text-xs text-slate-500 mt-1">#{seller.sellerId} · {seller.ownerName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold">{seller.email}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{seller.phone}</p>
                                                </td>
                                                <td className="px-5 py-4 font-bold">{number(seller.productCount)}</td>
                                                <td className="px-5 py-4 font-bold">{number(seller.orderCount)}</td>
                                                <td className="px-5 py-4 font-bold">{number(seller.orderItems)}</td>
                                                <td className="px-5 py-4 font-bold">{number(seller.customers)}</td>
                                                <td className="px-5 py-4 font-bold text-emerald-700">{number(seller.completedOrders)}</td>
                                                <td className="px-5 py-4 font-bold text-amber-700">{number(seller.pendingOrders)}</td>
                                                <td className="px-5 py-4 font-black text-emerald-700">{money(seller.revenue)}</td>
                                                <td className="px-5 py-4"><Status active={seller.isActive} /></td>
                                                <td className="px-5 py-4">
                                                    <button type="button" onClick={() => openSellerDetails(seller)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black">View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="xl:hidden divide-y divide-slate-100">
                                {filtered.map(seller => (
                                    <article key={seller.sellerId} className="p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar name={seller.businessName} />
                                                <div className="min-w-0">
                                                    <p className="font-black truncate">{seller.businessName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">#{seller.sellerId} · {seller.ownerName}</p>
                                                </div>
                                            </div>
                                            <Status active={seller.isActive} />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                                            <Metric label="Products" value={seller.productCount} />
                                            <Metric label="Orders" value={seller.orderCount} />
                                            <Metric label="Order Items" value={seller.orderItems} />
                                            <Metric label="Customers" value={seller.customers} />
                                            <Metric label="Completed" value={seller.completedOrders} />
                                            <Metric label="Pending" value={seller.pendingOrders} />
                                            <Metric label="Delivered" value={seller.deliveredOrders} />
                                            <Metric label="Revenue" value={money(seller.revenue)} moneyValue />
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-2"><Mail size={14} /> <span className="truncate">{seller.email}</span></div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-2"><Phone size={14} /> <span>{seller.phone}</span></div>
                                        </div>

                                        <button type="button" onClick={() => openSellerDetails(seller)} className="mt-3 w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-black">
                                            View Seller Details
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            {selected && (
                <SellerDetails
                    seller={selected}
                    onClose={closeSellerDetails}
                    loading={detailsLoading}
                />
            )}
        </div>
    );
}

function Kpi({ title, value, icon }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm min-w-0">
            <div className="flex items-center justify-between gap-2">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">{icon}</div>
                <p className="text-xl sm:text-2xl font-black truncate">{typeof value === "number" ? number(value) : value}</p>
            </div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-3 truncate">{title}</p>
        </div>
    );
}

function Mini({ label, value, icon }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="text-slate-400">{icon}</div>
            <div className="text-right min-w-0">
                <p className="font-black truncate">{number(value)}</p>
                <p className="text-[10px] text-slate-500 font-bold truncate">{label}</p>
            </div>
        </div>
    );
}

function Metric({ label, value, moneyValue = false }) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-black">{label}</p>
            <p className={`text-sm font-black mt-1 truncate ${moneyValue ? "text-emerald-700" : "text-slate-900"}`}>
                {moneyValue ? value : number(value)}
            </p>
        </div>
    );
}

function Avatar({ name }) {
    return (
        <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-black shrink-0">
            {String(name || "S").charAt(0).toUpperCase()}
        </div>
    );
}

function Status({ active }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function SellerDetails({ seller, onClose, loading = false }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" onMouseDown={onClose}>
            <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl" onMouseDown={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={seller.businessName} />
                        <div className="min-w-0">
                            <h2 className="font-black text-lg truncate">{seller.businessName}</h2>
                            <p className="text-xs text-slate-500">Seller #{seller.sellerId} · {seller.ownerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {loading && (
                            <RefreshCw
                                size={16}
                                className="text-violet-600 animate-spin"
                                aria-label="Loading seller details"
                            />
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"
                            aria-label="Close seller details"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Metric label="Products" value={seller.productCount} />
                        <Metric label="Orders" value={seller.orderCount} />
                        <Metric label="Order Items" value={seller.orderItems} />
                        <Metric label="Customers" value={seller.customers} />
                        <Metric label="Completed" value={seller.completedOrders} />
                        <Metric label="Pending" value={seller.pendingOrders} />
                        <Metric label="Delivered" value={seller.deliveredOrders} />
                        <Metric label="Revenue" value={money(seller.revenue)} moneyValue />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Info icon={<Building2 size={16} />} label="Product Type" value={seller.productType} />
                        <Info icon={<CheckCircle2 size={16} />} label="Account Status" value={seller.isActive ? "Active" : "Inactive"} />
                        <Info icon={<Mail size={16} />} label="Email" value={seller.email} />
                        <Info icon={<Phone size={16} />} label="Phone" value={seller.phone} />
                        <Info icon={<Activity size={16} />} label="Subscription" value={subscriptionState(seller.subscriptionEndDate)} />
                        <Info icon={<Clock3 size={16} />} label="Subscription End" value={formatDate(seller.subscriptionEndDate)} />
                        <Info icon={<Store size={16} />} label="Created" value={formatDate(seller.createdAt)} />
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Operational summary</p>
                        <div className="mt-3 space-y-3">
                            <Progress label="Completed Items" value={seller.completedOrders} total={seller.orderItems} />
                            <Progress label="Delivered Items" value={seller.deliveredOrders} total={seller.orderItems} />
                            <Progress label="Pending Items" value={seller.pendingOrders} total={seller.orderItems} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[10px] font-black uppercase tracking-wide">{label}</span></div>
            <p className="mt-2 text-sm font-black break-words">{value || "-"}</p>
        </div>
    );
}

function Progress({ label, value, total }) {
    const safeValue = Math.max(0, toNumber(value));
    const safeTotal = Math.max(0, toNumber(total));
    const percentage = safeTotal > 0
        ? Math.min(100, Math.round((safeValue / safeTotal) * 100))
        : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs gap-3">
                <span className="font-bold text-slate-600">{label}</span>
                <span className="font-black text-slate-900">{number(safeValue)} · {percentage}%</span>
            </div>
            <div className="h-2 mt-2 rounded-full bg-white overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function SellerSkeleton() {
    return (
        <div className="p-5 space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 rounded-2xl bg-slate-100" />
            ))}
        </div>
    );
}
