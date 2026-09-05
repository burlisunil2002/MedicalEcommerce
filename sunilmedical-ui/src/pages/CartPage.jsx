import { useState } from "react";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";
import SummaryCard from "../components/SummaryCard";
import { useNavigate } from "react-router-dom";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";

export default function CartPage() {

    const navigate = useNavigate();

    const [coupon, setCoupon] = useState("");

    const {
        items,
        summary,
        applyCoupon,
        loading
    } = useCart();


    // Only show full loader during the FIRST cart load
    if (loading) {
        return (
            <SmallCubeLoader
                title="Preparing Cart"
                subtitle="Loading your cart items..."
            />
        );
    }


    const hasItems = items?.length > 0;


    return (
        <div className="max-w-7xl mx-auto p-6">

            {/* BACK BUTTON */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-pink-500 font-medium transition"
            >
                <span className="text-xl">←</span>
                Back
            </button>


            <div className="grid lg:grid-cols-3 gap-6">

                {/* CART ITEMS */}
                <div className="lg:col-span-2 space-y-4">

                    {!hasItems ? (

                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">

                            <div className="text-7xl animate-bounce mb-4">
                                🛒
                            </div>

                            <h2 className="text-xl font-semibold">
                                Your Cart is Empty
                            </h2>

                            <p className="text-sm mt-1">
                                Looks like you haven't added anything yet
                            </p>

                            <button
                                type="button"
                                className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition"
                                onClick={() => navigate("/")}
                            >
                                Continue Shopping
                            </button>

                        </div>

                    ) : (

                        items.map((item) => (
                            <CartItem
                                key={`${item.productId}-${item.variantId}`}
                                item={item}
                            />
                        ))

                    )}

                </div>


                {/* SUMMARY */}
                {hasItems && (
                    <div className="lg:sticky lg:top-24 h-fit space-y-4">

                        <SummaryCard
                            summary={summary}
                            coupon={coupon}
                            setCoupon={setCoupon}
                            applyCoupon={applyCoupon}
                            buttonText="Proceed To Checkout"
                            onButtonClick={() =>
                                navigate("/checkout")
                            }
                        />

                    </div>
                )}

            </div>

        </div>
    );
}