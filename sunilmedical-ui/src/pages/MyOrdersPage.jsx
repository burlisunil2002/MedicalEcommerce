import { useEffect, useMemo, useState } from "react";
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

    useEffect(() => {

        loadOrders();

    }, []);

    async function loadOrders() {

        try {

            setLoading(true);

            const response = await axios.get("/api/order/my-orders");

            let data = [];

            // Case 1: API returns an array
            if (Array.isArray(response.data)) {

                data = response.data;

            }

            // Case 2: API returns { data: [...] }
            else if (Array.isArray(response.data?.data)) {

                data = response.data.data;

            }

            // Case 3: API returns { orders: [...] }
            else if (Array.isArray(response.data?.orders)) {

                data = response.data.orders;

            }

            // Unknown response
            else {

                console.error("Unexpected API Response:", response.data);

                toast.error("Invalid response received from server.");

                data = [];

            }

            console.log("Orders Array:", data);

            setOrders(data);

        }
        catch (error) {

            console.error("Load Orders Error:", error);

            toast.error("Unable to load your orders.");

            setOrders([]);

        }
        finally {

            setLoading(false);

        }

    }

    //--------------------------------------------------
    // Overall Status
    //--------------------------------------------------

    function getOverallStatus(order) {

        const statuses = order.items.map(x => x.itemStatus);

        if (statuses.every(x => x === "Cancelled"))
            return "Cancelled";

        if (statuses.every(x => x === "Delivered"))
            return "Delivered";

        if (statuses.includes("OutForDelivery"))
            return "Out For Delivery";

        if (statuses.includes("Shipped"))
            return "Shipped";

        if (statuses.includes("Packed"))
            return "Packed";

        if (statuses.includes("Pending"))
            return "Pending";

        return "Processing";

    }

    //--------------------------------------------------
    // Filter Orders
    //--------------------------------------------------

    const filteredOrders = useMemo(() => {

        if (!Array.isArray(orders)) {

            console.error("Orders is not an array:", orders);

            return [];

        }

        return orders.filter(order => {

            const status = getOverallStatus(order);

            const searchText = search.trim().toLowerCase();

            const matchesSearch =

                !searchText ||

                order.orderNumber?.toLowerCase().includes(searchText)

                ||

                order.paymentStatus?.toLowerCase().includes(searchText)

                ||

                getOverallStatus(order).toLowerCase().includes(searchText)

                ||

                order.items.some(item =>

                    item.productName?.toLowerCase().includes(searchText)

                    ||

                    item.variantName?.toLowerCase().includes(searchText)

                );

            let matchesFilter = true;

            switch (selectedFilter) {

                case "Active":

                    matchesFilter =
                        status !== "Delivered" &&
                        status !== "Cancelled";

                    break;

                case "Delivered":

                    matchesFilter =
                        status === "Delivered";

                    break;

                case "Cancelled":

                    matchesFilter =
                        status === "Cancelled";

                    break;

                case "Pending":

                    matchesFilter =
                        status === "Pending";

                    break;

                case "Returns":

                    matchesFilter =
                        order.items.some(x =>
                            x.returnStatus &&
                            x.returnStatus !== "None"
                        );

                    break;

                default:

                    matchesFilter = true;

                    break;

            }

            return matchesSearch && matchesFilter;

        });

    }, [

        orders,

        search,

        selectedFilter

    ]);

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

            await loadOrders();

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

            await loadOrders();

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

      
