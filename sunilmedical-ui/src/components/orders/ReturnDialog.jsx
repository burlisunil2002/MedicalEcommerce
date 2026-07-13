import { useState } from "react";

import {
    RotateCcw,
    UploadCloud
} from "lucide-react";

const reasons = [

    "Wrong Product Received",

    "Damaged Product",

    "Defective Product",

    "Missing Parts",

    "Quality Not Good",

    "Ordered By Mistake",

    "Not As Described",

    "Better Price Available",

    "Other"

];

export default function ReturnDialog({

    open,

    order,

    loading,

    onClose,

    onSubmit

}) {

    const [reason, setReason] =
        useState("");

    const [remarks, setRemarks] =
        useState("");

    const [files, setFiles] =
        useState([]);

    if (!open || !order)
        return null;

    return (

        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">

            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8">

                <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">

                        <RotateCcw
                            size={32}
                            className="text-purple-700"
                        />

                    </div>

                    <div>

                        <h2 className="text-2xl font-bold">

                            Return Order

                        </h2>

                        <p className="text-gray-500">

                            {order.orderNumber}

                        </p>

                    </div>

                </div>

                {/* Reason */}

                <div className="mt-8">

                    <label className="font-semibold">

                        Return Reason

                    </label>

                    <select

                        value={reason}

                        onChange={(e) =>

                            setReason(e.target.value)

                        }

                        className="w-full mt-2 h-12 rounded-xl border px-4"

                    >

                        <option value="">

                            Select Reason

                        </option>

                        {

                            reasons.map(r => (

                                <option key={r}>

                                    {r}

                                </option>

                            ))

                        }

                    </select>

                </div>

                {/* Remarks */}

                <div className="mt-5">

                    <label className="font-semibold">

                        Remarks

                    </label>

                    <textarea

                        rows={4}

                        value={remarks}

                        onChange={(e) =>

                            setRemarks(e.target.value)

                        }

                        className="w-full mt-2 rounded-xl border p-4"

                    />

                </div>

                {/* Upload */}

                <div className="mt-5">

                    <label className="font-semibold">

                        Upload Images (Optional)

                    </label>

                    <label className="
mt-3
border-2
border-dashed
rounded-2xl
p-8
flex
flex-col
items-center
cursor-pointer
hover:bg-gray-50
">

                        <UploadCloud
                            size={40}
                        />

                        <span className="mt-3">

                            Click to Upload

                        </span>

                        <input

                            type="file"

                            multiple

                            hidden

                            onChange={(e) =>

                                setFiles([...e.target.files])

                            }

                        />

                    </label>

                    {

                        files.length > 0 && (

                            <div className="mt-3 text-sm text-gray-500">

                                {files.length}

                                file(s) selected

                            </div>

                        )

                    }

                </div>

                {/* Buttons */}

                <div className="mt-8 flex gap-4">

                    <button

                        onClick={onClose}

                        className="
flex-1
h-12
rounded-xl
border
"

                    >

                        Cancel

                    </button>

                    <button

                        disabled={!reason || loading}

                        onClick={() =>

                            onSubmit({

                                order,

                                reason,

                                remarks,

                                files

                            })

                        }

                        className="
flex-1
h-12
rounded-xl
bg-purple-600
hover:bg-purple-700
text-white
"

                    >

                        {

                            loading

                                ?

                                "Submitting..."

                                :

                                "Submit Return"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}