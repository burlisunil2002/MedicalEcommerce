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

    const [loading, setLoading] =
        useState(false);

    const [filters, setFilters] =
        useState({
            search: "",
            fromDate: "",
            toDate: "",
            paymentStatus: "",
            orderStatus: "",
            page: 1
        });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders =
        async () => {
            try {
                setLoading(true);

                const res =
                    await API.get(
                        "/api/order/admin-orders",
                        {
                            params: {
                                search: filters.search,
                                fromDate: filters.fromDate,
                                toDate: filters.toDate,
                                paymentStatus: filters.paymentStatus,
                                orderStatus: filters.orderStatus,
                                page: filters.page,
                                pageSize: 50
                            }
                        }
                    );

                setOrders(res.data.orders || []);

                setStats({
                    totalOrders:
                        res.data.totalOrders || 0,

                    completed:
                        res.data.completed || 0,

                    pending:
                        res.data.pending || 0,

                    revenue:
                        res.data.revenue || 0
                });
            } catch (err) {
  console.log(err);
  console.log(err.response);

  alert(
    err.response?.data?.message ||
    "Failed to load orders"
  );
} finally {
                setLoading(false);
            }
        };

    const updateStatus =
        async (
            orderId,
            paymentStatus,
            orderStatus
        ) => {
            try {
                await API.put(
                    `/api/order/orders/${orderId}/status`,
                    {
                        orderId,
                        paymentStatus,
                        orderStatus
                    }
                );

                alert(
                    "Updated successfully"
                );

                loadOrders();
            } catch {
                alert(
                    "Failed to update"
                );
            }
        };

    const exportExcel = () => {
        window.open(
            "/api/orders/export",
            "_blank"
        );
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">

            <div className="max-w-[1700px] mx-auto">

                {/* HEADER */}

                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">

                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">
                            Order Management
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
                                        Order
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
                                                {o.orderId}
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
            outline-none
        "
                                                    value={
                                                        editedOrders[o.orderId]?.paymentStatus ??
                                                        o.paymentStatus
                                                    }
                                                    onChange={(e) =>
                                                        setEditedOrders({
                                                            ...editedOrders,
                                                            [o.orderId]: {
                                                                ...editedOrders[o.orderId],
                                                                paymentStatus: e.target.value
                                                            }
                                                        })
                                                    }
                                                >
                                                    <option value="Pending">
                                                        Pending
                                                    </option>

                                                    <option value="Completed">
                                                        Completed
                                                    </option>

                                                    <option value="Failed">
                                                        Failed
                                                    </option>

                                                    <option value="Refunded">
                                                        Refunded
                                                    </option>
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
            outline-none
        "
                                                    value={
                                                        editedOrders[o.orderId]?.orderStatus ??
                                                        o.orderStatus
                                                    }
                                                    onChange={(e) =>
                                                        setEditedOrders({
                                                            ...editedOrders,
                                                            [o.orderId]: {
                                                                ...editedOrders[o.orderId],
                                                                orderStatus: e.target.value
                                                            }
                                                        })
                                                    }
                                                >
                                                    <option value="Pending">
                                                        Pending
                                                    </option>

                                                    <option value="Processing">
                                                        Processing
                                                    </option>

                                                    <option value="Shipped">
                                                        Shipped
                                                    </option>

                                                    <option value="Delivered">
                                                        Delivered
                                                    </option>

                                                    <option value="Cancelled">
                                                        Cancelled
                                                    </option>
                                                </select>
                                            </td>

                                            <td className="p-5">
                                                <button
                                                    onClick={() =>
                                                        updateStatus(
                                                            o.orderId,
                                                            editedOrders[o.orderId]
                                                                ?.paymentStatus ??
                                                            o.paymentStatus,

                                                            editedOrders[o.orderId]
                                                                ?.orderStatus ??
                                                            o.orderStatus
                                                        )
                                                    }
                                                    className="
            px-5 py-2
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            text-white
            font-medium
            shadow-lg
            hover:scale-105
            transition
        "
                                                >
                                                    Update
                                                </button>
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