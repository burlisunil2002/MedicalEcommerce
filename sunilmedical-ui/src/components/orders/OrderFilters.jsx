import {
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Clock3
} from "lucide-react";

export default function OrderFilters({

    selected,

    onChange

}) {

    const filters = [

        {
            key: "All",
            label: "All Orders",
            icon: Package
        },

        {
            key: "Active",
            label: "Active",
            icon: Truck
        },

        {
            key: "Delivered",
            label: "Delivered",
            icon: CheckCircle2
        },

        {
            key: "Cancelled",
            label: "Cancelled",
            icon: XCircle
        },

        {
            key: "Returns",
            label: "Returns",
            icon: RotateCcw
        },

        {
            key: "Pending",
            label: "Pending",
            icon: Clock3
        }

    ];

    return (

        <div className="flex flex-wrap gap-3 mt-8">

            {

                filters.map(filter => {

                    const Icon = filter.icon;

                    const active = selected === filter.key;

                    return (

                        <button

                            key={filter.key}

                            onClick={() => onChange(filter.key)}

                            className={`

                                flex items-center gap-2

                                px-5 py-3

                                rounded-full

                                transition-all

                                font-medium

                                border

                                ${active

                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg"

                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"

                                }

                            `}

                        >

                            <Icon size={18} />

                            {filter.label}

                        </button>

                    );

                })

            }

        </div>

    );

}