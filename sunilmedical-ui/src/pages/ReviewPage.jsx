import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckout } from "../services/checkoutService";
import SummaryCard from "../components/SummaryCard";
import { useCart } from "../context/CartContext";
import API from "../services/api";

export default function ReviewPage() {
    const navigate = useNavigate();
    const { loadCart } = useCart();

    const [checkout, setCheckout] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");

    const [pageLoading, setPageLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const showToast = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);

        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 3000);
    };

    const loadReview = async () => {
        try {

            setPageLoading(true);

            const { data } = await getCheckout();

            setCheckout(data);

            const addresses = data.addresses || [];

            if (addresses.length > 0) {

                // Use the address saved in CheckoutSession
                let selected =
                    addresses.find(
                        x => x.id === data.selectedAddressId
                    );

                // Fallbacks
                if (!selected)
                    selected = addresses.find(x => x.isDefault);

                if (!selected)
                    selected = addresses[0];

                setSelectedAddress({
                    id: selected.id,

                    fullName: selected.fullName || "",

                    phoneNumber: selected.mobileNumber || "",

                    address:
                        `${selected.addressLine1 || ""} ${selected.addressLine2 || ""}`.trim(),

                    city: selected.city || "",

                    state: selected.state || "",

                    pincode: selected.pincode || ""
                });
            }

        }
        catch (err) {

            if (err.response?.status === 401) {

                navigate("/login", {
                    replace: true,
                    state: {
                        message:
                            "Please login to continue checkout."
                    }
                });

                return;
            }

            showToast(
                "Unable to load checkout.",
                "error"
            );
        }
        finally {

            setPageLoading(false);

        }
    };

    const startPolling = (razorpayOrderId) => {

        let attempts = 0;

        const interval = setInterval(async () => {

            attempts++;

            try {

                const { data } = await API.get(
                    `/api/order/check-payment-status/${razorpayOrderId}`
                );

                if (data.success) {

                    await loadCart();

                    clearInterval(interval);

                    window.dispatchEvent(new Event("cartUpdated"));

                    setProcessing(false);

                    navigate("/my-orders", {
                        state: {
                            successMessage: "🎉 Payment Successful"
                        }
                    });

                    return;
                }

                if (attempts >= 30) {

                    clearInterval(interval);

                    setProcessing(false);

                    showToast(
                        "Payment verification is taking longer than expected.",
                        "error"
                    );
                }

            } catch {

                clearInterval(interval);

                setProcessing(false);

                showToast(
                    "Unable to verify payment.",
                    "error"
                );
            }

        }, 2500);
    };

    const handlePlaceOrder = async () => {

        if (processing) return;

        setProcessing(true);

        if (!selectedAddress) {

            setProcessing(false);

            showToast(
                "Please select delivery address",
                "error"
            );

            return;
        }

        const payload = {
            checkout: true
        };

        try {
            setProcessing(true);

            // COD
            if (paymentMethod === "COD") {

                const { data } = await API.post(
                    "/api/order/place-cod",
                    payload
                );

                if (data.success) {

                    await loadCart();

                    navigate("/my-orders");

                    return;
                }

                showToast(
                    data.message || "Order failed",
                    "error"
                );

                setProcessing(false);

                return;
            }

            // ONLINE
            const { data: order } =
                await API.post(
                    "/api/order/create",
                    payload
                );

            if (!order.success) {
                setProcessing(false);

                showToast(
                    order.message ||
                    "Payment failed",
                    "error"
                );

                return;
            }

            const razorpay =
                new window.Razorpay({
                    key: order.razorpayKey,
                    amount: order.amount,
                    currency: order.currency,
                    order_id: order.razorpayOrderId,

                    handler: async function (
                        response
                    ) {
                        try {
                            setProcessing(true);

                            const { data: verify } =
                                await API.post(
                                    "/api/order/verify-payment",
                                    {
                                        razorpay_payment_id:
                                            response.razorpay_payment_id,

                                        razorpay_order_id:
                                            response.razorpay_order_id,

                                        razorpay_signature:
                                            response.razorpay_signature
                                    }
                                );

                            if (verify.success) {
                                localStorage.removeItem("cart");
                                await loadCart();

                                window.dispatchEvent(new Event("cartUpdated"));

                                startPolling(order.razorpayOrderId);
                            } else {
                                setProcessing(false);

                                showToast(
                                    verify.message ||
                                    "Payment verification failed",
                                    "error"
                                );
                            }
                        } catch (err) {

                            console.log(err);

                            setProcessing(false);

                            showToast(
                                err.response?.data?.message ??
                                "Payment verification failed",
                                "error"
                            );

                        }
                    },

                    modal: {
                        confirm_close: false,

                        ondismiss: () => {

                            console.log("Razorpay closed");

                            setProcessing(false);

                            // Optional
                            // showToast("Payment cancelled", "info");
                        }
                    },
                });

            razorpay.open();
        }
        catch (err) {
            console.log(
                "INSIDE CATCH"
            );

            console.log(
                "STATUS:",
                err.response?.status
            );

            if (
                err.response?.status === 401
            ) {
                console.log(
                    "401 BLOCK"
                );

                navigate("/login");

                return;
            }
        }
        finally {
            if (paymentMethod === "COD")
                setProcessing(false);
        }
    };

    useEffect(() => {
        loadReview();
    }, []);

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {processing && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">

                    <div className="bg-white rounded-3xl px-10 py-8 text-center shadow-2xl">
                        <div className="w-12 h-12 mx-auto border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>

                        <p className="mt-4 font-semibold">
                            Processing your order...
                        </p>
                    </div>

                </div>
            )}

            {message && (
                <div
                    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-white shadow-xl animate-bounce ${messageType === "success"
                            ? "bg-green-600"
                            : "bg-red-500"
                        }`}
                >
                    {message}
                </div>
            )}

            <div className="bg-gray-50 min-h-screen py-8 px-4">

                <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-6">

                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-5">
                                Delivery Address
                            </h2>

                            {selectedAddress && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 leading-7">

                                    <p className="font-semibold text-lg">
                                        {selectedAddress?.fullName}
                                    </p>

                                    <p className="text-gray-700 whitespace-pre-line break-words">
                                        {selectedAddress?.address}
                                    </p>

                                    <p>
                                        {selectedAddress?.city} ,
                                        {selectedAddress?.state} -
                                        {selectedAddress?.pincode}
                                    </p>

                                    <p>
                                        📞 {selectedAddress?.phoneNumber}
                                    </p>

                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-5">
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
                                    Online Payment
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
                                    Cash on Delivery
                                </label>

                            </div>

                        </div>

                    </div>

                    <div className="lg:sticky lg:top-24 h-fit">
                        <SummaryCard
                            summary={
                                checkout.summary
                            }
                            showCoupon={false}
                            loading={processing}
                            buttonText={
                                processing
                                    ? "Processing..."
                                    : "Place Order"
                            }
                            onButtonClick={
                                handlePlaceOrder
                            }
                        />
                    </div>

                </div>
            </div>
        </>
    );
}
