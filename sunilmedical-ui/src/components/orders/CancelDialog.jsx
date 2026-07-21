import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const reasons = [
    "Ordered by mistake",
    "Found a better price",
    "Delivery is taking too long",
    "Need to change shipping address",
    "No longer needed",
    "Other"
];

export default function CancelDialog({

    open,

    loading,

    onClose,

    onConfirm

}) {

    const [reason, setReason] = useState("");

    const [remarks, setRemarks] = useState("");

    if (!open) return null;

    function handleSubmit() {

        if (!reason) {

            alert("Please select a cancellation reason.");

            return;

        }

        onConfirm({

            reason,

            remarks

        });

    }

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b p-6">

                    <div className="flex items-center gap-3">

                        <AlertTriangle
                            className="text-red-500"
                            size={28}
                        />

                        <h2 className="text-2xl font-bold">

                            Cancel Order

                        </h2>

                    </div>

                    <button

                        onClick={onClose}

                        className="rounded-full p-2 hover:bg-slate-100"

                    >

                        <X size={22} />

                    </button>

                </div>

                {/* Body */}

                <div className="space-y-6 p-6">

                    <div>

                        <label className="mb-2 block font-medium">

                            Cancellation Reason

                        </label>

                        <select

                            value={reason}

                            onChange={(e) => setReason(e.target.value)}

                            className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"

                        >

                            <option value="">

                                Select Reason

                            </option>

                            {

                                reasons.map(x => (

                                    <option

                                        key={x}

                                        value={x}

                                    >

                                        {x}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    <div>

                        <label className="mb-2 block font-medium">

                            Additional Remarks

                        </label>

                        <textarea

                            rows={4}

                            value={remarks}

                            onChange={(e) => setRemarks(e.target.value)}

                            className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"

                            placeholder="Optional..."

                        />

                    </div>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-3 border-t p-6">

                    <button

                        onClick={onClose}

                        className="rounded-xl border px-6 py-3 hover:bg-slate-50"

                    >

                        Close

                    </button>

                    <button

                        disabled={loading}

                        onClick={handleSubmit}

                        className="rounded-xl bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:opacity-50"

                    >

                        {

                            loading

                                ? "Cancelling..."

                                : "Cancel Order"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}