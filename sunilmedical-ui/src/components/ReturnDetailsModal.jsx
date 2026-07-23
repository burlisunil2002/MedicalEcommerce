import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateReturn } from "../services/returnService";

export default function ReturnDetailsModal({
    open,
    onClose,
    returnData,
    onSuccess
}) {

    const [status, setStatus] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        if (!returnData) return;

        setStatus(returnData.status || "Requested");
        setRefundAmount(returnData.refundAmount ?? "");
        setRemarks("");

    }, [returnData]);

    if (!open || !returnData) return null;

    async function saveReturn() {

        try {

            setSaving(true);

            await updateReturn(
                returnData.returnId,
                {
                    status,
                    remarks,
                    refundAmount:
                        refundAmount === ""
                            ? null
                            : Number(refundAmount)
                }
            );

            alert("Return updated successfully.");

            onSuccess?.();

            onClose();

        } catch (err) {

            console.error(err);

            alert("Unable to update return.");

        } finally {

            setSaving(false);

        }
    }

    return (

        <div className="fixed inset-0 z-50 bg-black/50">

            <div className="absolute inset-0 flex items-center justify-center p-4">

                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}

                    <div className="border-b px-6 py-4 flex justify-between items-center flex-shrink-0">

                        <div>

                            <h2 className="text-2xl font-bold text-gray-800">

                                Return Request Details

                            </h2>

                            <p className="text-sm text-gray-500 mt-1">

                                Return ID :
                                <span className="font-medium text-gray-700 ml-2">
                                    #{returnData.returnId}
                                </span>

                            </p>

                        </div>

                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
                        >
                            <X size={22} />
                        </button>

                    </div>

                    {/* Scrollable Body */}

                        <div className="flex-1 overflow-y-auto p-6">

                        {/* Product & Customer */}

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Product Card */}

                            <div className="bg-gray-50 border rounded-xl p-5">

                                <h3 className="text-lg font-semibold text-gray-800 mb-5">
                                    Product Details
                                </h3>

                                <div className="flex flex-col md:flex-row gap-5">

                                    <img
                                        src={returnData.productImage}
                                        alt={returnData.productName}
                                        className="w-40 h-40 rounded-xl border object-cover bg-white"
                                    />

                                    <div className="flex-1 space-y-3">

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Product
                                            </p>

                                            <p className="font-semibold text-gray-800">
                                                {returnData.productName}
                                            </p>

                                        </div>

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Variant
                                            </p>

                                            <p className="font-medium">
                                                {returnData.variantName || "-"}
                                            </p>

                                        </div>

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Quantity
                                            </p>

                                            <p className="font-medium">
                                                {returnData.quantity}
                                            </p>

                                        </div>

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Return Status
                                            </p>

                                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                                {status}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* Customer Card */}

                            <div className="bg-gray-50 border rounded-xl p-5">

                                <h3 className="text-lg font-semibold text-gray-800 mb-5">
                                    Customer Details
                                </h3>

                                <div className="space-y-4">

                                    <div>

                                        <p className="text-sm text-gray-500">
                                            Customer Name
                                        </p>

                                        <p className="font-semibold text-gray-800">
                                            {returnData.customerName}
                                        </p>

                                    </div>

                                    <div>

                                        <p className="text-sm text-gray-500">
                                            Mobile Number
                                        </p>

                                        <p className="font-medium">
                                            {returnData.mobileNumber}
                                        </p>

                                    </div>

                                    <div>

                                        <p className="text-sm text-gray-500 mb-2">
                                            Delivery Address
                                        </p>

                                        <div className="rounded-lg border bg-white p-4 leading-7 text-gray-700">

                                            <div>
                                                {returnData.address?.addressLine1}
                                            </div>

                                            {returnData.address?.addressLine2 &&
                                                <div>
                                                    {returnData.address.addressLine2}
                                                </div>
                                            }

                                            {returnData.address?.landmark &&
                                                <div>
                                                    Landmark : {returnData.address.landmark}
                                                </div>
                                            }

                                            <div>
                                                {returnData.address?.city},
                                                {" "}
                                                {returnData.address?.state}
                                            </div>

                                            <div>
                                                PIN : {returnData.address?.pincode}
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Return Information */}

                        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Return Reason */}

                            <div className="bg-gray-50 border rounded-xl p-5">

                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Return Reason
                                </h3>

                                <div className="bg-white border rounded-lg p-4 min-h-[130px] text-gray-700 leading-7">

                                    {returnData.reason || "No reason provided."}

                                </div>

                            </div>

                            {/* Customer Remarks */}

                            <div className="bg-gray-50 border rounded-xl p-5">

                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Customer Remarks
                                </h3>

                                <div className="bg-white border rounded-lg p-4 min-h-[130px] text-gray-700 leading-7">

                                    {returnData.remarks || "No remarks available."}

                                </div>

                            </div>

                        </div>

                        {/* Uploaded Images */}

                        <div className="mt-8 bg-gray-50 border rounded-xl p-5">

                            <div className="flex items-center justify-between mb-5">

                                <h3 className="text-lg font-semibold text-gray-800">

                                    Uploaded Images

                                </h3>

                                <span className="text-sm text-gray-500">

                                    {[returnData.image1, returnData.image2, returnData.image3]
                                        .filter(Boolean).length} Image(s)

                                </span>

                            </div>

                            {[returnData.image1, returnData.image2, returnData.image3]
                                .filter(Boolean).length > 0 ? (

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

                                    {[

                                        returnData.image1,

                                        returnData.image2,

                                        returnData.image3

                                    ]
                                        .filter(Boolean)
                                        .map((img, index) => (

                                            <a
                                                key={index}
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group"
                                            >

                                                <div className="overflow-hidden rounded-xl border bg-white">

                                                    <img
                                                        src={img}
                                                        alt={`Return ${index + 1}`}
                                                        className="w-full h-44 object-cover transition duration-300 group-hover:scale-105"
                                                    />

                                                </div>

                                            </a>

                                        ))}

                                </div>

                            ) : (

                                <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">

                                    No images uploaded by the customer.

                                </div>

                            )}

                        </div>

                        {/* Action Section */}

                        <div className="mt-8 bg-gray-50 border rounded-xl p-6">

                            <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                Return Action
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Return Status */}

                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Return Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    >
                                        <option value="Requested">Requested</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="PickupScheduled">Pickup Scheduled</option>
                                        <option value="PickedUp">Picked Up</option>
                                        <option value="RefundInitiated">Refund Initiated</option>
                                        <option value="RefundCompleted">Refund Completed</option>
                                    </select>

                                </div>

                                {/* Refund Amount */}

                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Refund Amount
                                    </label>

                                    <div className="relative">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            placeholder="Enter refund amount"
                                            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* Admin Remarks */}

                            <div className="mt-6">

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Admin / Seller Remarks
                                </label>

                                <textarea
                                    rows={5}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Enter remarks..."
                                    className="w-full rounded-xl border border-gray-300 p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />

                            </div>

                        </div>

                    </div>


                        {/* Footer */}

                            <div className="border-t bg-white px-6 py-4 flex justify-end gap-3 flex-shrink-0">

                            <div className="text-sm text-gray-500">

                                Review the return details before updating the status.

                            </div>

                        <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 transition font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={saveReturn}
                                    disabled={saving}
                                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >

                                    {saving && (

                                        <svg
                                            className="animate-spin h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >

                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />

                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                                            />

                                        </svg>

                                    )}

                                    {saving ? "Saving..." : "Save Changes"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            );
}