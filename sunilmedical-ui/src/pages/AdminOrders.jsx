import {
    useEffect,
    useState
} from "react";
import {
    Search,
    Download,
    RefreshCw,
    Package,
    CircleDollarSign,
    Clock,
    CheckCircle
} from "lucide-react";
import API from "../services/api";

import toast from "react-hot-toast";

export default function AdminOrders() {
    const [orders, setOrders] =
        useState([]);

    const [stats, setStats] =
        useState({
            totalOrders: 0,
            completed: 0,
            pending: 0,
            revenue: 0
        });

    const [editedOrders, setEditedOrders] =
        useState({});

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [initialLoading, setInitialLoading] =
        useState(true);

    const [filters, setFilters] =
        useState({
            search: "",
            fromDate: "",
            toDate: "",
            paymentStatus: "",
            orderStatus: "",
            page: 1
        });

    const loadOrders = async (
        showLoader = false
    ) => {

        try {

            if (showLoader)
                setInitialLoading(true);

            const { data } =
                await API.get(
                    "/api/order/admin-orders",
                    {
                        params: {
                            ...filters,
                            pageSize: 50
                        }
                    });

            setOrders(data.orders ?? []);

            setStats({
                totalOrders:
                    data.pagination.totalOrders,

                completed:
                    data.statistics.completedPayments,

                pending:
                    data.statistics.pending,

                revenue:
                    data.statistics.revenue
            });

        }
        catch (err) {

            toast.error("Failed to load orders");

        }
        finally {

            setInitialLoading(false);

        }

    };

    const updateStatus = async (
        orderItemId,
        paymentStatus,
        orderStatus
    ) => {

        try {

            setUpdatingId(orderItemId);

            await API.put(
                `/api/order/order-items/${orderItemId}/status`,
                {
                    paymentStatus,
                    itemOrderStatus: orderStatus
                }
            );

            // Update only the modified row instantly
            setOrders(prev =>
                prev.map(order =>
                    order.orderItemId === orderItemId
                        ? {
                            ...order,
                            paymentStatus,
                            orderStatus
                        }
                        : order
                )
            );

            toast.success("Order Updated Successfully");

            // Update statistics silently in background
            loadOrders(false);

        }
        catch (err) {

            console.error(err);

            toast.error(
                err.response?.data?.message ??
                "Failed to update order."
            );

        }
        finally {

            setUpdatingId(null);

        }

    };

    const exportExcel = () => {
        window.open(
            "/api/orders/export",
            "_blank"
        );
    };

    useEffect(() => {
        loadOrders(true);
    }, []);

    if (initialLoading) {

        return (

            <div className="h-screen flex justify-center items-center">

                <div className="flex flex-col items-center">

                    <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />

                    <p className="mt-4 text-slate-500">

                        Loading Orders...

                    </p>

                </div>

            </div>

        );

    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">

            <div className="max-w-[1700px] mx-auto">

                {/* HEADER */}

                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">

                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">
                            Order Management Dashboard
                        </h1>

                        <p className="text-slate-500 mt-2">
                            Manage orders,
                            payments and
                            deliveries
                        </p>
                    </div>

                    <button
                        onClick={
                            exportExcel
                        }
                        className="
              bg-gradient-to-r
              from-emerald-500
              to-green-600
              text-white
              px-6
              py-3
              rounded-2xl
              font-semibold
              flex
              items-center
              gap-2
              shadow-lg
            "
                    >
                        <Download
                            size={20}
                        />

                        Export Excel
                    </button>

                </div>

                {/* STATS */}

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

                    <div className="
            bg-white/80
            backdrop-blur-xl
            rounded-3xl
            p-6
            shadow-lg
          ">
                        <div className="
              flex
              justify-between
            ">
                            <div>
                                <p className="text-slate-500">
                                    Total Orders
                                </p>

                                <h2 className="
                  text-4xl
                  font-bold
                  mt-3
                ">
                                    {
                                        stats.totalOrders
                                    }
                                </h2>
                            </div>

                            <Package
                                size={40}
                                className="
                  text-blue-500
                "
                            />
                        </div>
                    </div>

                    <div className="
            bg-white/80
            rounded-3xl
            p-6
            shadow-lg
          ">
                        <div className="
              flex
              justify-between
            ">
                            <div>
                                <p className="
                  text-slate-500
                ">
                                    Completed
                                </p>

                                <h2 className="
                  text-4xl
                  font-bold
                  mt-3
                  text-emerald-600
                ">
                                    {
                                        stats.completed
                                    }
                                </h2>
                            </div>

                            <CheckCircle
                                size={40}
                                className="
                  text-emerald-500
                "
                            />
                        </div>
                    </div>

                    <div className="
            bg-white/80
            rounded-3xl
            p-6
            shadow-lg
          ">
                        <div className="
              flex
              justify-between
            ">
                            <div>
                                <p className="
                  text-slate-500
                ">
                                    Pending
                                </p>

                                <h2 className="
                  text-4xl
                  font-bold
                  mt-3
                  text-amber-500
                ">
                                    {
                                        stats.pending
                                    }
                                </h2>
                            </div>

                            <Clock
                                size={40}
                                className="
                  text-amber-500
                "
                            />
                        </div>
                    </div>

                    <div className="
            bg-white/80
            rounded-3xl
            p-6
            shadow-lg
          ">
                        <div className="
              flex
              justify-between
            ">
                            <div>
                                <p className="
                  text-slate-500
                ">
                                    Revenue
                                </p>

                                <h2 className="
                  text-4xl
                  font-bold
                  mt-3
                  text-indigo-600
                ">
                                    ₹
                                    {
                                        stats.revenue?.toLocaleString()
                                    }
                                </h2>
                            </div>

                            <CircleDollarSign
                                size={40}
                                className="
                  text-indigo-500
                "
                            />
                        </div>
                    </div>

                </div>

                {/* FILTERS */}

                <div className="
          bg-white/80
          backdrop-blur-xl
          rounded-3xl
          p-6
          shadow-lg
          mb-8
        ">

                    <div className="
            grid
            lg:grid-cols-6
            gap-4
          ">

                        <div className="
              relative
              lg:col-span-2
            ">
                            <Search
                                size={20}
                                className="
                  absolute
                  top-4
                  left-4
                  text-slate-400
                "
                            />

                            <input
                                placeholder="Search Orders..."
                                value={
                                    filters.search
                                }
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        search:
                                            e.target
                                                .value
                                    })
                                }
                                className="
                  w-full
                  pl-12
                  pr-4
                  py-4
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                "
                            />
                        </div>

                        <input
                            type="date"
                            value={
                                filters.fromDate
                            }
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    fromDate:
                                        e.target
                                            .value
                                })
                            }
                            className="
                px-4
                py-4
                rounded-2xl
                border
              "
                        />

                        <input
                            type="date"
                            value={
                                filters.toDate
                            }
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    toDate:
                                        e.target
                                            .value
                                })
                            }
                            className="
                px-4
                py-4
                rounded-2xl
                border
              "
                        />

                        <button
                            onClick={
                                loadOrders
                            }
                            className="
                bg-blue-600
                text-white
                rounded-2xl
                font-semibold
              "
                        >
                            Search
                        </button>

                        <button
                            onClick={() => {
                                setFilters({
                                    search: "",
                                    fromDate: "",
                                    toDate: "",
                                    paymentStatus: "",
                                    orderStatus: "",
                                    page: 1
                                });

                                setTimeout(() => {
                                    loadOrders();
                                }, 100);
                            }}
                            className="
                bg-slate-200
                rounded-2xl
                font-semibold
                flex
                items-center
                justify-center
                gap-2
              "
                        >
                            <RefreshCw
                                size={18}
                            />
                            Reset
                        </button>

                    </div>

                </div>

                {/* TABLE */}

                <div className="
          bg-white/80
          backdrop-blur-xl
          rounded-3xl
          shadow-lg
          overflow-hidden
        ">

                    <div className="
            overflow-auto
            max-h-[700px]
          ">

                        <table className="w-full">

                            <thead className="
                sticky
                top-0
                bg-white
                border-b
              ">
                                <tr className="
                  text-left
                  text-slate-600
                  text-sm
                ">
                                    <th className="p-5">
                                        OrderItemID
                                    </th>
                                    <th className="p-5">
                                        Date
                                    </th>
                                    <th className="p-5">
                                        Customer
                                    </th>
                                    <th className="p-5">
                                        Product
                                    </th>
                                    <th className="p-5">
                                        Qty
                                    </th>
                                    <th className="p-5">
                                        Total
                                    </th>
                                    <th className="p-5">
                                        Payment
                                    </th>
                                    <th className="p-5">
                                        Status
                                    </th>
                                    <th className="p-5">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {orders.map(
                                    (o) => (
                                        <tr
                                            key={
                                                o.orderItemId
                                            }
                                            className="
                        border-b
                        hover:bg-slate-50
                      "
                                        >
                                            <td className="p-5 font-bold text-blue-600">
                                                #
                                                {o.orderItemId}
                                            </td>

                                            <td className="p-5">
                                                {new Date(
                                                    o.orderDate
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="p-5">
                                                {
                                                    o.customer
                                                }
                                            </td>

                                            <td className="p-5">
                                                {
                                                    o.productName
                                                }
                                            </td>

                                            <td className="p-5">
                                                {
                                                    o.quantity
                                                }
                                            </td>

                                            <td className="p-5 font-semibold text-emerald-600">
                                                ₹
                                                {o.grandTotal?.toLocaleString()}
                                            </td>



                                            <td className="p-5">
                                                <select
                                                    className="
        px-4 py-2
        rounded-xl
        border
        border-gray-300
        bg-white
        text-gray-800
        focus:ring-2
        focus:ring-blue-500
        outline-none"
                                                    value={
                                                        editedOrders[o.orderItemId]?.paymentStatus ??
                                                        o.paymentStatus
                                                    }
                                                    onChange={(e) =>
                                                        setEditedOrders(prev => ({
                                                            ...prev,
                                                            [o.orderItemId]: {
                                                                ...prev[o.orderItemId],
                                                                paymentStatus: e.target.value
                                                            }
                                                        }))
                                                    }
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Failed">Failed</option>
                                                    <option value="Refunded">Refunded</option>
                                                </select>
                                            </td>

                                            <td className="p-5">
                                                <select
                                                    className="
        px-4 py-2
        rounded-xl
        border
        border-gray-300
        bg-white
        text-gray-800
        focus:ring-2
        focus:ring-indigo-500
        outline-none"
                                                    value={
                                                        editedOrders[o.orderItemId]?.orderStatus ??
                                                        o.orderStatus
                                                    }
                                                    onChange={(e) =>
                                                        setEditedOrders(prev => ({
                                                            ...prev,
                                                            [o.orderItemId]: {
                                                                ...prev[o.orderItemId],
                                                                orderStatus: e.target.value                                                            }
                                                        }))
                                                    }
                                                >
                                                    <option value="Placed">Placed</option>
                                                    <option value="Packed">Packed</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="OutForDelivery">Out For Delivery</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>

                                            <td className="p-5">
                                                <td className="p-5">
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                o.orderItemId,
                                                                editedOrders[o.orderItemId]?.paymentStatus ??
                                                                o.paymentStatus,
                                                                editedOrders[o.orderItemId]?.orderStatus ??
                                                                o.orderStatus
                                                            )
                                                        }
                                                        disabled={updatingId === o.orderItemId}
                                                        className={`
            px-5
            py-2
            rounded-xl
            font-semibold
            transition-all
            ${updatingId === o.orderItemId
                                                                ? "bg-gray-400 cursor-not-allowed text-white"
                                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                                            }
        `}
                                                    >
                                                        {updatingId === o.orderItemId ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Updating...
                                                            </div>
                                                        ) : (
                                                            "Update"
                                                        )}
                                                    </button>
                                                </td>
                                            </td>
                                            </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}