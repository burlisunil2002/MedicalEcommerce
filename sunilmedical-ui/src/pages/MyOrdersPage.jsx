import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import OrderHero from "../components/orders/OrderHero";
import OrderFilters from "../components/orders/OrderFilters";
import OrderCard from "../components/orders/OrderCard";
import EmptyOrders from "../components/orders/EmptyOrders";
import LoadingOrders from "../components/orders/LoadingOrders";
import CancelDialog from "../components/orders/CancelDialog";
import ReturnDialog from "../components/orders/ReturnDialog";

const ORDERS_CACHE_KEY = "my-orders-cache-v2";
const PAGE_SIZE = 3;

const normalizeOrders = (data) => {
    if (!Array.isArray(data)) return [];

    return data
        .filter(Boolean)
        .map((order) => ({
            ...order,
            items: Array.isArray(order?.items)
                ? order.items
                : []
        }));
};

const mergeOrders = (current, incoming) => {
    const map = new Map();

    [...current, ...incoming].forEach((order) => {
        if (order?.orderId != null) {
            map.set(order.orderId, order);
        }
    });

    return Array.from(map.values()).sort(
        (a, b) =>
            new Date(b?.orderDate || 0).getTime() -
            new Date(a?.orderDate || 0).getTime()
    );
};

export default function MyOrdersPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState(() => {
        try {
            const cached =
                sessionStorage.getItem(ORDERS_CACHE_KEY);

            if (!cached) return [];

            return normalizeOrders(
                JSON.parse(cached)
            );
        } catch {
            return [];
        }
    });

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedFilter, setSelectedFilter] =
        useState("All");

    const [selectedItem, setSelectedItem] =
        useState(null);

    const [cancelOpen, setCancelOpen] =
        useState(false);

    const [cancelLoading, setCancelLoading] =
        useState(false);

    const [returnOpen, setReturnOpen] =
        useState(false);

    const [returnLoading, setReturnLoading] =
        useState(false);

    const [hasNextPage, setHasNextPage] =
        useState(true);

    const [totalOrders, setTotalOrders] =
        useState(null);

    const currentPageRef = useRef(0);
    const requestRef = useRef(null);
    const loadMoreRef = useRef(null);

    const saveCache = useCallback((value) => {
        try {
            sessionStorage.setItem(
                ORDERS_CACHE_KEY,
                JSON.stringify(value)
            );
        } catch {
            // Cache is optional.
        }
    }, []);

    const loadFirstPage = useCallback(
        async (showLoader = true) => {
            if (requestRef.current) {
                requestRef.current.abort();
            }

            const controller =
                new AbortController();

            requestRef.current = controller;

            try {
                if (showLoader && orders.length === 0) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                const response = await axios.get(
                    `/api/order/my-orders?page=1&pageSize=${PAGE_SIZE}`,
                    {
                        signal: controller.signal,
                        headers: {
                            "Cache-Control": "no-cache"
                        }
                    }
                );

                const serverOrders =
                    normalizeOrders(
                        response?.data?.orders ??
                        response?.data?.data ??
                        response?.data
                    );

                const pagination =
                    response?.data?.pagination;

                setOrders(serverOrders);
                saveCache(serverOrders);

                currentPageRef.current = 1;

                setHasNextPage(
                    pagination?.hasNextPage ??
                    serverOrders.length === PAGE_SIZE
                );

                setTotalOrders(
                    Number.isFinite(
                        Number(pagination?.totalOrders)
                    )
                        ? Number(pagination.totalOrders)
                        : null
                );
            } catch (error) {
                if (
                    error?.name === "CanceledError" ||
                    error?.code === "ERR_CANCELED"
                ) {
                    return;
                }

                console.error(
                    "Load first orders error:",
                    error
                );

                if (orders.length === 0) {
                    toast.error(
                        error?.response?.data?.message ||
                        "Unable to load your orders."
                    );
                }
            } finally {
                if (
                    requestRef.current === controller
                ) {
                    requestRef.current = null;
                }

                setLoading(false);
                setRefreshing(false);
            }
        },
        [orders.length, saveCache]
    );

    const loadNextPage = useCallback(
        async () => {
            if (
                loadingMore ||
                !hasNextPage
            ) {
                return;
            }

            const nextPage =
                currentPageRef.current + 1;

            setLoadingMore(true);

            try {
                const response = await axios.get(
                    `/api/order/my-orders?page=${nextPage}&pageSize=${PAGE_SIZE}`,
                    {
                        headers: {
                            "Cache-Control": "no-cache"
                        }
                    }
                );

                const incoming =
                    normalizeOrders(
                        response?.data?.orders ??
                        response?.data?.data ??
                        response?.data
                    );

                const pagination =
                    response?.data?.pagination;

                setOrders((current) => {
                    const merged =
                        mergeOrders(
                            current,
                            incoming
                        );

                    saveCache(merged);

                    return merged;
                });

                currentPageRef.current =
                    nextPage;

                setHasNextPage(
                    pagination?.hasNextPage ??
                    incoming.length === PAGE_SIZE
                );

                if (
                    pagination?.totalOrders != null
                ) {
                    setTotalOrders(
                        Number(
                            pagination.totalOrders
                        )
                    );
                }
            } catch (error) {
                console.error(
                    "Load more orders error:",
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    "Unable to load more orders."
                );
            } finally {
                setLoadingMore(false);
            }
        },
        [
            hasNextPage,
            loadingMore,
            saveCache
        ]
    );

    /*
     * First request loads only 3 orders.
     * More orders are fetched when the user approaches
     * the bottom of the current list.
     */
    useEffect(() => {
        loadFirstPage(true);

        return () => {
            requestRef.current?.abort();
        };
    }, []); // Intentionally run once on mount.

    /*
     * Infinite-scroll trigger.
     * It starts the next 3-order request before the user
     * reaches the absolute bottom.
     */
    useEffect(() => {
        const target = loadMoreRef.current;

        if (!target || !hasNextPage) {
            return undefined;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    if (
                        entries[0]?.isIntersecting
                    ) {
                        loadNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "500px 0px",
                    threshold: 0
                }
            );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, loadNextPage]);

    const getOverallStatus = useCallback(
        (order) => {
            const items =
                Array.isArray(order?.items)
                    ? order.items
                    : [];

            if (!items.length) {
                return "Processing";
            }

            const statuses =
                items.map((item) =>
                    String(
                        item?.itemStatus || ""
                    )
                        .trim()
                        .toLowerCase()
                );

            if (
                statuses.every(
                    (x) => x === "cancelled"
                )
            ) {
                return "Cancelled";
            }

            if (
                statuses.every(
                    (x) => x === "delivered"
                )
            ) {
                return "Delivered";
            }

            if (
                statuses.includes(
                    "outfordelivery"
                )
            ) {
                return "Out For Delivery";
            }

            if (
                statuses.includes("shipped")
            ) {
                return "Shipped";
            }

            if (
                statuses.includes("packed")
            ) {
                return "Packed";
            }

            if (
                statuses.includes("pending")
            ) {
                return "Pending";
            }

            return "Processing";
        },
        []
    );

    const filteredOrders = useMemo(() => {
        const searchText =
            search.trim().toLowerCase();

        return orders.filter((order) => {
            const status =
                getOverallStatus(order);

            const matchesSearch =
                !searchText ||
                String(
                    order?.orderNumber || ""
                )
                    .toLowerCase()
                    .includes(searchText) ||
                String(
                    order?.paymentStatus || ""
                )
                    .toLowerCase()
                    .includes(searchText) ||
                status
                    .toLowerCase()
                    .includes(searchText) ||
                order?.items?.some(
                    (item) =>
                        String(
                            item?.productName ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                searchText
                            ) ||
                        String(
                            item?.variantName ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                );

            if (!matchesSearch) {
                return false;
            }

            switch (selectedFilter) {
                case "Active":
                    return (
                        status !== "Delivered" &&
                        status !== "Cancelled"
                    );

                case "Delivered":
                    return (
                        status === "Delivered"
                    );

                case "Cancelled":
                    return (
                        status === "Cancelled"
                    );

                case "Pending":
                    return (
                        status === "Pending"
                    );

                case "Returns":
                    return order?.items?.some(
                        (item) => {
                            const value =
                                String(
                                    item?.returnStatus ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase();

                            return (
                                value &&
                                value !== "none"
                            );
                        }
                    );

                case "All":
                default:
                    return true;
            }
        });
    }, [
        orders,
        search,
        selectedFilter,
        getOverallStatus
    ]);

    function handleTrack(item) {
        if (!item?.trackingNumber) {
            toast.info(
                "Tracking details are not available yet."
            );
            return;
        }

        navigate(
            `/track/${item.trackingNumber}`
        );
    }

    function handleInvoice(order) {
        window.open(
            `/invoice/${order.orderId}`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    function handleReview(item) {
        navigate(
            `/review/${item.orderItemId}`
        );
    }

    async function handleBuyAgain(item) {
        try {
            await axios.post(
                "/api/cart/add",
                {
                    productId:
                        item.productId,
                    variantId:
                        item.variantId,
                    quantity: 1
                }
            );

            toast.success(
                "Added to cart."
            );
        } catch {
            toast.error(
                "Unable to add product."
            );
        }
    }

    function handleHelp() {
        navigate("/contact-us");
    }

    function handleCancel(item) {
        setSelectedItem(item);
        setCancelOpen(true);
    }

    async function confirmCancel(data) {
        if (!selectedItem?.orderItemId) {
            return;
        }

        try {
            setCancelLoading(true);

            await axios.put(
                `/api/order/cancel-item/${selectedItem.orderItemId}`,
                {
                    reasonType:
                        data.reason,
                    remarks:
                        data.remarks
                }
            );

            toast.success(
                "Order cancelled successfully."
            );

            await loadFirstPage(false);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Unable to cancel order."
            );
        } finally {
            setCancelLoading(false);
            setCancelOpen(false);
            setSelectedItem(null);
        }
    }

    function handleReturn(item) {
        setSelectedItem(item);
        setReturnOpen(true);
    }

    async function submitReturn(data) {
        if (!selectedItem?.orderItemId) {
            return;
        }

        try {
            setReturnLoading(true);

            const formData =
                new FormData();

            formData.append(
                "OrderItemId",
                selectedItem.orderItemId
            );

            formData.append(
                "Reason",
                data.reason
            );

            formData.append(
                "Remarks",
                data.remarks
            );

            if (data.files?.[0]) {
                formData.append(
                    "Image1",
                    data.files[0]
                );
            }

            if (data.files?.[1]) {
                formData.append(
                    "Image2",
                    data.files[1]
                );
            }

            if (data.files?.[2]) {
                formData.append(
                    "Image3",
                    data.files[2]
                );
            }

            await axios.post(
                `/api/order/request-return/${selectedItem.orderItemId}`,
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            );

            toast.success(
                "Return request submitted."
            );

            await loadFirstPage(false);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Unable to submit return request."
            );
        } finally {
            setReturnLoading(false);
            setReturnOpen(false);
            setSelectedItem(null);
        }
    }

    const shownCount =
        orders.length;

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8">

                <OrderHero
                    search={search}
                    setSearch={setSearch}
                    totalOrders={
                        totalOrders ?? shownCount
                    }
                    onContinueShopping={() =>
                        navigate("/products")
                    }
                />

                <OrderFilters
                    selected={selectedFilter}
                    onChange={setSelectedFilter}
                />

                {loading &&
                    orders.length === 0 && (
                        <div className="mt-8">
                            <LoadingOrders />
                        </div>
                    )}

                {!loading &&
                    orders.length === 0 && (
                        <div className="mt-8">
                            <EmptyOrders
                                onContinueShopping={() =>
                                    navigate(
                                        "/products"
                                    )
                                }
                            />
                        </div>
                    )}

                {refreshing &&
                    orders.length > 0 && (
                        <div
                            className="
                                mt-4 flex items-center
                                justify-center gap-2
                                text-xs text-gray-500
                            "
                            role="status"
                            aria-live="polite"
                        >
                            <span
                                className="
                                    h-3.5 w-3.5
                                    animate-spin rounded-full
                                    border-2 border-gray-200
                                    border-t-pink-500
                                "
                            />
                            Updating your orders...
                        </div>
                    )}

                {filteredOrders.length > 0 && (
                    <div className="mt-8 space-y-8">
                        {filteredOrders.map(
                            (order) => (
                                <OrderCard
                                    key={
                                        order.orderId
                                    }
                                    order={order}
                                    overallStatus={
                                        getOverallStatus(
                                            order
                                        )
                                    }
                                    onInvoice={
                                        handleInvoice
                                    }
                                    onTrack={
                                        handleTrack
                                    }
                                    onCancel={
                                        handleCancel
                                    }
                                    onReturn={
                                        handleReturn
                                    }
                                    onReview={
                                        handleReview
                                    }
                                    onBuyAgain={
                                        handleBuyAgain
                                    }
                                    onHelp={
                                        handleHelp
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {/* Loads the next 3 orders near the bottom */}
                {hasNextPage && (
                    <div
                        ref={loadMoreRef}
                        className="
                            mt-8 flex min-h-12
                            items-center
                            justify-center
                        "
                    >
                        {loadingMore && (
                            <div
                                className="
                                    flex items-center
                                    gap-2 text-xs
                                    text-gray-500
                                "
                                role="status"
                                aria-live="polite"
                            >
                                <span
                                    className="
                                        h-4 w-4
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-gray-200
                                        border-t-pink-500
                                    "
                                />
                                Loading more orders...
                            </div>
                        )}
                    </div>
                )}

                {!hasNextPage &&
                    orders.length > 0 && (
                        <div className="
                            mt-8 pb-4 text-center
                            text-xs text-gray-400
                        ">
                            You&apos;ve reached the end
                            of your orders.
                        </div>
                    )}
            </div>

            <CancelDialog
                open={cancelOpen}
                loading={cancelLoading}
                onClose={() =>
                    setCancelOpen(false)
                }
                onConfirm={confirmCancel}
            />

            <ReturnDialog
                open={returnOpen}
                loading={returnLoading}
                onClose={() =>
                    setReturnOpen(false)
                }
                onSubmit={submitReturn}
            />
        </div>
    );
}
