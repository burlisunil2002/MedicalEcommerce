import { useNavigate } from "react-router-dom";
import {
    Eye,
    ShoppingCart,
    Star,
    Package
} from "lucide-react";

export default function OrderItemCard({
    item,
    orderStatus
}) {

    console.log(item);

    const navigate = useNavigate();

    return (

        <div
            className="
bg-white
rounded-3xl
border
shadow-sm
hover:shadow-lg
transition-all
duration-300
overflow-hidden
group
"
        >

            <div className="p-5">

                <div className="flex gap-6">

                    {/* PRODUCT IMAGE */}

                    <div
                        className="
w-32
h-32
rounded-2xl
bg-gray-50
overflow-hidden
border
flex-shrink-0
"
                    >

                        <img
                            src={item.productImage}
                            alt={item.productName}
                            className="
w-full
h-full
object-contain
group-hover:scale-105
transition
duration-500
cursor-pointer
"
                            onClick={() =>
                                navigate(`/product/${item.productId}`)
                            }
                        />

                    </div>

                    {/* DETAILS */}

                    <div className="flex-1">

                        <h2
                            className="
text-lg
font-bold
cursor-pointer
hover:text-blue-600
"
                            onClick={() =>
                                navigate(`/product/${item.productId}`)
                            }
                        >
                            {item.productName}
                        </h2>

                        {item.variantName && (

                            <div className="mt-2 text-sm text-gray-500">

                                Variant :
                                <span className="font-medium">

                                    {" "}
                                    {item.variantName}

                                </span>

                            </div>

                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-5">

                            <div>

                                <div className="text-gray-500 text-sm">

                                    Quantity

                                </div>

                                <div className="font-semibold">

                                    {item.quantity}

                                </div>

                            </div>



                            <div>

                                <div className="text-gray-500 text-sm">

                                   Item Total

                                </div>

                                <div className="font-bold text-blue-700">

                                    ₹{item.itemTotal.toLocaleString()}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ACTIONS */}

                    {orderStatus === "Delivered" && (

                        <button
                            className="
h-11
px-5
rounded-xl
border
hover:bg-yellow-50
text-yellow-700
flex
items-center
gap-2
"
                        >

                            <Star size={18} />

                            Write Review

                        </button>

                    )}

                </div>

            </div>

    );

}