import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Eye } from "lucide-react";
import { getReturns } from "../services/returnService";
import StatusBadge from "../components/StatusBadge";
import ReturnDetailsModal from "../components/ReturnDetailsModal";

export default function ReturnOrdersPage() {

    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [page, setPage] = useState(1);

    const pageSize = 10;

    const [selectedReturn, setSelectedReturn] = useState(null);

    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        loadReturns();
    }, []);

    async function loadReturns() {

        try {

            setLoading(true);

            const result = await getReturns();

            setReturns(result.data);

            setTotalPages(result.totalPages);

            setTotalRecords(result.totalRecords);

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    }

    const filteredReturns = useMemo(() => {

        let list = Array.isArray(returns) ? [...returns] : [];


        if (statusFilter !== "All") {

            list = list.filter(x => x.status === statusFilter);

        }

        if (search.trim()) {

            const q = search.toLowerCase();

            list = list.filter(item =>

                item.orderNumber?.toLowerCase().includes(q)

                ||

                item.customerName?.toLowerCase().includes(q)

                ||

                item.productName?.toLowerCase().includes(q)

                ||

                item.mobileNumber?.includes(q)

            );

        }

        return list;

    }, [returns, search, statusFilter]);

    const totalPages = Math.ceil(filteredReturns.length / pageSize);

    const pagedReturns = filteredReturns.slice(

        (page - 1) * pageSize,

        page * pageSize

    );

    return (

        <div className="p-6">

            {/* Header */}

            <div className="bg-white rounded-xl shadow border p-6">

                <div className="flex flex-col lg:flex-row justify-between gap-4">

                    <div>

                        <h1 className="text-2xl font-bold">

                            Return Orders

                        </h1>

                        <p className="text-gray-500">

                            Manage return requests

                        </p>

                    </div>

                    <button

                        onClick={loadReturns}

                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"

                    >

                        <RefreshCw size={18} />

                        Refresh

                    </button>

                </div>

            </div>

            {/* Filters */}

            <div className="bg-white mt-5 rounded-xl shadow border p-4">

                <div className="grid lg:grid-cols-2 gap-4">

                    <div className="relative">

                        <Search

                            size={18}

                            className="absolute left-3 top-3 text-gray-400"

                        />

                        <input

                            className="w-full border rounded-lg pl-10 pr-4 py-2"

                            placeholder="Search Order / Customer / Product"

                            value={search}

                            onChange={(e) => setSearch(e.target.value)}

                        />

                    </div>

                    <select

                        value={statusFilter}

                        onChange={(e) => setStatusFilter(e.target.value)}

                        className="border rounded-lg px-4 py-2"

                    >

                        <option>All</option>
                        <option>Requested</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                        <option>PickupScheduled</option>
                        <option>PickedUp</option>
                        <option>RefundInitiated</option>
                        <option>RefundCompleted</option>

                    </select>

                </div>

            </div>

            {/* Table */}

            <div className="bg-white rounded-xl shadow border mt-5 overflow-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Order</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Customer</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Product</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Reason</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Requested</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Status</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Refund</th>

                            <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {loading && (

                            <tr>

                                <td

                                    colSpan={8}

                                    className="text-center py-10"

                                >

                                    Loading...

                                </td>

                            </tr>

                        )}

                        {!loading && pagedReturns.length === 0 && (

                            <tr>

                                <td

                                    colSpan={8}

                                    className="text-center py-10"

                                >

                                    No return requests found.

                                </td>

                            </tr>

                        )}

                        {!loading && pagedReturns.map(item => (

                            <tr

                                key={item.returnId}

                                className="border-t hover:bg-gray-50"

                            >

                                <td className="p-3">{item.orderNumber}</td>

                                <td className="p-3">

                                    <div>{item.customerName}</div>

                                    <div className="text-xs text-gray-500">

                                        {item.mobileNumber}

                                    </div>

                                </td>

                                <td className="p-3">

                                    {item.productName}

                                </td>

                                <td className="p-3">

                                    {item.reason}

                                </td>

                                <td className="p-3">

                                    {new Date(item.requestedDate).toLocaleDateString()}

                                </td>

                                <td className="p-3">

                                    <StatusBadge

                                        status={item.status}

                                    />

                                </td>

                                <td className="p-3">

                                    ₹{item.refundAmount ?? 0}

                                </td>

                                <td className="p-3 text-center">

                                    <button

                                        onClick={() => {

                                            setSelectedReturn(item);

                                            setOpenModal(true);

                                        }}

                                        className="text-blue-600"

                                    >

                                        <Eye size={18} />

                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* Pagination */}

            <div className="flex justify-between mt-5">

                <button

                    disabled={page === 1}

                    onClick={() => setPage(page - 1)}

                    className="border rounded px-4 py-2"

                >

                    Previous

                </button>

                <div>

                    Page {page} of {totalPages || 1}

                </div>

                <button

                    disabled={page === totalPages}

                    onClick={() => setPage(page + 1)}

                    className="border rounded px-4 py-2"

                >

                    Next

                </button>

            </div>

            <ReturnDetailsModal

                open={openModal}

                onClose={() => setOpenModal(false)}

                returnData={selectedReturn}

                onSuccess={loadReturns}

            />

        </div>

    );

}

