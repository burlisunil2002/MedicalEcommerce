import { useState } from "react";

import {
    ChevronDown,
    ChevronUp,
    Calendar,
    Receipt,
    PackageCheck,
    CircleDollarSign,
    MapPin,
    Phone,
    User,
    LifeBuoy
} from "lucide-react";

import OrderItems from "./OrderItems";
import PaymentSummary from "./PaymentSummary";

export default function OrderCard({

    order,

    overallStatus,

    onInvoice,

    onTrack,

    onCancel,

    onReturn,

    onReview,

    onBuyAgain,

    onHelp

}) {

    const [expanded, setExpanded] = useState(true);

    //---------------------------------------------------
    // STATUS BADGE
    //---------------------------------------------------

    const getStatusBadge = () => {

        switch (overallStatus) {

            case "Delivered":

                return "bg-emerald-100 text-emerald-700";

            case "Out For Delivery":

                return "bg-orange-100 text-orange-700";

            case "Shipped":

                return "bg-blue-100 text-blue-700";

            case "Packed":

                return "bg-indigo-100 text-indigo-700";

            case "Cancelled":

                return "bg-red-100 text-red-700";

            default:

                return "bg-amber-100 text-amber-700";

        }

    };

    //---------------------------------------------------

    return (

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

            {/*=================================================
                            HEADER
            =================================================*/}

            <div

                className="cursor-pointer p-6"

                onClick={() => setExpanded(!expanded)}

            >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    {/* LEFT */}

                    <div>

                        <div className="flex items-center gap-3 flex-wrap">

                            <h2 className="text-xl font-bold text-slate-800">

                                {order.orderNumber}

                            </h2>

                            <span

                                className={`

                                    px-3 py-1

                                    rounded-full

                                    text-xs

                                    font-semibold

                                    ${getStatusBadge()}

                                `}

                            >

                                {overallStatus}

                            </span>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">

                            <div className="flex items-center gap-2">

                                <Calendar size={18} />

                                {new Date(order.orderDate)
                                    .toLocaleDateString()}

                            </div>

                            <div className="flex items-center gap-2">

                                <PackageCheck size={18} />

                                {order.itemCount} Items

                            </div>

                            <div className="flex items-center gap-2">

                                <CircleDollarSign size={18} />

                                ₹{order.grandTotal.toLocaleString()}

                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-3 flex-wrap">

                        <button

                            onClick={(e) => {

                                e.stopPropagation();

                                onInvoice(order);

                            }}

                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition"

                        >

                            <Receipt size={18} />

                            Invoice

                        </button>

                        <button

                            onClick={(e) => {

                                e.stopPropagation();

                                onHelp();

                            }}

                            className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-slate-50"

                        >

                            <LifeBuoy size={18} />

                            Help

                        </button>

                        <button

                            className="rounded-full p-3 hover:bg-slate-100"

                        >

                            {

                                expanded

                                    ?

                                    <ChevronUp size={22} />

                                    :

                                    <ChevronDown size={22} />

                            }

                        </button>

                    </div>

                </div>

            </div>

            {/*=================================================
                    EXPANDABLE SECTION
            =================================================*/}

            {

                expanded && (

                    <>

                        {/*=================================================
        DELIVERY ADDRESS
=================================================*/}

                        <div className="border-t px-6 py-5 bg-slate-50">

                            <div className="flex items-center gap-3 mb-5">

                                <MapPin
                                    className="text-blue-600"
                                    size={22}
                                />

                                <h3 className="font-semibold text-lg">

                                    Delivery Address

                                </h3>

                            </div>

                            <div className="grid lg:grid-cols-2 gap-5">

                                {/* Customer */}

                                <div className="rounded-2xl bg-white border border-slate-200 p-5">

                                    <div className="flex items-center gap-2 mb-4">

                                        <User
                                            size={18}
                                            className="text-emerald-600"
                                        />

                                        <span className="font-semibold">

                                            Customer Details

                                        </span>

                                    </div>

                                    <div className="space-y-2">

                                        <p className="font-semibold text-slate-800">

                                            {order.deliveryAddress?.fullName || "-"}

                                        </p>

                                        <p className="text-slate-600 flex items-center gap-2">

                                            <Phone size={16} />

                                            {order.deliveryAddress?.mobileNumber || "-"}

                                        </p>

                                    </div>

                                </div>

                                {/* Address */}

                                <div className="rounded-2xl bg-white border border-slate-200 p-5">

                                    <div className="flex items-center justify-between mb-4">

                                        <span className="font-semibold">

                                            Shipping Address

                                        </span>

                                        {order.deliveryAddress?.addressType && (

                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">

                                                {order.deliveryAddress.addressType}

                                            </span>

                                        )}

                                    </div>

                                    {order.deliveryAddress ? (

                                        <>

                                            <p className="text-slate-700">

                                                {order.deliveryAddress.addressLine1}

                                            </p>

                                            {order.deliveryAddress.addressLine2 && (

                                                <p className="text-slate-700 mt-1">

                                                    {order.deliveryAddress.addressLine2}

                                                </p>

                                            )}

                                            {order.deliveryAddress.landmark && (

                                                <p className="text-slate-500 mt-2">

                                                    <strong>Landmark:</strong>{" "}

                                                    {order.deliveryAddress.landmark}

                                                </p>

                                            )}

                                            <p className="mt-2 text-slate-700">

                                                {order.deliveryAddress.city},

                                                {" "}

                                                {order.deliveryAddress.state}

                                                {" - "}

                                                {order.deliveryAddress.pincode}

                                            </p>

                                        </>

                                    ) : (

                                        <p className="text-slate-500">

                                            Delivery address not available.

                                        </p>

                                    )}

                                </div>

                            </div>

                        </div>
                        

                        {/*=================================================
                                ORDER ITEMS
                        =================================================*/}

                        <div className="px-6 py-6">

                            <div className="flex items-center justify-between mb-6">

                                <div>

                                    <h3 className="text-xl font-bold text-slate-800">

                                        Ordered Items

                                    </h3>

                                    <p className="text-slate-500 text-sm mt-1">

                                        {order.itemCount} item(s) in this order

                                    </p>

                                </div>

                                <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">

                                    <PackageCheck size={18} />

                                    {overallStatus}

                                </div>

                            </div>

                            <OrderItems

                                items={order.items}

                                overallStatus={overallStatus}

                                onTrack={onTrack}

                                onCancel={onCancel}

                                onReturn={onReturn}

                                onReview={onReview}

                                onBuyAgain={onBuyAgain}

                                order={order}

                            />

                        </div>

                        {/*=================================================
                                PAYMENT SUMMARY
                        =================================================*/}

                        <div className="border-t bg-slate-50">

                            <PaymentSummary

                                order={order}

                            />

                        </div>

                        {/*=================================================
                                FOOTER
                        =================================================*/}

                        <div className="border-t bg-white px-6 py-5">

                            <div className="flex flex-wrap justify-between items-center gap-4">

                                {/* LEFT */}

                                <div>

                                    <h4 className="font-semibold text-slate-800">

                                        Payment Status

                                    </h4>

                                    <p className="mt-1 text-slate-600">

                                        {order.paymentStatus}

                                    </p>

                                </div>

                                {/* RIGHT */}

                                <div className="flex flex-wrap gap-3">

                                    <button

                                        onClick={() => onInvoice(order)}

                                        className="rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition"

                                    >

                                        Download Invoice

                                    </button>

                                    <button

                                        onClick={onHelp}

                                        className="rounded-xl border px-5 py-3 hover:bg-slate-100"

                                    >

                                        Need Help

                                    </button>

                                </div>

                            </div>

                        </div>

                    </>

                )

            }

        </div>

    );

}