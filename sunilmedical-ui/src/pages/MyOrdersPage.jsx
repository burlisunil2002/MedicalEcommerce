import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import OrderHero from "../components/orders/OrderHero";
import LoadingOrders from "../components/orders/LoadingOrders";
import EmptyOrders from "../components/orders/EmptyOrders";
import OrderCard from "../components/orders/OrderCard";
import CancelDialog from "../components/orders/CancelDialog";
import ReturnDialog from "../components/orders/ReturnDialog";

export default function MyOrdersPage() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedOrder, setSelectedOrder] =
        useState(null);

    const [showCancelDialog, setShowCancelDialog] =
        useState(false);

    const [showReturnDialog, setShowReturnDialog] =
        useState(false);

    const [processing, setProcessing] =
        useState(false);

    useEffect(() => {

        loadOrders();

    }, []);

    //----------------------------------------------------
    // LOAD ORDERS
    //----------------------------------------------------

    const loadOrders = async () => {

        try {

            setLoading(true);

            const { data } =
                await API.get("/api/order/my-orders");

            setOrders(

                data.orders ??

                []

            );

        }

        catch (err) {

            console.log(err);

            if (err.response?.status === 401)

                navigate("/login");

        }

        finally {

            setLoading(false);

        }

    };

    //----------------------------------------------------
    // SEARCH
    //----------------------------------------------------

    const filteredOrders = useMemo(() => {

        const term = search.toLowerCase();

        return orders.filter(order =>

            order.orderNumber
                ?.toLowerCase()
                .includes(term)

            ||

            order.orderStatus
                ?.toLowerCase()
                .includes(term)

            ||

            order.items.some(item =>

                item.productName
                    ?.toLowerCase()
                    .includes(term)

            )

        );

    }, [orders, search]);

    //----------------------------------------------------
    // CANCEL ORDER
    //----------------------------------------------------

    const confirmCancelOrder = async () => {

        if (!selectedOrder)

            return;

        try {

            setProcessing(true);

            const { data } =
                await API.put(

                    `/api/order/cancel/${selectedOrder.orderId}`

                );

            alert(data.message);

            setShowCancelDialog(false);

            setSelectedOrder(null);

            await loadOrders();

        }

        catch (err) {

            alert(

                err.response?.data?.message ??

                "Unable to cancel order."

            );

        }

        finally {

            setProcessing(false);

        }

    };

    //----------------------------------------------------
    // RETURN ORDER
    //----------------------------------------------------

    const submitReturnRequest = async (payload) => {

        try {

            setProcessing(true);

            const body = {

                orderId:

                    payload.order.orderId,

                reason:

                    payload.reason,

                remarks:

                    payload.remarks

            };

            const { data } =
                await API.post(

                    "/api/order/request-return",

                    body

                );

            alert(data.message);

            setShowReturnDialog(false);

            setSelectedOrder(null);

            await loadOrders();

        }

        catch (err) {

            alert(

                err.response?.data?.message ??

                "Unable to submit return."

            );

        }

        finally {

            setProcessing(false);

        }

    };

    //----------------------------------------------------
    // BUY AGAIN
    //----------------------------------------------------

    const handleBuyAgain = async (order) => {

        try {

            for (const item of order.items) {

                await API.post(

                    "/api/cart/add",

                    {

                        productId:

                            item.productId,

                        variantId:

                            item.variantId,

                        quantity:

                            item.quantity

                    }

                );

            }

            alert("Items added to cart.");

            navigate("/cart");

        }

        catch {

            alert("Unable to add items.");

        }

    };

    //----------------------------------------------------
    // HELP
    //----------------------------------------------------

    const handleHelp = () => {

        window.open(

            "https://wa.me/919014060858",

            "_blank"

        );

    };
    //----------------------------------------------------
    // ACTIONS
    //----------------------------------------------------

    const handleCancel = (order) => {

        setSelectedOrder(order);

        setShowCancelDialog(true);

    };

    const handleReturn = (order) => {

        setSelectedOrder(order);

        setShowReturnDialog(true);

    };

    const handleInvoice = (order) => {

        navigate(`/invoice/${order.orderId}`);

    };

    const handleTrack = (order) => {

        document
            .getElementById(`tracker-${order.orderId}`)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    };

    //----------------------------------------------------
    // LOADING
    //----------------------------------------------------

    if (loading) {

        return <LoadingOrders />;

    }

    //----------------------------------------------------
    // EMPTY
    //----------------------------------------------------

    if (!loading && filteredOrders.length === 0) {

        return <EmptyOrders />;

    }

    //----------------------------------------------------
    // PAGE
    //----------------------------------------------------

    return (

        <div className="min-h-screen bg-slate-50">

            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">

                {/* Hero */}

                <OrderHero

                    search={search}

                    setSearch={setSearch}

                    totalOrders={orders.length}

                />

                {/* Orders */}

                <div className="space-y-8">

                    {

                        filteredOrders.map(order => (

                            <OrderCard

                                key={order.orderId}

                                order={order}

                                onCancel={handleCancel}

                                onReturn={handleReturn}

                                onInvoice={handleInvoice}

                                onTrack={handleTrack}

                                onBuyAgain={handleBuyAgain}

                                onHelp={handleHelp}

                            />

                        ))

                    }

                </div>
                {/* Cancel Dialog */}

                <CancelDialog

                    open={showCancelDialog}

                    order={selectedOrder}

                    loading={processing}

                    onClose={() => {

                        setShowCancelDialog(false);

                        setSelectedOrder(null);

                    }}

                    onConfirm={confirmCancelOrder}

                />

                {/* Return Dialog */}

                <ReturnDialog

                    open={showReturnDialog}

                    order={selectedOrder}

                    loading={processing}

                    onClose={() => {

                        setShowReturnDialog(false);

                        setSelectedOrder(null);

                    }}

                    onSubmit={submitReturnRequest}

                />

            </div>

        </div>

    );

}