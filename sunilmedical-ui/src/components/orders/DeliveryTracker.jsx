import {
    CheckCircle,
    Package,
    Truck,
    Bike,
    Home,
    XCircle,
    AlertTriangle
} from "lucide-react";


const steps = [
    {
        key: "Placed",
        label: "Placed",
        icon: CheckCircle
    },
    {
        key: "Packed",
        label: "Packed",
        icon: Package
    },
    {
        key: "Shipped",
        label: "Shipped",
        icon: Truck
    },
    {
        key: "OutForDelivery",
        label: "Out For Delivery",
        icon: Bike
    },
    {
        key: "Delivered",
        label: "Delivered",
        icon: Home
    }
];

export default function DeliveryTracker({
    status,
    paymentStatus,
    orderDate,
    modifiedDate,
    onCancelOrder,
    cancelling
}) {


    const currentIndex = steps.findIndex(
        s =>
            s.key.toLowerCase() ===
            (status ?? "")
                .replace(/\s/g, "")
                .toLowerCase()
    );


    // Cancelled Order
    if (status === "Cancelled") {

        return (

            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">

                <div className="flex flex-col items-center">

                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">

                        <XCircle
                            size={42}
                            className="text-red-600"
                        />

                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-red-700">

                        Order Cancelled

                    </h2>

                    <p className="mt-2 text-gray-600">

                        This order has been cancelled successfully.

                    </p>

                </div>

            </div>

        );

    }

    return (

        <div className="mt-8 rounded-3xl border bg-white shadow-sm p-6">

            {/* Heading */}

            <div className="flex justify-between items-center mb-8">

                <div>

                    <h2 className="text-xl font-bold">

                        Delivery Status

                    </h2>

                    <p className="text-sm text-gray-500">

                        Your order is on the way.

                    </p>

                </div>

                <div className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">

                    {status}

                </div>

            </div>

            <div className="relative">

                {/* Background Line */}

                <div className="absolute left-6 right-6 top-5 h-1 rounded-full bg-gray-200" />

                {/* Progress */}

                <div

                    className="absolute left-6 top-5 h-1 rounded-full bg-green-500 transition-all duration-700"

                    style={{
                        width:
                            currentIndex <= 0
                                ? "0%"
                                : `${(currentIndex / (steps.length - 1)) * 100}%`
                    }}

                />

                {/* Moving Truck */}

                {

                    currentIndex >= 0 && (

                        <div
                            className="absolute -top-6 transition-all duration-700 text-3xl"
                            style={{
                                left: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 18px)`
                            }}
                        >

                            <span
                                className="inline-block"
                                style={{
                                    transform: "scaleX(-1)" // Reverse Direction
                                }}
                            >
                                🚚
                            </span>

                        </div>

                    )

                }

                {/* Steps */}

                <div className="flex justify-between relative">

                    {

                        steps.map((step, index) => {

                            const Icon = step.icon;

                            const active =
                                index <= currentIndex;

                            return (

                                <div
                                    key={step.key}
                                    className="flex flex-col items-center flex-1"
                                >

                                    <div

                                        className={`
w-12
h-12
rounded-full
flex
items-center
justify-center
transition-all
duration-500
shadow-md

${active
                                                ? "bg-green-600 text-white scale-110"
                                                : "bg-gray-200 text-gray-500"
                                            }

`}

                                    >

                                        <Icon size={22} />

                                    </div>

                                    <span

                                        className={`
mt-3
text-xs
font-medium
text-center

${active
                                                ? "text-green-700"
                                                : "text-gray-500"
                                            }

`}

                                    >

                                        {step.label}

                                    </span>

                                    <span className="text-[10px] text-gray-500 mt-1">

                                        {
                                            step.key === status

                                                ? new Date(modifiedDate).toLocaleString("en-IN", {

                                                    day: "2-digit",

                                                    month: "short",

                                                    year: "numeric",

                                                    hour: "2-digit",

                                                    minute: "2-digit"

                                                })

                                                : "--"

                                        }

                                    </span>

                                </div>

                            );

                        })

                    }

                </div>

            </div>

            {/* Bottom Message */}

            {status === "Cancelled" && paymentStatus === "Completed" && (

                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">

                    <div className="flex gap-3">

                        <AlertTriangle className="text-orange-500" />

                        <div>

                            <div className="font-semibold text-orange-700">
                                Refund Information
                            </div>

                            <p className="text-sm text-gray-700 mt-2">

                                Your order has been cancelled successfully.

                                Since this order was paid online, your refund has been initiated.

                                The refunded amount will be credited to your original payment method within

                                <strong> 2 business days.</strong>

                            </p>

                        </div>

                    </div>

                </div>

            )}

            {(status === "Shipped" ||
                status === "OutForDelivery" ||
                status === "Delivered") && (

                    <div className="mt-5 rounded-xl bg-gray-100 border p-4 text-center text-gray-600">

                        Cancellation is no longer available once the order has been shipped.

                    </div>

                )}                
                
        </div>


    );

}