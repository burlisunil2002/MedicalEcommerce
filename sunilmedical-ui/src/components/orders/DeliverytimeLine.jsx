import {
    ShoppingBag,
    Package,
    Truck,
    MapPin,
    CheckCircle2
} from "lucide-react";

export default function DeliveryTimeline({ item }) {

    const status = item.itemStatus;

    const steps = [

        {
            title: "Ordered",
            icon: ShoppingBag,
            completed: true,
            date: item.orderDate
        },

        {
            title: "Packed",
            icon: Package,
            completed: [
                "Packed",
                "Shipped",
                "OutForDelivery",
                "Delivered"
            ].includes(status),
            date: item.packedDate
        },

        {
            title: "Shipped",
            icon: Truck,
            completed: [
                "Shipped",
                "OutForDelivery",
                "Delivered"
            ].includes(status),
            date: item.shippedDate
        },

        {
            title: "Out For Delivery",
            icon: MapPin,
            completed: [
                "OutForDelivery",
                "Delivered"
            ].includes(status),
            date: item.outForDeliveryDate
        },

        {
            title: "Delivered",
            icon: CheckCircle2,
            completed: status === "Delivered",
            date: item.deliveredDate
        }

    ];

    const completedCount = steps.filter(x => x.completed).length;

    const progressWidth =
        ((completedCount - 1) / (steps.length - 1)) * 100;

    return (

        <div>

            <h4 className="font-semibold text-slate-800 mb-6">

                Delivery Progress

            </h4>

            <div className="relative">

                {/* Background Line */}

                <div className="absolute top-6 left-0 right-0 h-1 rounded-full bg-slate-200"></div>

                {/* Completed Line */}

                <div
                    className="absolute top-6 left-0 h-1 rounded-full bg-green-600 transition-all duration-700"
                    style={{
                        width: `${progressWidth}%`
                    }}
                />

                <div className="relative flex justify-between">

                    {steps.map((step, index) => {

                        const Icon = step.icon;

                        return (

                            <div
                                key={index}
                                className="flex flex-col items-center flex-1"
                            >

                                <div
                                    className={`
                                        h-12
                                        w-12
                                        rounded-full
                                        border-2
                                        flex
                                        items-center
                                        justify-center
                                        transition-all
                                        duration-300

                                        ${step.completed
                                            ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                                            : "bg-white border-slate-300 text-slate-400"
                                        }
                                    `}
                                >

                                    <Icon size={20} />

                                </div>

                                <p
                                    className={`
                                        mt-3
                                        text-xs
                                        font-semibold
                                        text-center

                                        ${step.completed
                                            ? "text-green-700"
                                            : "text-slate-500"
                                        }
                                    `}
                                >

                                    {step.title}

                                </p>

                                <p className="mt-1 text-[11px] text-center text-slate-500">

                                    {step.date
                                        ? new Date(step.date).toLocaleString()
                                        : step.completed
                                            ? "Completed"
                                            : "-"}

                                </p>

                            </div>

                        );

                    })}

                </div>

            </div>

        </div>

    );

}