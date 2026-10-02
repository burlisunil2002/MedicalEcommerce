import { useEffect, useState } from "react";
import {
    X,
    Landmark,
    User,
    CreditCard,
    Building2,
    MapPin,
    Package,
    RotateCcw
} from "lucide-react";

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

    // Refund Bank Details
    const [accountHolderName, setAccountHolderName] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");

    useEffect(() => {
        if (!returnData) return;

        setStatus(returnData.status || "Requested");

        setRefundAmount(
            returnData.refundAmount ?? ""
        );

        setRemarks("");

        setAccountHolderName(
            returnData.accountHolderName || ""
        );

        setBankName(
            returnData.bankName || ""
        );

        setAccountNumber(
            returnData.accountNumber || ""
        );

        setIfscCode(
            returnData.ifscCode || ""
        );
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
                            : Number(refundAmount),

                    accountHolderName:
                        accountHolderName.trim(),

                    bankName:
                        bankName.trim(),

                    accountNumber:
                        accountNumber.trim(),

                    ifscCode:
                        ifscCode.trim().toUpperCase()
                }
            );

            alert("Return updated successfully.");

            onSuccess?.();

            onClose();

        } catch (err) {
            console.error(err);

            alert(
                err?.response?.data?.message ||
                "Unable to update return."
            );

        } finally {
            setSaving(false);
        }
    }

    const images = [
        returnData.image1,
        returnData.image2,
        returnData.image3
    ].filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">

            <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">

                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[96vh] sm:h-[92vh] flex flex-col overflow-hidden">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <div className="border-b bg-white px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">

                        <div className="flex items-center gap-3 min-w-0">

                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">

                                <RotateCcw
                                    size={21}
                                    className="text-orange-600"
                                />

                            </div>

                            <div className="min-w-0">

                                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
                                    Return Request Details
                                </h2>

                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Return ID :
                                    <span className="font-medium text-gray-700 ml-2">
                                        #{returnData.returnId}
                                    </span>
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        >
                            <X size={22} />
                        </button>

                    </div>


                    {/* =====================================================
                        SCROLLABLE BODY
                    ====================================================== */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-6">


                        {/* =================================================
                            PRODUCT & CUSTOMER
                        ================================================== */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">


                            {/* PRODUCT CARD */}
                            <div className="bg-gray-50 border rounded-xl p-4 sm:p-5">

                                <div className="flex items-center gap-2 mb-5">

                                    <Package
                                        size={20}
                                        className="text-blue-600"
                                    />

                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                        Product Details
                                    </h3>

                                </div>


                                <div className="flex flex-col sm:flex-row gap-5">

                                    {returnData.productImage ? (

                                        <img
                                            src={returnData.productImage}
                                            alt={returnData.productName}
                                            className="w-full sm:w-40 h-40 rounded-xl border object-cover bg-white"
                                        />

                                    ) : (

                                        <div className="w-full sm:w-40 h-40 rounded-xl border bg-white flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>

                                    )}


                                    <div className="flex-1 space-y-4">

                                        <div>

                                            <p className="text-xs sm:text-sm text-gray-500">
                                                Product
                                            </p>

                                            <p className="font-semibold text-gray-800 break-words">
                                                {returnData.productName || "-"}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs sm:text-sm text-gray-500">
                                                Variant
                                            </p>

                                            <p className="font-medium text-gray-800">
                                                {returnData.variantName || "-"}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs sm:text-sm text-gray-500">
                                                Quantity
                                            </p>

                                            <p className="font-medium text-gray-800">
                                                {returnData.quantity ?? "-"}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs sm:text-sm text-gray-500 mb-1">
                                                Return Status
                                            </p>

                                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium">
                                                {status}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* CUSTOMER CARD */}
                            <div className="bg-gray-50 border rounded-xl p-4 sm:p-5">

                                <div className="flex items-center gap-2 mb-5">

                                    <User
                                        size={20}
                                        className="text-blue-600"
                                    />

                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                        Customer Details
                                    </h3>

                                </div>


                                <div className="space-y-4">

                                    <div>

                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Customer Name
                                        </p>

                                        <p className="font-semibold text-gray-800">
                                            {returnData.customerName || "-"}
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Mobile Number
                                        </p>

                                        <p className="font-medium text-gray-800">
                                            {returnData.mobileNumber || "-"}
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-xs sm:text-sm text-gray-500 mb-2 flex items-center gap-1">
                                            <MapPin size={15} />
                                            Delivery Address
                                        </p>

                                        <div className="rounded-lg border bg-white p-3 sm:p-4 leading-7 text-gray-700 text-sm">

                                            {returnData.address?.addressLine1 && (
                                                <div>
                                                    {returnData.address.addressLine1}
                                                </div>
                                            )}

                                            {returnData.address?.addressLine2 && (
                                                <div>
                                                    {returnData.address.addressLine2}
                                                </div>
                                            )}

                                            {returnData.address?.landmark && (
                                                <div>
                                                    Landmark : {returnData.address.landmark}
                                                </div>
                                            )}

                                            {(returnData.address?.city ||
                                                returnData.address?.state) && (
                                                    <div>
                                                        {returnData.address?.city}
                                                        {returnData.address?.city &&
                                                            returnData.address?.state
                                                            ? ", "
                                                            : ""}
                                                        {returnData.address?.state}
                                                    </div>
                                                )}

                                            {returnData.address?.pincode && (
                                                <div>
                                                    PIN : {returnData.address.pincode}
                                                </div>
                                            )}

                                            {!returnData.address && (
                                                <span className="text-gray-400">
                                                    No address available
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            REFUND BANK DETAILS
                        ================================================== */}
                        <div className="mt-6 sm:mt-8">

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">

                                <div className="flex items-start gap-3 mb-5 sm:mb-6">

                                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">

                                        <Landmark
                                            size={21}
                                            className="text-blue-600"
                                        />

                                    </div>

                                    <div className="min-w-0">

                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                            Refund Bank Details
                                        </h3>

                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            Bank account provided by the customer for refund processing.
                                        </p>

                                    </div>

                                </div>


                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


                                    {/* ACCOUNT HOLDER */}
                                    <div className="rounded-xl border bg-white p-4">

                                        <div className="flex items-center gap-2 text-gray-500 mb-2">

                                            <User size={16} />

                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                Account Holder
                                            </p>

                                        </div>

                                        <p className="font-semibold text-gray-800 break-words">
                                            {returnData.accountHolderName || "-"}
                                        </p>

                                    </div>


                                    {/* BANK NAME */}
                                    <div className="rounded-xl border bg-white p-4">

                                        <div className="flex items-center gap-2 text-gray-500 mb-2">

                                            <Building2 size={16} />

                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                Bank Name
                                            </p>

                                        </div>

                                        <p className="font-semibold text-gray-800 break-words">
                                            {returnData.bankName || "-"}
                                        </p>

                                    </div>


                                    {/* ACCOUNT NUMBER */}
                                    <div className="rounded-xl border bg-white p-4">

                                        <div className="flex items-center gap-2 text-gray-500 mb-2">

                                            <CreditCard size={16} />

                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                Account Number
                                            </p>

                                        </div>

                                        <p className="font-semibold text-gray-800 break-all">
                                            {returnData.accountNumber || "-"}
                                        </p>

                                    </div>


                                    {/* IFSC */}
                                    <div className="rounded-xl border bg-white p-4">

                                        <div className="flex items-center gap-2 text-gray-500 mb-2">

                                            <Landmark size={16} />

                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                IFSC Code
                                            </p>

                                        </div>

                                        <p className="font-semibold text-gray-800 uppercase break-all">
                                            {returnData.ifscCode || "-"}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            RETURN INFORMATION
                        ================================================== */}
                        <div className="mt-6 sm:mt-8 grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">


                            {/* RETURN REASON */}
                            <div className="bg-gray-50 border rounded-xl p-4 sm:p-5">

                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                                    Return Reason
                                </h3>

                                <div className="bg-white border rounded-lg p-4 min-h-[120px] text-gray-700 leading-7 text-sm sm:text-base">

                                    {returnData.reason ||
                                        "No reason provided."}

                                </div>

                            </div>


                            {/* CUSTOMER REMARKS */}
                            <div className="bg-gray-50 border rounded-xl p-4 sm:p-5">

                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                                    Customer Remarks
                                </h3>

                                <div className="bg-white border rounded-lg p-4 min-h-[120px] text-gray-700 leading-7 text-sm sm:text-base">

                                    {returnData.remarks ||
                                        "No remarks available."}

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            UPLOADED IMAGES
                        ================================================== */}
                        <div className="mt-6 sm:mt-8 bg-gray-50 border rounded-xl p-4 sm:p-5">

                            <div className="flex items-center justify-between mb-5">

                                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                    Uploaded Images
                                </h3>

                                <span className="text-xs sm:text-sm text-gray-500">
                                    {images.length} Image(s)
                                </span>

                            </div>


                            {images.length > 0 ? (

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">

                                    {images.map((img, index) => (

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
                                                    className="w-full h-32 sm:h-44 object-cover transition duration-300 group-hover:scale-105"
                                                />

                                            </div>

                                        </a>

                                    ))}

                                </div>

                            ) : (

                                <div className="rounded-lg border border-dashed p-8 sm:p-10 text-center text-sm sm:text-base text-gray-500">
                                    No images uploaded by the customer.
                                </div>

                            )}

                        </div>


                        {/* =================================================
                            RETURN ACTION
                        ================================================== */}
                        <div className="mt-6 sm:mt-8 bg-gray-50 border rounded-xl p-4 sm:p-6">

                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-5 sm:mb-6">
                                Return Action
                            </h3>


                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">


                                {/* STATUS */}
                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Return Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    >

                                        <option value="Requested">
                                            Requested
                                        </option>

                                        <option value="Approved">
                                            Approved
                                        </option>

                                        <option value="Rejected">
                                            Rejected
                                        </option>

                                        <option value="PickupScheduled">
                                            Pickup Scheduled
                                        </option>

                                        <option value="PickedUp">
                                            Picked Up
                                        </option>

                                        <option value="RefundInitiated">
                                            Refund Initiated
                                        </option>

                                        <option value="RefundCompleted">
                                            Refund Completed
                                        </option>

                                    </select>

                                </div>


                                {/* REFUND AMOUNT */}
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
                                            onChange={(e) =>
                                                setRefundAmount(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter refund amount"
                                            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ADMIN REMARKS */}
                            <div className="mt-5 sm:mt-6">

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Admin / Seller Remarks
                                </label>

                                <textarea
                                    rows={4}
                                    value={remarks}
                                    onChange={(e) =>
                                        setRemarks(e.target.value)
                                    }
                                    placeholder="Enter remarks..."
                                    className="w-full rounded-xl border border-gray-300 p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />

                            </div>

                        </div>

                    </div>


                    {/* =====================================================
                        FOOTER
                    ====================================================== */}
                    <div className="border-t bg-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">

                        <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                            Review the return details before updating the status.
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 transition font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={saveReturn}
                                disabled={saving}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}