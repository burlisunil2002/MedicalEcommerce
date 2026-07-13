import {
    Calendar,
    CreditCard,
    PackageCheck,
    Receipt
} from "lucide-react";

import OrderItemCard from "./OrderItemCard";
import OrderActions from "./OrderActions";
import DeliveryTracker from "./DeliveryTracker";

export default function OrderCard({

    order,

    onCancel,

    onReturn,

    onInvoice,

    onBuyAgain,

    onHelp

}) {

    const statusColor = {

        Placed: "bg-purple-100 text-purple-700",

        Packed: "bg-yellow-100 text-yellow-700",

        Shipped: "bg-blue-100 text-blue-700",

        OutForDelivery: "bg-orange-100 text-orange-700",

        Delivered: "bg-green-100 text-green-700",

        Cancelled: "bg-red-100 text-red-700"

    };

    return (

        <div
            className="
bg-white
rounded-[32px]
shadow-md
border
overflow-hidden
mb-10
"
        >

            {/* ================= HEADER ================= */}

            <div
                className="
border-b
bg-gradient-to-r
from-slate-50
to-white
p-8
"
            >

                <div className="grid lg:grid-cols-5 gap-6">

                    {/* Order */}

                    <div>

                        <div className="text-gray-500 text-sm">

                            Order Number

                        </div>

                        <div className="font-bold text-lg mt-2">

                            {order.orderNumber}

                        </div>

                    </div>

                    {/* Date */}

                    <div>

                        <div className="text-gray-500 text-sm">

                            Ordered On

                        </div>

                        <div className="font-semibold mt-2 flex items-center gap-2">

                            <Calendar size={18} />

                            {new Date(order.orderDate)

                                .toLocaleDateString("en-IN")}

                        </div>

                    </div>

                    {/* Amount */}

                    <div>

                        <div className="text-gray-500 text-sm">

                            Grand Total

                        </div>

                        <div className="font-bold text-xl text-blue-700 mt-2">

                            ₹{order.grandTotal.toLocaleString()}

                        </div>

                    </div>

                    {/* Payment */}

                    <div>

                        <div className="text-gray-500 text-sm">

                            Payment

                        </div>

                        <div className="mt-2">

                            <span
                                className={`
px-4
py-2
rounded-full
text-sm
font-semibold

${order.paymentStatus === "Completed"

                                        ? "bg-green-100 text-green-700"

                                        : "bg-orange-100 text-orange-700"

                                    }
`}
                            >

                                <CreditCard
                                    size={16}
                                    className="inline mr-2"
                                />

                                {order.paymentStatus}

                            </span>

                        </div>

                    </div>

                    {/* Status */}

                    <div>

                        <div className="text-gray-500 text-sm">

                            Order Status

                        </div>

                        <div className="mt-2">

                            <span
                                className={`
px-4
py-2
rounded-full
text-sm
font-semibold

${statusColor[order.orderStatus]}

`}
                            >

                                <PackageCheck
                                    size={16}
                                    className="inline mr-2"
                                />

                                {order.orderStatus}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* ================= PRODUCTS ================= */}

            <div className="p-8">

                <h2 className="font-bold text-xl mb-6">

                    Ordered Products

                </h2>

                <div className="space-y-5">

                    {

                        order.items.map(item => (

                            <OrderItemCard

                                key={`${item.productId}-${item.variantId}`}

                                item={item}

                                orderStatus={order.orderStatus}

                            />

                        ))

                    }


                </div>

            </div>

            {/* ================= TRACKER ================= */}

            <div
                id={`tracker-${order.orderId}`}
                className="px-8 pb-4"
            >

                <DeliveryTracker

                    status={order.orderStatus}

                    paymentStatus={order.paymentStatus}

                    orderDate={order.orderDate}

                    modifiedDate={order.modifiedDate}

                    onCancelOrder={() => onCancel(order)}

                    cancelling={false}

                />

            </div>

            {/* ================= ACTIONS ================= */}

            <div className="px-8 pb-8">

                <OrderActions

                    order={order}

                    onCancel={onCancel}

                    onReturn={onReturn}

                    onInvoice={onInvoice}

                    onBuyAgain={onBuyAgain}

                    onHelp={onHelp}

                />

            </div>

        </div>

    );

}