import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";
import {
    Activity,
    Building2,
    Download,
    ExternalLink,
    FileText,
    Landmark,
    MapPin,
    Warehouse,
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
        userId: s?.userId ?? s?.UserId ?? "",
        businessName:
            s?.businessName ?? s?.BusinessName ?? s?.name ?? "Seller",
        ownerName:
            s?.ownerName ?? s?.OwnerName ?? "-",
        email: s?.email ?? s?.Email ?? "-",
        phone: s?.phone ?? s?.Phone ?? "-",
        productType:
            s?.productType ?? s?.ProductType ?? "-",
        brand: s?.brand ?? s?.Brand ?? "",
        gstNumber: s?.gstNumber ?? s?.GSTNumber ?? "",
        isGSTVerified: s?.isGSTVerified ?? s?.IsGSTVerified ?? false,
        pan: s?.pan ?? s?.PAN ?? "",
        isPANVerified: s?.isPANVerified ?? s?.IsPANVerified ?? false,
        addressLine1: s?.addressLine1 ?? s?.AddressLine1 ?? s?.address ?? "",
        city: s?.city ?? s?.City ?? "",
        state: s?.state ?? s?.State ?? "",
        pincode: s?.pincode ?? s?.Pincode ?? "",
        accountHolderName: s?.accountHolderName ?? s?.AccountHolderName ?? "",
        accountNumber: s?.accountNumber ?? s?.AccountNumber ?? "",
        ifscCode: s?.ifscCode ?? s?.IFSCCode ?? "",
        bankName: s?.bankName ?? s?.BankName ?? "",
        subscriptionPlan: s?.subscriptionPlan ?? s?.SubscriptionPlan ?? "",
        freeSubscriptionStartDate: s?.freeSubscriptionStartDate ?? s?.FreeSubscriptionStartDate ?? null,
        freeSubscriptionEndDate: s?.freeSubscriptionEndDate ?? s?.FreeSubscriptionEndDate ?? null,
        isLaunchFreeSubscription: s?.isLaunchFreeSubscription ?? s?.IsLaunchFreeSubscription ?? false,
        warehouseFullAddress:
            s?.warehouseFullAddress ?? s?.WarehouseFullAddress ?? "",
        warehouseContactPersonName:
            s?.warehouseContactPersonName ?? s?.WarehouseContactPersonName ?? "",
        warehouseContactMobileNumber:
            s?.warehouseContactMobileNumber ?? s?.WarehouseContactMobileNumber ?? "",
        gstCertificateDocumentPath:
            s?.gstCertificateDocumentPath ??
            s?.GSTCertificateDocumentPath ??
            s?.gstCertificatePath ??
            s?.GSTCertificatePath ??
            s?.gstCertificateUrl ??
            s?.GSTCertificateUrl ??
            s?.gstCertificateDocumentUrl ??
            s?.GSTCertificateDocumentUrl ??
            null,
        productLicenceDocumentPath:
            s?.productLicenceDocumentPath ??
            s?.ProductLicenceDocumentPath ??
            s?.productLicencePath ??
            s?.ProductLicencePath ??
            s?.productLicenceUrl ??
            s?.ProductLicenceUrl ??
            s?.productLicenceDocumentUrl ??
            s?.ProductLicenceDocumentUrl ??
            null,
        isActive:
            s?.isActive ?? s?.IsActive ?? false,
        status:
            s?.status ??
            s?.Status ??
            ((s?.isActive ?? s?.IsActive ?? false) ? "Active" : "Pending"),
        documentPath:
            s?.gstCertificateDocumentPath ??
            s?.GSTCertificateDocumentPath ??
            s?.documentPath ??
            s?.DocumentPath ??
            s?.documentUrl ??
            s?.DocumentUrl ??
            s?.kycDocumentPath ??
            s?.KycDocumentPath ??
            null,
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
    const [statusUpdating, setStatusUpdating] = useState(false);

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

            const detail = response?.data?.seller ?? response?.data?.data?.seller;

            if (detail && typeof detail === "object") {
                // Keep list data as a fallback when the detail endpoint omits fields.
                const mergedRaw = { ...seller, ...detail };
                setSelected(normalize({ sellers: [mergedRaw] })[0]);
            } else {
                toast.error("Seller details endpoint returned no seller record.");
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
        loadSellers(false);

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

            const normalizedStatus =
                String(seller.status || (seller.isActive ? "Active" : "Inactive")).toLowerCase();

            const matchesStatus =
                status === "all" ||
                (status === "active" && normalizedStatus === "active") ||
                (status === "inactive" && normalizedStatus === "inactive") ||
                (status === "pending" && normalizedStatus === "pending") ||
                (status === "suspended" && normalizedStatus === "suspended");

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
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
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
                                                <td className="px-5 py-4"><Status active={seller.isActive} label={seller.status} /></td>
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
                                            <Status active={seller.isActive} label={seller.status} />
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
                    statusUpdating={statusUpdating}
                    onStatusUpdate={async (sellerId, nextStatus) => {
                        try {
                            setStatusUpdating(true);

                            const response = await API.put(
                                `/api/admin/orders/sellers/${sellerId}/status`,
                                { status: nextStatus }
                            );

                            const updatedSeller = response?.data?.seller;

                            toast.success(
                                response?.data?.message ||
                                "Seller status updated successfully"
                            );

                            await loadSellers(true);

                            setSelected(prev => prev ? {
                                ...prev,
                                status: updatedSeller?.status ?? nextStatus,
                                isActive: updatedSeller?.isActive ?? (nextStatus === "Active")
                            } : prev);
                        } catch (err) {
                            console.error("Seller status update error:", err);
                            toast.error(
                                err?.response?.data?.message ||
                                "Unable to update seller status."
                            );
                        } finally {
                            setStatusUpdating(false);
                        }
                    }}
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

function Status({ active, label }) {
    const status = label || (active ? "Active" : "Inactive");

    const styles = {
        Active: "bg-emerald-50 text-emerald-700",
        Inactive: "bg-slate-100 text-slate-500",
        Pending: "bg-amber-50 text-amber-700",
        Suspended: "bg-rose-50 text-rose-700"
    };

    const dots = {
        Active: "bg-emerald-500",
        Inactive: "bg-slate-400",
        Pending: "bg-amber-500",
        Suspended: "bg-rose-500"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap ${styles[status] || styles.Inactive}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.Inactive}`} />
            {status}
        </span>
    );
}

function SellerDetails({
    seller,
    onClose,
    loading = false,
    statusUpdating = false,
    onStatusUpdate
}) {
    const currentStatus =
        seller?.status ||
        (seller?.isActive ? "Active" : "Inactive");

    const [nextStatus, setNextStatus] = useState(currentStatus);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editError, setEditError] = useState("");

    useEffect(() => {
        setNextStatus(
            seller?.status ||
            (seller?.isActive ? "Active" : "Inactive")
        );
    }, [seller]);

    useEffect(() => {
        setEditForm({
            businessName: seller?.businessName || "",
            ownerName: seller?.ownerName || "",
            email: seller?.email || "",
            phone: seller?.phone || "",
            productType: seller?.productType || "",
            brand: seller?.brand || "",
            gstNumber: seller?.gstNumber || "",
            pan: seller?.pan || "",
            addressLine1: seller?.addressLine1 || "",
            city: seller?.city || "",
            state: seller?.state || "",
            pincode: seller?.pincode || "",
            accountHolderName: seller?.accountHolderName || "",
            accountNumber: seller?.accountNumber || "",
            ifscCode: seller?.ifscCode || "",
            bankName: seller?.bankName || "",
            warehouseFullAddress: seller?.warehouseFullAddress || "",
            warehouseContactPersonName: seller?.warehouseContactPersonName || "",
            warehouseContactMobileNumber: seller?.warehouseContactMobileNumber || ""
        });
        setEditing(false);
        setEditError("");
    }, [seller]);

    const documentUrl = seller?.documentPath || null;

    const saveSellerDetails = async () => {
        if (!seller?.sellerId) return;
        const requiredFields = [
            "businessName", "ownerName", "email", "phone", "productType",
            "gstNumber", "pan", "addressLine1", "city", "state", "pincode",
            "accountHolderName", "accountNumber", "ifscCode", "bankName",
            "warehouseFullAddress", "warehouseContactPersonName", "warehouseContactMobileNumber"
        ];
        const missing = requiredFields.find(key => !String(editForm[key] || "").trim());
        if (missing) {
            setEditError("Please complete all required fields before saving.");
            return;
        }
        if (!/^[6-9]\d{9}$/.test(String(editForm.warehouseContactMobileNumber || "").trim())) {
            setEditError("Enter a valid 10-digit Indian warehouse contact mobile number.");
            return;
        }

        try {
            setSaving(true);
            setEditError("");
            const response = await API.put(
                `/api/admin/orders/sellers/${seller.sellerId}`,
                editForm
            );
            const updated = response?.data?.seller || response?.data;
            setEditForm(prev => ({ ...prev, ...(updated || {}) }));
            toast.success(response?.data?.message || "Seller details updated.");
            setEditing(false);
            // Reload authoritative list/detail data after the update.
            window.location.reload();
        } catch (err) {
            console.error("Seller details update error:", err);
            setEditError(
                err?.response?.data?.message ||
                "Unable to save seller details. Confirm the admin update endpoint is implemented."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!seller?.sellerId) return;

        if (nextStatus === currentStatus) {
            toast("No status changes to update.");
            return;
        }

        await onStatusUpdate?.(seller.sellerId, nextStatus);
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
            onMouseDown={onClose}
        >
            <div
                className="w-full sm:max-w-5xl max-h-[94vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl text-sm sm:text-base"
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={seller.businessName} />
                        <div className="min-w-0">
                            <h2 className="font-black text-lg truncate">
                                {seller.businessName}
                            </h2>
                            <p className="text-xs text-slate-500">
                                Seller #{seller.sellerId} · {seller.ownerName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => { setEditing(value => !value); setEditError(""); }}
                            className="h-10 px-3 sm:px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold"
                        >
                            {editing ? "Cancel Edit" : "Edit Details"}
                        </button>
                        {loading && (
                            <RefreshCw
                                size={16}
                                className="text-violet-600 animate-spin"
                            />
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            aria-label="Close seller details"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    {editing ? (
                        <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
                            <h3 className="text-base sm:text-lg font-black mb-4">Edit Seller Registration Details</h3>
                            {editError && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{editError}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {[
                                    ["businessName", "Business Name"],
                                    ["ownerName", "Owner Name"],
                                    ["email", "Email Address"],
                                    ["phone", "Phone Number"],
                                    ["productType", "Product Type"],
                                    ["brand", "Brand"],
                                    ["gstNumber", "GST Number"],
                                    ["pan", "PAN Number"],
                                    ["addressLine1", "Address"],
                                    ["city", "City"],
                                    ["state", "State"],
                                    ["pincode", "Pincode"],
                                    ["accountHolderName", "Account Holder Name"],
                                    ["accountNumber", "Account Number"],
                                    ["ifscCode", "IFSC Code"],
                                    ["bankName", "Bank Name"],
                                    ["warehouseFullAddress", "Warehouse Full Address"],
                                    ["warehouseContactPersonName", "Warehouse Contact Person"],
                                    ["warehouseContactMobileNumber", "Warehouse Contact Mobile"]
                                ].map(([key, label]) => (
                                    <label key={key} className="block min-w-0 text-xs sm:text-sm font-bold text-slate-600">
                                        {label}
                                        {key === "warehouseFullAddress" ? (
                                            <textarea
                                                value={editForm[key] || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                                                rows={3}
                                                required
                                                className="mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                            />
                                        ) : (
                                            <input
                                                type={key === "email" ? "email" : "text"}
                                                value={editForm[key] || ""}
                                                onChange={e => setEditForm(prev => ({
                                                    ...prev,
                                                    [key]: key === "warehouseContactMobileNumber" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value
                                                }))}
                                                className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                                maxLength={key === "pincode" ? 6 : key === "warehouseContactMobileNumber" ? 10 : undefined}
                                                inputMode={key === "warehouseContactMobileNumber" ? "numeric" : undefined}
                                                pattern={key === "warehouseContactMobileNumber" ? "[6-9][0-9]{9}" : undefined}
                                                required={["warehouseContactPersonName", "warehouseContactMobileNumber"].includes(key)}
                                            />
                                        )}
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button type="button" disabled={saving} onClick={saveSellerDetails} className="h-11 rounded-xl bg-violet-600 px-5 text-sm font-black text-white disabled:opacity-60">
                                    {saving ? "Saving..." : "Save Seller Details"}
                                </button>
                                <button type="button" disabled={saving} onClick={() => { setEditing(false); setEditError(""); }} className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold">
                                    Cancel
                                </button>
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                            <h3 className="mb-3 text-base sm:text-lg font-black">Seller Registration Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Info icon={<Building2 size={16} />} label="Seller ID" value={seller.sellerId} />
                                <Info icon={<Users size={16} />} label="User ID" value={seller.userId} />
                                <Info icon={<Building2 size={16} />} label="Business Name" value={seller.businessName} />
                                <Info icon={<Users size={16} />} label="Owner Name" value={seller.ownerName} />
                                <Info icon={<Mail size={16} />} label="Email" value={seller.email} />
                                <Info icon={<Phone size={16} />} label="Phone" value={seller.phone} />
                                <Info icon={<Package size={16} />} label="Product Type" value={seller.productType} />
                                <Info icon={<Store size={16} />} label="Brand" value={seller.brand} />
                                <Info icon={<CheckCircle2 size={16} />} label="GST Number" value={seller.gstNumber} />
                                <Info icon={<CheckCircle2 size={16} />} label="GST Verification" value={seller.isGSTVerified ? "Verified" : "Not verified"} />
                                <Info icon={<CheckCircle2 size={16} />} label="PAN Number" value={seller.pan} />
                                <Info icon={<CheckCircle2 size={16} />} label="PAN Verification" value={seller.isPANVerified ? "Verified" : "Not verified"} />
                                <Info icon={<Building2 size={16} />} label="Business Address" value={[seller.addressLine1, seller.city, seller.state, seller.pincode].filter(Boolean).join(", ")} />
                                <Info icon={<Warehouse size={16} />} label="Warehouse Full Address" value={seller.warehouseFullAddress} />
                                <Info icon={<Users size={16} />} label="Warehouse Contact Person" value={seller.warehouseContactPersonName} />
                                <Info icon={<Phone size={16} />} label="Warehouse Contact Mobile" value={seller.warehouseContactMobileNumber} />
                                <Info icon={<IndianRupee size={16} />} label="Account Holder" value={seller.accountHolderName} />
                                <Info icon={<IndianRupee size={16} />} label="Bank Account Number" value={seller.accountNumber} />
                                <Info icon={<IndianRupee size={16} />} label="IFSC Code" value={seller.ifscCode} />
                                <Info icon={<Building2 size={16} />} label="Bank Name" value={seller.bankName} />
                            </div>
                        </section>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Metric label="Products" value={seller.productCount} />
                        <Metric label="Orders" value={seller.orderCount} />
                        <Metric label="Order Items" value={seller.orderItems} />
                        <Metric label="Customers" value={seller.customers} />
                        <Metric label="Completed" value={seller.completedOrders} />
                        <Metric label="Pending" value={seller.pendingOrders} />
                        <Metric label="Delivered" value={seller.deliveredOrders} />
                        <Metric
                            label="Revenue"
                            value={money(seller.revenue)}
                            moneyValue
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Info
                            icon={<Building2 size={16} />}
                            label="Product Type"
                            value={seller.productType}
                        />
                        <Info
                            icon={<Mail size={16} />}
                            label="Email"
                            value={seller.email}
                        />
                        <Info
                            icon={<Phone size={16} />}
                            label="Phone"
                            value={seller.phone}
                        />
                        <Info
                            icon={<Activity size={16} />}
                            label="Subscription Plan"
                            value={seller.subscriptionPlan || "Not assigned"}
                        />
                        <Info
                            icon={<Activity size={16} />}
                            label="Subscription Status"
                            value={subscriptionState(seller.subscriptionEndDate)}
                        />
                        <Info
                            icon={<Clock3 size={16} />}
                            label="Free Subscription Start"
                            value={formatDate(seller.freeSubscriptionStartDate)}
                        />
                        <Info
                            icon={<Clock3 size={16} />}
                            label="Free Subscription End"
                            value={formatDate(seller.freeSubscriptionEndDate)}
                        />
                        <Info
                            icon={<CheckCircle2 size={16} />}
                            label="Launch Free Subscription"
                            value={seller.isLaunchFreeSubscription ? "Yes" : "No"}
                        />
                        <Info
                            icon={<Clock3 size={16} />}
                            label="Subscription End"
                            value={formatDate(seller.subscriptionEndDate)}
                        />
                        <Info
                            icon={<Store size={16} />}
                            label="Created"
                            value={formatDate(seller.createdAt)}
                        />
                    </div>

                    {/* ACCOUNT STATUS */}
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                                    Account Status
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Change the seller account status and save it to the database.
                                </p>
                            </div>

                            <Status
                                active={nextStatus === "Active"}
                                label={nextStatus}
                            />
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <select
                                value={nextStatus}
                                onChange={e => setNextStatus(e.target.value)}
                                disabled={statusUpdating}
                                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                                <option value="Suspended">Suspended</option>
                            </select>

                            <button
                                type="button"
                                onClick={handleStatusUpdate}
                                disabled={
                                    statusUpdating ||
                                    nextStatus === currentStatus
                                }
                                className="h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {statusUpdating && (
                                    <RefreshCw
                                        size={15}
                                        className="animate-spin"
                                    />
                                )}
                                {statusUpdating
                                    ? "Updating..."
                                    : "Update Status"}
                            </button>
                        </div>
                    </div>

                    {/* SELLER KYC DOCUMENTS */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <h3 className="text-base sm:text-lg font-black">Uploaded Verification Documents</h3>
                        <p className="mt-1 text-sm text-slate-500">Review the files submitted during seller registration before approving the account.</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DocumentCard
                                title="GST Registration Certificate"
                                rawPath={seller.gstCertificateDocumentPath || documentUrl}
                            />
                            <DocumentCard
                                title="Make in India / Product Licence"
                                rawPath={seller.productLicenceDocumentPath}
                                optional
                            />
                        </div>
                    </section>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Operational summary
                        </p>

                        <div className="mt-3 space-y-3">
                            <Progress
                                label="Completed Items"
                                value={seller.completedOrders}
                                total={seller.orderItems}
                            />
                            <Progress
                                label="Delivered Items"
                                value={seller.deliveredOrders}
                                total={seller.orderItems}
                            />
                            <Progress
                                label="Pending Items"
                                value={seller.pendingOrders}
                                total={seller.orderItems}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
function getDocumentUrl(rawPath) {
    if (typeof rawPath !== "string" || !rawPath.trim()) return "";
    const value = rawPath.trim();

    if (/^(https?:|blob:|data:)/i.test(value)) return value;

    try {
        const configuredBase = API?.defaults?.baseURL || window.location.origin;
        const apiOrigin = new URL(configuredBase, window.location.origin).origin;
        const cleanPath = value.replace(/\\/g, "/").replace(/^\/+/, "");
        return new URL(cleanPath, `${apiOrigin}/`).toString();
    } catch (error) {
        console.error("Unable to resolve seller document URL:", error);
        return "";
    }
}

function DocumentCard({ title, rawPath, optional = false }) {
    const [downloadError, setDownloadError] = useState("");
    const url = useMemo(() => getDocumentUrl(rawPath), [rawPath]);

    const fileName = useMemo(() => {
        if (!rawPath) return "";
        try {
            const parsed = new URL(url);
            return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || title);
        } catch {
            return String(rawPath).split(/[\\/]/).filter(Boolean).pop() || title;
        }
    }, [rawPath, url, title]);

    const handleDownload = async () => {
        if (!url) return;
        setDownloadError("");

        try {
            const apiBase = new URL(API?.defaults?.baseURL || window.location.origin, window.location.origin);
            const fileUrl = new URL(url);

            if (fileUrl.origin === apiBase.origin) {
                const response = await API.get(url, { responseType: "blob" });
                const blobUrl = window.URL.createObjectURL(response.data);
                const anchor = document.createElement("a");
                anchor.href = blobUrl;
                anchor.download = fileName || "seller-document";
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                window.URL.revokeObjectURL(blobUrl);
                return;
            }
        } catch (error) {
            console.error("Authenticated document download failed:", error);
            setDownloadError("Download failed. Try opening the document or check the file URL.");
            return;
        }

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName || "seller-document";
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <FileText size={19} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-black text-slate-800 break-words">{title}</p>
                    <p className="mt-1 text-xs text-slate-500 break-words">
                        {rawPath ? fileName : optional ? "Not provided (optional)." : "No document path returned by the API."}
                    </p>
                </div>
            </div>

            {url ? (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                        <ExternalLink size={15} /> View document
                    </a>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700"
                    >
                        <Download size={15} /> Download
                    </button>
                </div>
            ) : (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    {optional
                        ? "No optional document was uploaded."
                        : "The API did not return a GST certificate path. Include GSTCertificateDocumentPath in the seller details response."}
                </p>
            )}

            {downloadError && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{downloadError}</p>}
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
