import { ShoppingBag, ArrowRight, PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyOrders() {

    const navigate = useNavigate();

    return (

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

            <div
                className="
                    w-full
                    max-w-2xl
                    bg-white
                    rounded-[35px]
                    shadow-xl
                    border
                    p-12
                    text-center
                "
            >

                {/* Icon */}

                <div
                    className="
                        w-32
                        h-32
                        mx-auto
                        rounded-full
                        bg-blue-100
                        flex
                        items-center
                        justify-center
                    "
                >

                    <PackageSearch
                        size={70}
                        className="text-blue-600"
                    />

                </div>

                <h1 className="text-4xl font-bold mt-8">

                    No Orders Yet

                </h1>

                <p className="mt-4 text-lg text-gray-500">

                    Looks like you haven't placed any orders yet.

                    Browse our products and place your first order.

                </p>

                {/* Buttons */}

                <div className="flex flex-wrap justify-center gap-5 mt-10">

                    <button

                        onClick={() => navigate("/")}

                        className="
                            h-12
                            px-8
                            rounded-xl
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            font-semibold
                            flex
                            items-center
                            gap-2
                            transition
                        "

                    >

                        <ShoppingBag size={20} />

                        Continue Shopping

                    </button>

                    <button

                        onClick={() => navigate("/category/All")}

                        className="
                            h-12
                            px-8
                            rounded-xl
                            border
                            hover:bg-gray-100
                            font-semibold
                            flex
                            items-center
                            gap-2
                        "

                    >

                        Browse Products

                        <ArrowRight size={18} />

                    </button>

                </div>

            </div>

        </div>

    );

}