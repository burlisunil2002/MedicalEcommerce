import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckout } from "../services/checkoutService";
import SummaryCard from "../components/SummaryCard";

export default function ReviewPage() {
    const navigate = useNavigate();

    const [checkout, setCheckout] = useState(null);

    const [paymentMethod, setPaymentMethod] =
        useState("ONLINE");

    const [loading, setLoading] =
        useState(false);

    useEffect(() => {
        loadReview();
    }, []);

    const loadReview = async () => {
        const res = await getCheckout();
        setCheckout(res.data);
    };

    const startPolling = (orderId) => {

        let attempts = 0;

        const interval = setInterval(
            async () => {

                attempts++;

                try {
                    const res =
                        await fetch(
                            `/Order/CheckPaymentStatus?orderId=${orderId}`
                        );

                    const result =
                        await res.json();

                    if (result.success) {

                        clearInterval(
                            interval
                        );

                        navigate(
                            "/order-success"
                        );
                    }

                    if (
                        attempts >= 10
                    ) {
                        clearInterval(
                            interval
                        );

                        navigate(
                            "/my-orders"
                        );
                    }

                } catch (err) {
                    clearInterval(
                        interval
                    );
                }

            },
            3000
        );
    };

    const handlePlaceOrder =
        async () => {

            setLoading(true);

            try {

                // COD
                if (
                    paymentMethod === "COD"
                ) {
                    await fetch(
                        "/Order/PlaceCOD",
                        {
                            method:
                                "POST"
                        }
                    );

                    navigate(
                        "/my-orders"
                    );
                    return;
                }

                // Create Razorpay order
                const orderRes =
                    await fetch(
                        "/Order/CreateOrder",
                        {
                            method:
                                "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify(
                                {}
                            )
                        }
                    );

                const order =
                    await orderRes.json();

                if (
                    !order.success
                ) {
                    setLoading(
                        false
                    );
                    return;
                }

                const options = {
                    key:
                        order.razorpayKey,

                    amount:
                        order.amount,

                    currency:
                        "INR",

                    name:
                        "Sunil Medical",

                    order_id:
                        order.razorpayOrderId,

                    handler:
                        async function (
                            response
                        ) {

                            await fetch(
                                "/Order/VerifyPayment",
                                {
                                    method:
                                        "POST",

                                    headers:
                                    {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body: JSON.stringify(
                                        {
                                            orderId:
                                                order.orderId,

                                            razorpay_payment_id:
                                                response.razorpay_payment_id,

                                            razorpay_order_id:
                                                response.razorpay_order_id,

                                            razorpay_signature:
                                                response.razorpay_signature
                                        }
                                    )
                                }
                            );

                            startPolling(
                                order.orderId
                            );
                        },

                    modal: {
                        ondismiss:
                            async function () {

                                setLoading(
                                    false
                                );

                                await fetch(
                                    "/Order/PaymentFailed",
                                    {
                                        method:
                                            "POST",

                                        headers:
                                        {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body: JSON.stringify(
                                            order.orderId
                                        )
                                    }
                                );
                            }
                    }
                };

                const razor =
                    new window.Razorpay(
                        options
                    );

                razor.on(
                    "payment.failed",
                    async function () {

                        setLoading(
                            false
                        );

                        await fetch(
                            "/Order/PaymentFailed",
                            {
                                method:
                                    "POST",

                                headers:
                                {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify(
                                    order.orderId
                                )
                            }
                        );
                    }
                );

                razor.open();

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

    if (!checkout) return null;

    return (
        <div className="bg-gray-100 min-h-screen py-8">

            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2">

                    <div className="bg-white p-6 rounded-3xl shadow-sm">

                        <h2 className="text-2xl font-bold mb-6">
                            Payment Method
                        </h2>

                        <div className="space-y-4">

                            <label className="flex gap-3 border rounded-2xl p-4 cursor-pointer">

                                <input
                                    type="radio"
                                    checked={
                                        paymentMethod ===
                                        "ONLINE"
                                    }
                                    onChange={() =>
                                        setPaymentMethod(
                                            "ONLINE"
                                        )
                                    }
                                />

                                <span>
                                    Online Payment
                                    <span className="block text-sm text-gray-500">
                                        UPI /
                                        Card /
                                        Net Banking
                                    </span>
                                </span>
                            </label>

                            <label className="flex gap-3 border rounded-2xl p-4 cursor-pointer">

                                <input
                                    type="radio"
                                    checked={
                                        paymentMethod ===
                                        "COD"
                                    }
                                    onChange={() =>
                                        setPaymentMethod(
                                            "COD"
                                        )
                                    }
                                />

                                <span>
                                    Cash on
                                    Delivery
                                </span>

                            </label>

                        </div>

                    </div>

                </div>

                <SummaryCard
                    summary={
                        checkout.summary
                    }
                    buttonText={
                        loading
                            ? "Processing..."
                            : "Place Order"
                    }
                    onButtonClick={
                        handlePlaceOrder
                    }
                />

            </div>
        </div>
    );
}