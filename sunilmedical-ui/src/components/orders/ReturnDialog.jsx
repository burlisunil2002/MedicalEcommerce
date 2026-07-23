import { useEffect, useState } from "react";
import {
    RotateCcw,
    Upload,
    X,
    Image as ImageIcon
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

    useEffect(() => {

        if (!open) {

            setReason("");

            setRemarks("");

            setFiles([]);

        }

    }, [open]);

    if (!open) return null;

    function addFiles(e) {

        const selected = Array.from(e.target.files || []);

        setFiles(prev => [...prev, ...selected]);

    }

    function removeFile(index) {

        setFiles(prev => prev.filter((_, i) => i !== index));

    }

    function handleSubmit() {

        if (!reason) {

            alert("Please select a return reason.");

            return;

        }

        onSubmit({

            reason,

            remarks,

            files

        });

    }

    return (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">

            <div className="min-h-screen flex items-center justify-center p-4">

                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}

                <div className="flex items-center justify-between border-b p-6">

                    <div className="flex items-center gap-3">

                        <RotateCcw
                            className="text-orange-500"
                            size={28}
                        />

                        <h2 className="text-2xl font-bold">

                            Request Return

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

                    <div className="flex-1 overflow-y-auto space-y-6 p-6">
                    {/* Reason */}

                    <div>

                        <label className="mb-2 block font-medium">

                            Return Reason

                        </label>

                        <select

                            value={reason}

                            onChange={(e) => setReason(e.target.value)}

                            className="w-full rounded-xl border p-3"

                        >

                            <option value="">

                                Select Reason

                            </option>

                            {
                                reasons.map(reason => (

                                    <option
                                        key={reason}
                                        value={reason}
                                    >
                                        {reason}
                                    </option>

                                ))
                            }

                        </select>

                    </div>

                    {/* Remarks */}

                    <div>

                        <label className="mb-2 block font-medium">

                            Additional Remarks

                        </label>

                        <textarea

                            rows={4}

                            value={remarks}

                            onChange={(e) => setRemarks(e.target.value)}

                            className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"

                            placeholder="Describe the issue in detail..."

                        />

                    </div>

                    {/* Upload Images */}

                    <div>

                        <label className="mb-3 block font-medium">

                            Upload Supporting Images

                        </label>

                        <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 transition hover:border-blue-500 hover:bg-blue-50">

                            <div className="text-center">

                                <Upload
                                    className="mx-auto text-blue-600"
                                    size={34}
                                />

                                <p className="mt-3 font-medium">

                                    Click to upload images

                                </p>

                                <p className="mt-1 text-sm text-slate-500">

                                    JPG, PNG, JPEG

                                </p>

                            </div>

                            <input

                                type="file"

                                multiple

                                accept="image/*"

                                hidden

                                onChange={addFiles}

                            />

                        </label>

                    </div>

                    {/* Image Preview */}

                    {

                        files.length > 0 && (

                            <div>

                                <h4 className="mb-4 font-semibold">

                                    Selected Images

                                </h4>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

                                    {

                                        files.map((file, index) => (

                                            <div

                                                key={index}

                                                className="relative rounded-xl overflow-hidden border"

                                            >

                                                <img

                                                    src={URL.createObjectURL(file)}

                                                    alt="preview"

                                                    className="h-24 md:h-28 w-full object-cover"
                                                />

                                                <button

                                                    onClick={() => removeFile(index)}

                                                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white"

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

                                        ))

                                    }

                                </div>

                            </div>

                        )

                    }

                </div>

                {/* Footer */}

                    <div className="border-t bg-white p-6 flex justify-end gap-3 flex-shrink-0">
                    <button

                        onClick={onClose}

                        className="rounded-xl border px-6 py-3 hover:bg-slate-100"

                    >

                        Cancel

                    </button>

                    <button

                        disabled={loading}

                        onClick={handleSubmit}

                        className="rounded-xl bg-orange-600 px-6 py-3 text-white hover:bg-orange-700 disabled:opacity-50"

                    >

                        {

                            loading

                                ? "Submitting..."

                                : "Submit Return Request"

                        }

                    </button>

                </div>

            </div>

            </div>
        </div>


    );

}

