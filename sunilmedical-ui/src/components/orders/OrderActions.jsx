import {
    Download,
    RotateCcw,
    ShoppingCart,
    Phone,
    XCircle,
    Truck
} from "lucide-react";

export default function OrderActions({

    order,

    onCancel,

    onReturn,

    onInvoice,

    onTrack,

    onBuyAgain,

    onHelp

}) {

    const status = order?.orderStatus;

    const canCancel =
        status === "Placed" ||
        status === "Packed";

    const canTrack =
        status !== "Cancelled";

    const canReturn =
        status === "Delivered" &&
        order?.isReturnEligible &&
        order?.returnStatus !== "Requested";

    const canBuyAgain =
        order?.items?.length > 0;

    return (

        <div className="flex flex-wrap gap-3">

            {order?.orderStatus === "Delivered" &&
                order?.paymentStatus === "Completed" && (

                    <button
                        onClick={() => onInvoice(order)}
                        className="
            flex
            items-center
            gap-3
            px-5
            py-3
            rounded-2xl
            border
            border-green-200
            bg-green-50
            hover:bg-green-100
            transition
            shadow-sm
            hover:shadow-md
        "
                    >

                        <div className="
            w-10
            h-10
            rounded-full
            bg-green-600
            flex
            items-center
            justify-center
            text-white
        ">
                            <Download size={18} />
                        </div>

                        <div className="text-left">

                            <div className="font-semibold text-green-700">
                                Download Tax Invoice
                            </div>

                            <div className="text-xs text-gray-500">
                                Available after successful delivery
                            </div>

                        </div>

                    </button>

                )}

            {/* Cancel */}

            {

                canCancel && (

                    <button

                        onClick={() => onCancel(order)}

                        className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"

                    >

                        <XCircle size={18} />

                        Cancel Order

                    </button>

                )

            }

            {/* Return */}

            {

                canReturn && (

                    <button

                        onClick={() => onReturn(order)}

                        className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"

                    >

                        <RotateCcw size={18} />

                        Return Order

                    </button>

                )

            }

            {/* Return Requested */}

            {

                order?.returnStatus === "Requested" && (

                    <div className="h-11 px-5 rounded-xl bg-yellow-100 text-yellow-700 flex items-center">

                        Return Requested

                    </div>

                )

            }

            {/* Help */}

            <button

                onClick={onHelp}

                className="h-11 px-5 rounded-xl border hover:bg-gray-100 flex items-center gap-2"

            >

                <Phone size={18} />

                Need Help

            </button>

        </div>

    );

}