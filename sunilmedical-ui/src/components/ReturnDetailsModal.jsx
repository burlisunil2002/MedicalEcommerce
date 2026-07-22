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

        if (returnData) {

            setStatus(returnData.status);

            setRefundAmount(returnData.refundAmount || "");

            setRemarks("");

        }

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

                    refundAmount: refundAmount
                        ? Number(refundAmount)
                        : null

                }

            );

            alert("Return updated successfully.");

            onSuccess();

            onClose();

        }

        catch (err) {

            console.log(err);

            alert("Unable to update return.");

        }

        finally {

            setSaving(false);

        }

    }

    return (

        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">

            <div className="min-h-screen flex items-start justify-center p-4 md:p-8">

                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">

                    <h2 className="text-xl font-bold">

                        Return Request Details

                    </h2>

                    <button onClick={onClose}>

                        <X />

                    </button>

                </div>

                {/* Body */}

                <div className="p-6">

                    {/* Product */}

                    <div className="grid lg:grid-cols-2 gap-8">

                        <div>

                            <h3 className="font-semibold mb-4">

                                Product Details

                            </h3>

                            <img

                                src={returnData.productImage}

                                alt=""

                                className="w-40 h-40 rounded-lg border object-cover"

                            />

                            <div className="mt-4 space-y-2">

                                <p>

                                    <strong>Product :</strong>

                                    {returnData.productName}

                                </p>

                                <p>

                                    <strong>Variant :</strong>

                                    {returnData.variantName}

                                </p>

                                <p>

                                    <strong>Quantity :</strong>

                                    {returnData.quantity}

                                </p>

                            </div>

                        </div>

                        {/* Customer */}

                        <div>

                            <h3 className="font-semibold mb-4">

                                Customer Details

                            </h3>

                            <div className="space-y-2">

                                <p>

                                    <strong>Name :</strong>

                                    {returnData.customerName}

                                </p>

                                <p>

                                    <strong>Mobile :</strong>

                                    {returnData.mobileNumber}

                                </p>

                                <p>

                                    <strong>Address :</strong>

                                </p>

                                <div className="text-gray-600">

                                    {returnData.address?.addressLine1}

                                    <br />

                                    {returnData.address?.addressLine2}

                                    <br />

                                    {returnData.address?.city}

                                    {" "}

                                    {returnData.address?.state}

                                    {" - "}

                                    {returnData.address?.pincode}

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Reason */}

                    <div className="mt-8">

                        <h3 className="font-semibold mb-3">

                            Return Reason

                        </h3>

                        <div className="bg-gray-100 rounded-lg p-4">

                            {returnData.reason}

                        </div>

                    </div>

                    {/* Remarks */}

                    <div className="mt-5">

                        <h3 className="font-semibold mb-3">

                            Customer Remarks

                        </h3>

                        <div className="bg-gray-100 rounded-lg p-4">

                            {returnData.remarks}

                        </div>

                    </div>

                    {/* Images */}

                    <div className="mt-8">

                        <h3 className="font-semibold mb-3">

                            Uploaded Images

                        </h3>

                        <div className="flex gap-4">

                            {[

                                returnData.image1,

                                returnData.image2,

                                returnData.image3

                            ]

                                .filter(Boolean)

                                .map((img, index) => (

                                    <img

                                        key={index}

                                        src={img}

                                        alt=""

                                        className="w-28 h-28 object-cover rounded-lg border cursor-pointer hover:scale-105 transition"

                                    />

                                ))}

                        </div>

                    </div>

                    {/* Status */}

                    <div className="grid lg:grid-cols-2 gap-6 mt-8">

                        <div>

                            <label className="block mb-2 font-medium">

                                Return Status

                            </label>

                            <select

                                value={status}

                                onChange={(e) =>

                                    setStatus(e.target.value)

                                }

                                className="border rounded-lg w-full p-3"

                            >

                                <option>Requested</option>

                                <option>Approved</option>

                                <option>Rejected</option>

                                <option>PickupScheduled</option>

                                <option>PickedUp</option>

                                <option>RefundInitiated</option>

                                <option>RefundCompleted</option>

                            </select>

                        </div>

                        <div>

                            <label className="block mb-2 font-medium">

                                Refund Amount

                            </label>

                            <input

                                value={refundAmount}

                                onChange={(e) =>

                                    setRefundAmount(e.target.value)

                                }

                                className="border rounded-lg w-full p-3"

                            />

                        </div>

                    </div>

                    {/* Admin Remarks */}

                    <div className="mt-6">

                        <label className="block mb-2 font-medium">

                            Remarks

                        </label>

                        <textarea

                            rows={4}

                            value={remarks}

                            onChange={(e) =>

                                setRemarks(e.target.value)

                            }

                            className="border rounded-lg w-full p-3"

                        />

                    </div>

                </div>

                {/* Footer */}

                <div className="border-t p-5 flex justify-end gap-3">

                    <button

                        onClick={onClose}

                        className="px-6 py-2 border rounded-lg"

                    >

                        Cancel

                    </button>

                    <button

                        onClick={saveReturn}

                        disabled={saving}

                        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"

                    >

                        {

                            saving

                                ?

                                "Saving..."

                                :

                                "Save Changes"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}