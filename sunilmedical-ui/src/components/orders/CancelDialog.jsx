import { AlertTriangle } from "lucide-react";

export default function CancelDialog({
    open,
    order,
    loading,
    onClose,
    onConfirm
}) {

    if (!open || !order)
        return null;

    return (

        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

                <div className="flex justify-center">

                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">

                        <AlertTriangle
                            size={42}
                            className="text-red-600"
                        />

                    </div>

                </div>

                <h2 className="text-2xl font-bold text-center mt-6">

                    Cancel Order?

                </h2>

                <p className="text-gray-500 text-center mt-3">

                    Are you sure you want to cancel

                    <br />

                    <strong>{order.orderNumber}</strong>?

                </p>

                <div className="mt-8 flex gap-4">

                    <button

                        onClick={onClose}

                        className="
flex-1
h-12
rounded-xl
border
hover:bg-gray-100
"

                    >

                        No

                    </button>

                    <button

                        disabled={loading}

                        onClick={() => onConfirm(order)}

                        className="
flex-1
h-12
rounded-xl
bg-red-600
hover:bg-red-700
text-white
font-semibold
"

                    >

                        {loading
                            ? "Cancelling..."
                            : "Yes, Cancel"}

                    </button>

                </div>

            </div>

        </div>

    );

}