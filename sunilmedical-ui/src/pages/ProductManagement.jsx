
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Eye,
    Layers3,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Store,
    Trash2,
    X,
} from "lucide-react";
import API from "../services/api";

const PAGE_SIZE = 20;

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const normalize = (value) => String(value ?? "").toLowerCase().trim();

const statusClasses = (status) => {
    switch (normalize(status)) {
        case "active":
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
        case "inactive":
            return "bg-slate-100 text-slate-600 ring-slate-500/20";
        case "pending":
            return "bg-amber-50 text-amber-700 ring-amber-600/20";
        default:
            return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    }
};

function StatCard({ icon: Icon, label, value, detail, tone = "indigo" }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-sky-50 text-sky-600",
    };

    return (
        <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {value}
                    </p>
                    {detail && (
                        <p className="mt-1 text-xs text-slate-500">{detail}</p>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${tones[tone] || tones.indigo}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

export default function ProductManagement() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [page, setPage] = useState(1);

    const [products, setProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sellerName, setSellerName] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(true);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState(null);

    const loadProducts = useCallback(async ({
        requestedPage = page,
        requestedSearch = search,
        requestedStatus = status,
        quiet = false,
    } = {}) => {
        if (quiet) setRefreshing(true);
        else setLoading(true);

        setError("");

        try {
            const response = await API.get("/api/product-management", {
                params: {
                    search: requestedSearch.trim(),
                    status: requestedStatus,
                    page: requestedPage,
                    pageSize: PAGE_SIZE,
                },
            });

            const data = response.data || {};
            setProducts(Array.isArray(data.products) ? data.products : []);
            setTotalCount(Number(data.totalCount || 0));
            setTotalPages(Number(data.totalPages || 0));
            setSellerName(data.sellerName || "");
            setIsSubscribed(data.isSubscribed !== false);
        } catch (err) {
            console.error("Product management load failed:", err.response?.data || err);
            setError(
                err.response?.data?.message ||
                "Unable to load products. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, search, status]);

    // Debounce search and status changes; reset to page 1.
    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts({
                requestedPage: page,
                requestedSearch: search,
                requestedStatus: status,
            });
        }, search.trim() ? 300 : 0);

        return () => clearTimeout(timer);
    }, [search, status, page, loadProducts]);

    const stats = useMemo(() => {
        const active = products.filter(
            p => normalize(p.status) === "active"
        ).length;
        const inactive = products.filter(
            p => normalize(p.status) === "inactive"
        ).length;
        const variants = products.reduce(
            (sum, p) => sum + (p.variants?.length || 0), 0
        );
        const stock = products.reduce(
            (sum, p) => sum + (p.variants || []).reduce(
                (variantSum, v) => variantSum + (Number(v.stockQuantity) || 0), 0
            ), 0
        );

        return { active, inactive, variants, stock };
    }, [products]);

    const changePage = (nextPage) => {
        const maxPage = Math.max(1, totalPages);
        setPage(Math.min(maxPage, Math.max(1, nextPage)));
    };

    const deleteProduct = async (product) => {
        const confirmed = window.confirm(
            `Delete "${product.name}"? This action may permanently remove the product.`
        );
        if (!confirmed) return;

        setActionId(product.id);
        setError("");

        try {
            await API.delete(`/api/products/delete/${product.id}`);

            // Refresh the current page and totals from the API.
            await loadProducts({
                requestedPage: page,
                requestedSearch: search,
                requestedStatus: status,
                quiet: true,
            });

            window.alert("Product deleted successfully.");
        } catch (err) {
            console.error("Delete product failed:", err.response?.data || err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to delete this product."
            );
        } finally {
            setActionId(null);
        }
    };

    const toggleStatus = async (product) => {
        setActionId(product.id);
        setError("");

        try {
            const response = await API.put(
                `/api/products/change-status/${product.id}`
            );

            const returnedStatus = response.data?.status;

            if (returnedStatus) {
                setProducts(previous => previous.map(item =>
                    item.id === product.id
                        ? { ...item, status: returnedStatus }
                        : item
                ));
            } else {
                await loadProducts({
                    requestedPage: page,
                    requestedSearch: search,
                    requestedStatus: status,
                    quiet: true,
                });
            }
        } catch (err) {
            console.error("Change product status failed:", err.response?.data || err);
            setError(
                err.response?.data?.message ||
                "Unable to update product status."
            );
        } finally {
            setActionId(null);
        }
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("All");
        setPage(1);
    };

    const firstRow = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const lastRow = Math.min(page * PAGE_SIZE, totalCount);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-sky-50 p-3 text-slate-800 sm:p-5 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                            <ShieldCheck size={14} />
                            Product Operations
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            Product Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage products, variants, seller listings and inventory.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadProducts({ quiet: true })}
                            disabled={refreshing || loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/add-product")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
                        >
                            <Plus size={17} />
                            Add Product
                        </button>
                    </div>
                </header>

                {!isSubscribed && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <p>Your subscription may be inactive. Some product-management actions may be restricted.</p>
                    </div>
                )}

                {/* Statistics for the currently loaded page */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={Package}
                        label="Matching Products"
                        value={totalCount}
                        detail="Across all result pages"
                        tone="indigo"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Active on This Page"
                        value={stats.active}
                        detail="Loaded page only"
                        tone="emerald"
                    />
                    <StatCard
                        icon={Activity}
                        label="Inactive on This Page"
                        value={stats.inactive}
                        detail="Loaded page only"
                        tone="amber"
                    />
                    <StatCard
                        icon={Layers3}
                        label="Variants on This Page"
                        value={stats.variants}
                        detail={`${stats.stock.toLocaleString("en-IN")} total units in loaded results`}
                        tone="blue"
                    />
                </section>

                {/* Search and status filters */}
                <section className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-lg shadow-slate-200/40 backdrop-blur-2xl sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
                            <Search size={19} className="shrink-0 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search product, brand, category, variant, seller name or seller ID..."
                                aria-label="Search products and sellers"
                                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Clear search"
                                >
                                    <X size={17} />
                                </button>
                            )}
                        </div>

                        <select
                            value={status}
                            onChange={e => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            aria-label="Filter by product status"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        >
                            <option value="All">All statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                            {search.trim()
                                ? `Searching for “${search.trim()}”`
                                : "Search updates as you type"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span>{totalCount.toLocaleString("en-IN")} results</span>
                            {(search || status !== "All") && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <div className="flex-1">{error}</div>
                        <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* Products table */}
                <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                        <div>
                            <h2 className="font-bold text-slate-900">Product inventory</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {sellerName ? `Viewing as ${sellerName}` : "Current authorized product listings"}
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            Page {Math.max(page, 1)} of {Math.max(totalPages, 1)}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                            <RefreshCw size={19} className="animate-spin text-indigo-600" />
                            Loading products...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                                <Package size={28} />
                            </div>
                            <h3 className="mt-4 font-semibold text-slate-800">No products found</h3>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Try another seller name, seller ID, product keyword or status.
                            </p>
                            {(search || status !== "All") && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left text-sm">
                                    <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-4 font-semibold sm:px-6">Product</th>
                                            <th className="px-4 py-4 font-semibold">Seller</th>
                                            <th className="px-4 py-4 font-semibold">Price range</th>
                                            <th className="px-4 py-4 font-semibold">Variants / Stock</th>
                                            <th className="px-4 py-4 font-semibold">GST</th>
                                            <th className="px-4 py-4 font-semibold">Status</th>
                                            <th className="px-4 py-4 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map(item => {
                                            const variants = item.variants || [];
                                            const pricedVariants = variants
                                                .map(v => Number(v.price))
                                                .filter(Number.isFinite);
                                            const minPrice = pricedVariants.length ? Math.min(...pricedVariants) : 0;
                                            const maxPrice = pricedVariants.length ? Math.max(...pricedVariants) : 0;
                                            const totalStock = variants.reduce(
                                                (sum, v) => sum + (Number(v.stockQuantity) || 0), 0
                                            );
                                            const active = normalize(item.status) === "active";
                                            const busy = actionId === item.id;

                                            return (
                                                <tr key={item.id} className="transition hover:bg-indigo-50/40">
                                                    <td className="px-4 py-4 sm:px-6">
                                                        <div className="flex min-w-64 items-center gap-3">
                                                            <img
                                                                src={item.imageUrl || "/images/no-image.png"}
                                                                alt=""
                                                                loading="lazy"
                                                                className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
                                                                onError={e => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = "/images/no-image.png";
                                                                }}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="line-clamp-2 font-semibold text-slate-900">
                                                                    {item.name || "Unnamed product"}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {item.brand || "No brand"} · {item.category || "Uncategorized"}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-slate-400">
                                                                    ID: {item.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-start gap-2">
                                                            <Store size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                                            <div>
                                                                <p className="max-w-48 font-medium text-slate-800">
                                                                    {item.sellerName || "Seller name unavailable"}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Seller ID: {item.sellerId ?? "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {normalize(item.priceType) !== "normal" ? (
                                                            <span className="font-semibold text-amber-700">Ask Price</span>
                                                        ) : pricedVariants.length ? (
                                                            <div>
                                                                <p className="font-semibold text-slate-900">
                                                                    {currency(minPrice)}
                                                                </p>
                                                                {maxPrice > minPrice && (
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        to {currency(maxPrice)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <p className="font-semibold text-slate-800">
                                                            {variants.length} variants
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {totalStock.toLocaleString("en-IN")} units
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-slate-600">
                                                        {item.gstPercentage ?? 0}%
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(item.status)}`}>
                                                            {item.status || "Unknown"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/products/edit/${item.id}`)}
                                                                title="Edit product"
                                                                aria-label={`Edit ${item.name}`}
                                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                            >
                                                                <Edit3 size={14} />
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => toggleStatus(item)}
                                                                disabled={busy}
                                                                title={active ? "Deactivate product" : "Activate product"}
                                                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 ${active
                                                                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                    }`}
                                                            >
                                                                {active ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                                                {active ? "Deactivate" : "Activate"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => deleteProduct(item)}
                                                                disabled={busy}
                                                                title="Delete product"
                                                                aria-label={`Delete ${item.name}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <p className="text-xs text-slate-500">
                                    Showing <strong className="text-slate-700">{firstRow}</strong>–<strong className="text-slate-700">{lastRow}</strong> of <strong className="text-slate-700">{totalCount}</strong> products
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => changePage(page - 1)}
                                        disabled={page <= 1 || loading}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft size={15} />
                                        Previous
                                    </button>

                                    <span className="min-w-20 text-center text-xs font-semibold text-slate-600">
                                        Page {page} / {Math.max(totalPages, 1)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => changePage(page + 1)}
                                        disabled={page >= totalPages || loading}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </footer>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
