import { useEffect, useState } from "react";
import {
    RotateCcw,
    Upload,
    X,
    Image as ImageIcon,
    Landmark,
    User,
    CreditCard,
    Building2
} from "lucide-react";

const reasons = [
    "Damaged Product",
    "Wrong Product Delivered",
    "Product Not Working",
    "Missing Parts",
    "Quality Issue",
    "Changed My Mind",
    "Other"
];

export default function ReturnDialog({
    open,
    loading,
    onClose,
    onSubmit
}) {
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [files, setFiles] = useState([]);

    // Refund Bank Details
    const [accountHolderName, setAccountHolderName] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");

    useEffect(() => {
        if (!open) {
            setReason("");
            setRemarks("");
            setFiles([]);

            setAccountHolderName("");
            setBankName("");
            setAccountNumber("");
            setIfscCode("");
        }
    }, [open]);

    if (!open) return null;

    function addFiles(e) {
        const selected = Array.from(e.target.files || []);

        setFiles(prev => [
            ...prev,
            ...selected
        ]);

        // Allow selecting the same file again
        e.target.value = "";
    }

    function removeFile(index) {
        setFiles(prev =>
            prev.filter((_, i) => i !== index)
        );
    }

    function handleSubmit() {
        if (!reason) {
            alert("Please select a return reason.");
            return;
        }

        if (!accountHolderName.trim()) {
            alert("Please enter the account holder name.");
            return;
        }

        if (!bankName.trim()) {
            alert("Please enter the bank name.");
            return;
        }

        if (!accountNumber.trim()) {
            alert("Please enter the account number.");
            return;
        }

        if (!ifscCode.trim()) {
            alert("Please enter the IFSC code.");
            return;
        }

        onSubmit({
            reason,
            remarks,
            files,

            // Refund Bank Details
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase()
        });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">

            <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">

                <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-4 sm:p-6 flex-shrink-0">

                        <div className="flex items-center gap-3 min-w-0">

                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                                <RotateCcw
                                    className="text-orange-500"
                                    size={24}
                                />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                                    Request Return
                                </h2>

                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Provide the return details and refund bank information
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 hover:bg-slate-100 flex-shrink-0"
                        >
                            <X size={22} />
                        </button>

                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                        {/* Return Reason */}
                        <div>

                            <label className="mb-2 block font-semibold text-gray-700">
                                Return Reason
                                <span className="text-red-500 ml-1">*</span>
                            </label>

                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">
                                    Select Reason
                                </option>

                                {reasons.map(item => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Remarks */}
                        <div>

                            <label className="mb-2 block font-semibold text-gray-700">
                                Additional Remarks
                            </label>

                            <textarea
                                rows={4}
                                value={remarks}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                                placeholder="Describe the issue in detail..."
                            />

                        </div>

                        {/* Refund Bank Details */}
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">

                            <div className="flex items-start gap-3 mb-5">

                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                                    <Landmark
                                        size={21}
                                        className="text-blue-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                        Refund Bank Details
                                    </h3>

                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        Enter the bank account where the refund should be credited.
                                    </p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Account Holder */}
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Account Holder Name
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>

                                    <div className="relative">

                                        <User
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            value={accountHolderName}
                                            onChange={(e) =>
                                                setAccountHolderName(e.target.value)
                                            }
                                            placeholder="Enter account holder name"
                                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Bank Name */}
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Bank Name
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>

                                    <div className="relative">

                                        <Building2
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={(e) =>
                                                setBankName(e.target.value)
                                            }
                                            placeholder="Enter bank name"
                                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Account Number */}
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Account Number
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>

                                    <div className="relative">

                                        <CreditCard
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={accountNumber}
                                            onChange={(e) =>
                                                setAccountNumber(
                                                    e.target.value.replace(/\D/g, "")
                                                )
                                            }
                                            placeholder="Enter account number"
                                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* IFSC */}
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        IFSC Code
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>

                                    <div className="relative">

                                        <Landmark
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            maxLength={11}
                                            value={ifscCode}
                                            onChange={(e) =>
                                                setIfscCode(
                                                    e.target.value
                                                        .toUpperCase()
                                                        .replace(/\s/g, "")
                                                )
                                            }
                                            placeholder="e.g. SBIN0001234"
                                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Upload Images */}
                        <div>

                            <label className="mb-3 block font-semibold text-gray-700">
                                Upload Supporting Images
                            </label>

                            <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 sm:p-8 transition hover:border-blue-500 hover:bg-blue-50">

                                <div className="text-center">

                                    <Upload
                                        className="mx-auto text-blue-600"
                                        size={34}
                                    />

                                    <p className="mt-3 font-medium text-gray-700">
                                        Click to upload images
                                    </p>

                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        JPG, PNG, JPEG
                                    </p>

                                </div>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg"
                                    hidden
                                    onChange={addFiles}
                                />

                            </label>

                        </div>

                        {/* Image Preview */}
                        {files.length > 0 && (

                            <div>

                                <div className="flex items-center justify-between mb-4">

                                    <h4 className="font-semibold text-gray-800">
                                        Selected Images
                                    </h4>

                                    <span className="text-sm text-gray-500">
                                        {files.length} Image(s)
                                    </span>

                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

                                    {files.map((file, index) => (

                                        <div
                                            key={index}
                                            className="relative overflow-hidden rounded-xl border bg-white"
                                        >

                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="preview"
                                                className="h-24 sm:h-28 w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                            >
                                                <X size={14} />
                                            </button>

                                            <div className="flex items-center gap-2 p-2 text-xs">

                                                <ImageIcon size={14} />

                                                <span className="truncate">
                                                    {file.name}
                                                </span>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        )}

                    </div>

                    {/* Footer */}
                    <div className="border-t bg-white p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 flex-shrink-0">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="w-full sm:w-auto rounded-xl border px-6 py-3 hover:bg-slate-100 font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleSubmit}
                            className="w-full sm:w-auto rounded-xl bg-orange-600 px-6 py-3 text-white hover:bg-orange-700 disabled:opacity-50 font-semibold"
                        >
                            {loading
                                ? "Submitting..."
                                : "Submit Return Request"}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}