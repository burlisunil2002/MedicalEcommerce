import {
    CheckCircle,
    Package,
    Truck,
    Bike,
    Home
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

    status

}) {

    const currentIndex =
        steps.findIndex(

            x =>

                x.key.toLowerCase() ===

                status?.replace(/\s/g, "").toLowerCase()

        );

    return (

        <div
            className="
mt-8
mb-6
px-2
"
        >

            <div className="relative">

                {/* Line */}

                <div
                    className="
absolute
top-5
left-10
right-10
h-1
bg-gray-200
rounded-full
"
                />

                {/* Progress */}

                <div

                    className="
absolute
top-5
left-10
h-1
bg-green-500
rounded-full
transition-all
duration-700
"

                    style={{

                        width:

                            `${currentIndex <= 0

                                ?

                                0

                                :

                                currentIndex *

                                25

                            }%`

                    }}

                />

                {/* Moving Vehicle */}

                {

                    currentIndex >= 0 && (

                        <div

                            className="
absolute
-top-2
transition-all
duration-700
"

                            style={{

                                left:

                                    `calc(${currentIndex * 25}% + 20px)`

                            }}

                        >

                            🚚

                        </div>

                    )

                }

                <div
                    className="
flex
justify-between
relative
"
                >

                    {

                        steps.map(

                            (

                                step,

                                index

                            ) => {

                                const Icon =
                                    step.icon;

                                const active =
                                    index <= currentIndex;

                                return (

                                    <div

                                        key={step.key}

                                        className="
flex
flex-col
items-center
w-20
text-center
"

                                    >

                                        <div

                                            className={`

w-10

h-10

rounded-full

flex

items-center

justify-center

transition-all

duration-300

${active

                                                    ?

                                                    "bg-green-600 text-white"

                                                    :

                                                    "bg-gray-200 text-gray-500"

                                                }

`}

                                        >

                                            <Icon size={18} />

                                        </div>

                                        <span

                                            className="
text-xs
mt-2
font-medium
"

                                        >

                                            {step.label}

                                        </span>

                                    </div>

                                );

                            }

                        )

                    }

                </div>

            </div>

        </div>

    );

}