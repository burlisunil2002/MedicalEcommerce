import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckout } from "../services/checkoutService";
import SummaryCard from "../components/SummaryCard";

export default function ReviewPage() {
    const navigate = useNavigate();

    const [checkout, setCheckout] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReview();
    }, []);

    const loadReview = async () => {
        try {
            const res = await getCheckout();

            setCheckout(res.data);

            const addresses =
                res.data.savedAddresses ||
                res.data.addresses ||
                [];

            if (addresses.length > 0) {
                const selected =
                    addresses.find(
                        x => x.isDefault || x.selected
                    ) || addresses[0];

                setSelectedAddress({
                    fullName:
                        selected.fullName ||
                        selected.name ||
                        "",

                    phoneNumber:
                        selected.phoneNumber ||
                        selected.mobileNumber ||
                        selected.phone ||
                        "",

                    address:
                        selected.address ||
                        selected.addressLine1 ||
                        selected.street ||
                        "",

                    city:
                        selected.city || "",

                    state:
                        selected.state || "",

                    pincode:
                        selected.pincode ||
                        selected.zipCode ||
                        "",
                });
            }

        } catch (err) {
            console.error(err);
        }
    };

    const startPolling = (orderId) => {
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;

            try {
                const res = await fetch(
                    `/Order/CheckPaymentStatus?orderId=${orderId}`
                );

                const result = await res.json();

                if (result.success) {
                    clearInterval(interval);
                    navigate("/my-orders");
                    return;
                }

                if (attempts >= 10) {
                    clearInterval(interval);
                    navigate("/my-orders");
                }

            } catch (err) {
                clearInterval(interval);
                navigate("/my-orders");
            }
        }, 3000);
    };

    const handlePlaceOrder = async () => {
        try {
            setLoading(true);

            if (!selectedAddress) {
                alert("Please select delivery address");
                return;
            }

            // COD
            if (paymentMethod === "COD") {
                const res = await fetch("/Order/PlaceCOD", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(selectedAddress),
                });

                const result = await res.json();

                if (result.redirect) {
                    navigate(result.redirect);
                    return;
                }

                if (result.success) {
                    navigate("/my-orders");
                } else {
                    alert(result.message || "Unable to place order");
                }

                return;
            }

            // Razorpay
            const orderRes = await fetch("/Order/CreateOrder", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(selectedAddress),
            });

            const order = await orderRes.json();

            if (order.redirect) {
                navigate(order.redirect);
                return;
            }

            if (!order.success) {
                alert(order.message || "Payment initiation failed");
                return;
            }

            const options = {
                key: order.razorpayKey,
                amount: order.amount,
                currency: "INR",
                name: "Sunil Medical Products",
                description: "Order Payment",
                order_id: order.razorpayOrderId,

                handler: async function (response) {
                    const verifyRes = await fetch(
                        "/Order/VerifyPayment",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                orderId: order.orderId,
                                razorpay_payment_id:
                                    response.razorpay_payment_id,
                                razorpay_order_id:
                                    response.razorpay_order_id,
                                razorpay_signature:
                                    response.razorpay_signature,
                            }),
                        }
                    );

                    const verify =
                        await verifyRes.json();

                    if (verify.success) {
                        startPolling(
                            order.orderId
                        );
                    } else {
                        alert(
                            verify.message ||
                            "Payment verification failed"
                        );
                    }
                },

                modal: {
                    ondismiss: () =>
                        setLoading(false),
                },

                theme: {
                    color: "#16a34a",
                },
            };

            const razorpay =
                new window.Razorpay(options);

            razorpay.open();

        } catch (err) {
            console.error(
                "PLACE ORDER ERROR:",
                err
            );

            alert(
                err.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    if (!checkout) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-6 md:py-10 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Address */}
                    <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold">
                                Delivery Address
                            </h2>

                            <button
                                onClick={() => navigate("/checkout")}
                                className="text-green-600 font-medium hover:underline"
                            >
                                ← Back to Checkout
                            </button>
                        </div>

                        {selectedAddress ? (
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                                <p className="text-xl font-semibold mb-3">
                                    {selectedAddress.fullName}
                                </p>

                                {selectedAddress.address && (
                                    <p className="mb-2">
                                        {selectedAddress.address}
                                    </p>
                                )}

                                <p className="mb-2">
                                    {selectedAddress.city}
                                    {selectedAddress.state
                                        ? `, ${selectedAddress.state}`
                                        : ""}
                                </p>

                                <p className="mb-2">
                                    {selectedAddress.pincode}
                                </p>

                                {selectedAddress.phoneNumber && (
                                    <p>
                                        {selectedAddress.phoneNumber}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>No address selected</div>
                        )}

                    </div> 

                    {/* Payment */}
                    <div className="bg-white rounded-3xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold mb-5">
                            Payment Method
                        </h2>

                        <div className="space-y-4">

                            <label
                                className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition ${paymentMethod === "ONLINE"
                                    ? "border-green-600 bg-green-50"
                                    : "border-gray-200"
                                    }`}
                            >
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

                                <div>
                                    <p className="font-medium">
                                        Online Payment
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        UPI / Card / Wallet /
                                        Net Banking
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition ${paymentMethod === "COD"
                                    ? "border-green-600 bg-green-50"
                                    : "border-gray-200"
                                    }`}
                            >
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

                                <div>
                                    <p className="font-medium">
                                        Cash on Delivery
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="lg:sticky lg:top-24 h-fit">
                    <SummaryCard
                        summary={checkout.summary}
                        showCoupon={false}
                        buttonText={
                            loading
                                ? "Processing..."
                                : "Place Order"
                        }
                        onButtonClick={handlePlaceOrder}
                    />
                </div>
            </div>
        </div>
    );
}