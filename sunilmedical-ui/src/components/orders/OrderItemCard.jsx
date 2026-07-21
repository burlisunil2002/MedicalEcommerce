import {
    Truck,
    Package,
    RotateCcw,
    Star,
    XCircle,
    ShoppingCart,
    Eye,
    MapPinned,
    CheckCircle2
} from "lucide-react";

import DeliveryTimeline from "./DeliveryTimeline";

export default function OrderItemCard({

    order,

    item,

    overallStatus,

    onTrack,

    onCancel,

    onReturn,

    onReview,

    onBuyAgain

}) {

    //----------------------------------------------------------
    // Status Badge
    //----------------------------------------------------------

    const getStatusStyle = () => {

        switch (item.itemStatus) {

            case "Pending":
                return "bg-yellow-100 text-yellow-700";

            case "Packed":
                return "bg-indigo-100 text-indigo-700";

            case "Shipped":
                return "bg-blue-100 text-blue-700";

            case "OutForDelivery":
                return "bg-orange-100 text-orange-700";

            case "Delivered":
                return "bg-green-100 text-green-700";

            case "Cancelled":
                return "bg-red-100 text-red-700";

            case "ReturnRequested":
                return "bg-purple-100 text-purple-700";

            case "Returned":
                return "bg-slate-200 text-slate-700";

            default:
                return "bg-slate-100 text-slate-700";

        }

    };

    //----------------------------------------------------------
    // ACTION VISIBILITY
    //----------------------------------------------------------

    const canCancel =
        item.itemStatus === "Placed" ||
        item.itemStatus === "Accepted" ||
        item.itemStatus === "Packed";

    const canTrack =
        item.itemStatus !== "Pending" &&
        item.itemStatus !== "Cancelled";

    const canReturn =
        item.itemStatus === "Delivered" &&
        item.isReturnEligible &&
        item.returnStatus === "None" &&
        item.remainingReturnDays > 0;

    const canReview =
        item.itemStatus === "Delivered";

    const canBuyAgain =
        item.itemStatus === "Delivered" ||
        item.itemStatus === "Cancelled" ||
        item.itemStatus === "Returned";

    //----------------------------------------------------------

    return (

        <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">

            <div className="p-5">

                <div className="grid lg:grid-cols-[120px_1fr_auto] gap-6">

                    {/*=====================================
                            PRODUCT IMAGE
                    =====================================*/}

                    <div className="flex justify-center">

                        <img

                            src={
                                item.productImage ||
                                "/images/no-image.png"
                            }

                            alt={item.productName}

                            className="h-28 w-28 rounded-xl border object-contain bg-white p-2"

                        />

                    </div>

                    {/*=====================================
                            PRODUCT DETAILS
                    =====================================*/}

                    <div>

                        <div className="flex flex-wrap items-start justify-between gap-3">

                            <div>

                                <h3 className="text-lg font-semibold text-slate-800">

                                    {item.productName}

                                </h3>

                                {item.variantName && (

                                    <p className="mt-1 text-sm text-slate-500">

                                        {item.variantName}

                                    </p>

                                )}

                            </div>

                            <span
                                className={`
                                    px-3
                                    py-1
                                    rounded-full
                                    text-xs
                                    font-semibold
                                    ${getStatusStyle()}
                                `}
                            >
                                {item.itemStatus}
                            </span>

                        </div>

                        {/* PRICE */}

                        <div className="mt-4 flex flex-wrap gap-8">

                            <div>

                                <p className="text-xs text-slate-500">

                                    Price

                                </p>

                                <h4 className="font-bold text-slate-800">

                                    ₹{Number(item.price).toLocaleString()}

                                </h4>

                            </div>

                            <div>

                                <p className="text-xs text-slate-500">

                                    Quantity

                                </p>

                                <h4 className="font-bold text-slate-800">

                                    {item.quantity}

                                </h4>

                            </div>

                            <div>

                                <p className="text-xs text-slate-500">

                                    Total

                                </p>

                                <h4 className="font-bold text-green-600">

                                    ₹{Number(item.itemTotal).toLocaleString()}

                                </h4>

                            </div>

                        </div>

                    </div>

                    {/*=====================================
                            QUICK STATUS
                    =====================================*/}

                    <div className="flex lg:flex-col gap-3 justify-center">

                        {item.itemStatus === "Delivered" && (

                            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">

                                <CheckCircle2
                                    size={18}
                                    className="text-green-600"
                                />

                                <span className="text-sm font-medium text-green-700">

                                    Delivered

                                </span>

                            </div>

                        )}

                        {item.itemStatus === "OutForDelivery" && (

                            <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3">

                                <Truck
                                    size={18}
                                    className="text-orange-600"
                                />

                                <span className="text-sm font-medium text-orange-700">

                                    Out For Delivery

                                </span>

                            </div>

                        )}

                        {item.itemStatus === "Shipped" && (

                            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">

                                <Package
                                    size={18}
                                    className="text-blue-600"
                                />

                                <span className="text-sm font-medium text-blue-700">

                                    Shipped

                                </span>

                            </div>

                        )}

                    </div>

                </div>
                {/*=====================================
                        DELIVERY TIMELINE
                =====================================*/}

                <div className="mt-6 border-t pt-6">

                    <DeliveryTimeline item={item} />

                </div>

                {/*=====================================
                        TRACKING INFORMATION
                =====================================*/}

                {(item.trackingNumber || item.courierPartner) && (

                    <div className="mt-6 rounded-2xl border bg-slate-50 p-5">

                        <div className="flex flex-wrap gap-8">

                            {item.courierPartner && (

                                <div>

                                    <p className="text-xs uppercase tracking-wide text-slate-500">

                                        Courier Partner

                                    </p>

                                    <p className="mt-1 font-semibold text-slate-800">

                                        {item.courierPartner}

                                    </p>

                                </div>

                            )}

                            {item.trackingNumber && (

                                <div>

                                    <p className="text-xs uppercase tracking-wide text-slate-500">

                                        Tracking Number

                                    </p>

                                    <p className="mt-1 font-semibold text-slate-800">

                                        {item.trackingNumber}

                                    </p>

                                </div>

                            )}

                        </div>

                    </div>

                )}

                {/*=====================================
                        ACTION BUTTONS
                =====================================*/}

                <div className="mt-6 flex flex-wrap gap-3">

                    {canCancel && (

                        <button
                            onClick={() => onCancel(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-5 py-3 font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <XCircle size={18} />
                            Cancel
                        </button>

                    )}

                    {canReturn && (

                        <button
                            onClick={() => onReturn(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-orange-300 px-5 py-3 font-medium text-orange-600 transition hover:bg-orange-50"
                        >
                            <RotateCcw size={18} />
                            Return
                        </button>

                    )}

                    {canReview && (

                        <button
                            onClick={() => onReview(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-yellow-300 px-5 py-3 font-medium text-yellow-700 transition hover:bg-yellow-50"
                        >
                            <Star size={18} />
                            Review
                        </button>

                    )}

                    {item.returnStatus && item.returnStatus !== "None" && (

                        <button
                            className="inline-flex items-center gap-2 rounded-xl border border-purple-300 px-5 py-3 font-medium text-purple-700 transition hover:bg-purple-50"
                        >
                            <Eye size={18} />
                            View Return
                        </button>

                    )}

                </div>

                {/*=====================================
                        RETURN DETAILS
                =====================================*/}

                {item.returnStatus &&
                    item.returnStatus !== "None" && (

                        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">

                            <div className="flex items-center gap-2">

                                <MapPinned
                                    size={20}
                                    className="text-purple-600"
                                />

                                <h4 className="font-semibold text-purple-800">

                                    Return Details

                                </h4>

                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">

                                <div>

                                    <p className="text-xs text-purple-600">

                                        Status

                                    </p>

                                    <p className="font-medium">

                                        {item.returnStatus}

                                    </p>

                                </div>

                                {item.returnReason && (

                                    <div>

                                        <p className="text-xs text-purple-600">

                                            Reason

                                        </p>

                                        <p className="font-medium">

                                            {item.returnReason}

                                        </p>

                                    </div>

                                )}

                                {item.returnRequestedDate && (

                                    <div>

                                        <p className="text-xs text-purple-600">

                                            Requested On

                                        </p>

                                        <p className="font-medium">

                                            {new Date(
                                                item.returnRequestedDate
                                            ).toLocaleDateString()}

                                        </p>

                                    </div>

                                )}

                                {item.refundAmount > 0 && (

                                    <div>

                                        <p className="text-xs text-purple-600">

                                            Refund Amount

                                        </p>

                                        <p className="font-bold text-green-700">

                                            ₹{Number(item.refundAmount).toLocaleString()}

                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    )}

            </div>

        </div>

    );

}