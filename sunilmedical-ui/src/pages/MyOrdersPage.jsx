import { useCallback, useEffect, useMemo, useState } from "react";
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
import SmallCubeLoader from "../components/loader/SmallCubeLoader";

export default function MyOrdersPage() {

    const navigate = useNavigate();

    //--------------------------------------------------
    // State
    //--------------------------------------------------

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedFilter, setSelectedFilter] = useState("All");

    const [selectedItem, setSelectedItem] = useState(null);

    //--------------------------------------------------
    // Cancel Dialog

    //--------------------------------------------------

    const [cancelOpen, setCancelOpen] = useState(false);

    const [cancelLoading, setCancelLoading] = useState(false);

    //--------------------------------------------------
    // Return Dialog
    //--------------------------------------------------

    const [returnOpen, setReturnOpen] = useState(false);

    const [returnLoading, setReturnLoading] = useState(false);

    //--------------------------------------------------
    // Load Orders
    //--------------------------------------------------

    const loadOrders = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            const response = await axios.get("/api/order/my-orders");

            let data = [];

            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data?.data)) {
                data = response.data.data;
            } else if (Array.isArray(response.data?.orders)) {
                data = response.data.orders;
            } else {
                console.error("Unexpected API Response:", response.data);
                toast.error("Invalid response received from server.");
            }

            const normalizedOrders = data
                .filter(Boolean)
                .map(order => ({
                    ...order,
                    items: Array.isArray(order?.items) ? order.items : []
                }));

            setOrders(normalizedOrders);
        } catch (error) {
            console.error("Load Orders Error:", error);
            toast.error(
                error?.response?.data?.message ||
                "Unable to load your orders."
            );
            setOrders([]);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders(true);
    }, [loadOrders]);

    //--------------------------------------------------
    // Overall Status
    //--------------------------------------------------

    const getOverallStatus = useCallback((order) => {
        const items = Array.isArray(order?.items) ? order.items : [];

        if (items.length === 0) return "Processing";

        const statuses = items.map(item =>
            String(item?.itemStatus || "").trim().toLowerCase()
        );

        if (statuses.every(x => x === "cancelled")) return "Cancelled";
        if (statuses.every(x => x === "delivered")) return "Delivered";
        if (statuses.includes("outfordelivery")) return "Out For Delivery";
        if (statuses.includes("shipped")) return "Shipped";
        if (statuses.includes("packed")) return "Packed";
        if (statuses.includes("pending")) return "Pending";

        return "Processing";
    }, []);

    //--------------------------------------------------
    // Filter Orders
    //--------------------------------------------------

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders) || orders.length === 0) {
            return [];
        }

        const searchText = search.trim().toLowerCase();

        return orders.filter(order => {
            const status = getOverallStatus(order);

            const matchesSearch =
                !searchText ||
                String(order?.orderNumber || "").toLowerCase().includes(searchText) ||
                String(order?.paymentStatus || "").toLowerCase().includes(searchText) ||
                status.toLowerCase().includes(searchText) ||
                (Array.isArray(order?.items) &&
                    order.items.some(item =>
                        String(item?.productName || "").toLowerCase().includes(searchText) ||
                        String(item?.variantName || "").toLowerCase().includes(searchText)
                    ));

            if (!matchesSearch) return false;

            switch (selectedFilter) {
                case "Active":
                    return status !== "Delivered" && status !== "Cancelled";
                case "Delivered":
                    return status === "Delivered";
                case "Cancelled":
                    return status === "Cancelled";
                case "Pending":
                    return status === "Pending";
                case "Returns":
                    return Array.isArray(order?.items) &&
                        order.items.some(item => {
                            const returnStatus = String(item?.returnStatus || "").trim().toLowerCase();
                            return returnStatus && returnStatus !== "none";
                        });
                case "All":
                default:
                    return true;
            }
        });
    }, [orders, search, selectedFilter, getOverallStatus]);

    //--------------------------------------------------
    // Handlers
    //--------------------------------------------------

    function handleTrack(item) {

        if (!item.trackingNumber) {

            toast.info("Tracking details are not available yet.");

            return;

        }

        navigate(`/track/${item.trackingNumber}`);

    }

    //--------------------------------------------------

    function handleInvoice(order) {

        window.open(

            `/invoice/${order.orderId}`,

            "_blank"

        );

    }

    //--------------------------------------------------

    function handleReview(item) {

        navigate(`/review/${item.orderItemId}`);

    }

    //--------------------------------------------------

    async function handleBuyAgain(item) {

        try {

            await axios.post(

                "/api/cart/add",

                {

                    productId: item.productId,

                    variantId: item.variantId,

                    quantity: 1

                }

            );

            toast.success("Added to cart.");

        }

        catch {

            toast.error("Unable to add product.");

        }

    }

    //--------------------------------------------------

    function handleHelp() {

        navigate("/contact-us");

    }

    //--------------------------------------------------
    // Cancel
    //--------------------------------------------------

    function handleCancel(item) {

        setSelectedItem(item);

        setCancelOpen(true);

    }

    async function confirmCancel(data) {

        try {

            setCancelLoading(true);

            await axios.put(

                `/api/order/cancel-item/${selectedItem.orderItemId}`,

                {
                    reasonType: data.reason,
                    remarks: data.remarks
                }

            );

            toast.success("Order cancelled successfully.");

            await loadOrders(false);

        }

        catch {

            toast.error("Unable to cancel order.");

        }

        finally {

            setCancelLoading(false);

            setCancelOpen(false);

        }

    }

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    function handleReturn(item) {

        setSelectedItem(item);

        setReturnOpen(true);

    }

    async function submitReturn(data) {

        try {

            setReturnLoading(true);

            const formData = new FormData();

            formData.append("OrderItemId", selectedItem.orderItemId);
            formData.append("Reason", data.reason);
            formData.append("Remarks", data.remarks);

            if (data.files[0])
                formData.append("Image1", data.files[0]);

            if (data.files[1])
                formData.append("Image2", data.files[1]);

            if (data.files[2])
                formData.append("Image3", data.files[2]);

            await axios.post(

                `/api/order/request-return/${selectedItem.orderItemId}`,

                formData,

                {

                    headers: {

                        "Content-Type": "multipart/form-data"

                    }

                }

            );

            toast.success("Return request submitted.");

            await loadOrders(false);

        }

        catch {

            toast.error("Unable to submit return request.");

        }

        finally {

            setReturnLoading(false);

            setReturnOpen(false);

        }

    }

    if (loading) {
        return (
            <SmallCubeLoader
                title="Loading MyOrders"
                subtitle="Loading your all orders..."
            />
        );
    }

    //--------------------------------------------------
    // UI
    //--------------------------------------------------

    return (

        <div className="min-h-screen bg-slate-100">

            <div className="mx-auto max-w-7xl px-4 py-8">

                {/* Hero */}

                <OrderHero

                    search={search}

                    setSearch={setSearch}

                    totalOrders={orders.length}

                    onContinueShopping={() => navigate("/products")}

                />

                {/* Filters */}

                <OrderFilters

                    selected={selectedFilter}

                    onChange={setSelectedFilter}

                />

                {/* Loading */}

                {

                    loading && (

                        <div className="mt-8">

                            <LoadingOrders />

                        </div>

                    )

                }

                {/* Empty */}

                {

                    !loading && filteredOrders.length === 0 && (

                        <div className="mt-8">

                            <EmptyOrders

                                onContinueShopping={() =>

                                    navigate("/products")

                                }

                            />

                        </div>

                    )

                }

                {/* Orders */}

                {

                    !loading && filteredOrders.length > 0 && (

                        <div className="mt-8 space-y-8">

                            {

                                filteredOrders.map(order => (

                                    <OrderCard

                                        key={order.orderId}

                                        order={order}

                                        overallStatus={getOverallStatus(order)}

                                        onInvoice={handleInvoice}

                                        onTrack={handleTrack}

                                        onCancel={handleCancel}

                                        onReturn={handleReturn}

                                        onReview={handleReview}

                                        onBuyAgain={handleBuyAgain}

                                        onHelp={handleHelp}

                                    />

                                ))

                            }

                        </div>

                    )

                }

            </div>

            {/* Cancel Dialog */}

            <CancelDialog

                open={cancelOpen}

                loading={cancelLoading}

                onClose={() => setCancelOpen(false)}

                onConfirm={confirmCancel}

            />

            {/* Return Dialog */}

            <ReturnDialog

                open={returnOpen}

                loading={returnLoading}

                onClose={() => setReturnOpen(false)}

                onSubmit={submitReturn}

            />

        </div>

    )
}

      
