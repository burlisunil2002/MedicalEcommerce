import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../components/SummaryCard";
import { useCart } from "../context/CartContext";
import API from "../services/api";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";
import OrderItemsSection from "../components/checkout/OrderItemsSection";
import {
    getCheckout,
    selectAddress
} from "../services/checkoutService";


export default function ReviewPage() {
    const navigate = useNavigate();
    const { loadCart } = useCart();

    const timeoutRef = useRef(null);

    const pollingRef = useRef(null);

    const [checkout, setCheckout] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");


    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [pageLoading, setPageLoading] = useState(true);

    const [processing, setProcessing] = useState(false);

    const [paymentOpening, setPaymentOpening] = useState(false);

    const [redirecting, setRedirecting] = useState(false);

    const showToast = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);

        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 3000);
    };

    const loadReview = async () => {

        setPageLoading(true);

        try {

            const { data } = await getCheckout();

            setCheckout(data);

            const addresses = data.addresses || [];

            if (addresses.length === 0) {

                setSelectedAddress(null);
                return;

            }

            let selected =
                addresses.find(x => x.id === data.selectedAddressId);

            if (!selected)
                selected =
                    addresses.find(x => x.isDefault);

            if (!selected)
                selected =
                    addresses[0];

            setSelectedAddress({

                id: selected.id,

                fullName: selected.fullName,

                phoneNumber: selected.mobileNumber,

                address:
                    `${selected.addressLine1} ${selected.addressLine2 ?? ""}`,

                city: selected.city,

                state: selected.state,

                pincode: selected.pincode

            });

            // Save default address only if session doesn't already have one
            if (!data.selectedAddressId) {

                await selectAddress(selected.id);

            }

        }
        catch (err) {

            console.error(err);

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

        pollingRef.current = setInterval(async () => {

            attempts++;

            try {

                const { data } = await API.get(
                    `/api/order/check-payment-status/${razorpayOrderId}`
                );

                if (data.success) {

                    clearInterval(pollingRef.current);
                    pollingRef.current = null;

                    await loadCart();

                    window.dispatchEvent(new Event("cartUpdated"));

                    setProcessing(false);

                    setRedirecting(true);

                    timeoutRef.current = setTimeout(() => {

                        navigate(`/success-order/${data.orderId}`, {
                            replace: true
                        });

                    }, 500);

                    return;
                }

                if (attempts >= 30) {

                    clearInterval(pollingRef.current);
                    pollingRef.current = null;

                    setProcessing(false);

                    showToast(
                        "Payment verification is taking longer than expected.",
                        "error"
                    );

                    return;
                }

            } catch {

                clearInterval(pollingRef.current);
                pollingRef.current = null;

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

        if (!selectedAddress) {

            showToast(
                "Please select delivery address",
                "error"
            );

            return;

        }

        await selectAddress(selectedAddress.id);

        setProcessing(true);

        const payload = {
            checkout: true
        };

        try {

            // ===========================
            // CASH ON DELIVERY
            // ===========================

            if (paymentMethod === "COD") {

                

                const { data } = await API.post(
                    "/api/order/place-cod",
                    payload
                );


                if (!data.success) {

                    showToast(
                        data.message || "Order failed",
                        "error"
                    );

                    return;
                }

                    await loadCart();

                    window.dispatchEvent(new Event("cartUpdated"));

                    setProcessing(false);

                    setRedirecting(true);

                timeoutRef.current = setTimeout(() => {

                    navigate(`/success-order/${data.orderId}`, {
                        replace: true
                    });

                }, 500);



                    return;
            }

            // ===========================
            // CREATE ONLINE ORDER
            // ===========================

            
            const { data: order } = await API.post(
                "/api/order/create",
                payload
            );

            if (!order.success) {


                showToast(
                    order.message || "Unable to create payment.",
                    "error"
                );

                return;
            }

            setPaymentOpening(true);


            const razorpay = new window.Razorpay({

                key: order.razorpayKey,

                amount: order.amount,

                currency: order.currency,

                order_id: order.razorpayOrderId,

                handler: async function (response) {

                    try {

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

                        if (!verify.success) {

                            setPaymentOpening(false);

                            showToast(
                                verify.message || "Payment verification failed.",
                                "error"
                            );

                            return;
                        }

                        setPaymentOpening(false);
                        setRedirecting(true);

                        localStorage.removeItem("cart");

                        await loadCart();

                        window.dispatchEvent(new Event("cartUpdated"));

                        startPolling(order.razorpayOrderId);

                    }
                    catch (err) {

                        showToast(
                            err.response?.data?.message ??
                            "Payment verification failed.",
                            "error"
                        );
                    }
                },

                modal: {

                    confirm_close: false,

                    ondismiss: () => {

                        setPaymentOpening(false);

                        showToast(
                            "Payment cancelled.",
                            "error"
                        );
                    }

                }

            });

            setTimeout(() => {

                setPaymentOpening(false);

                razorpay.open();

            }, 250);
        }
        catch (err) {

            setPaymentOpening(false);

            console.log(err);

            if (err.response?.status === 401) {

                sessionStorage.setItem(
                    "redirectAfterLogin",
                    window.location.pathname
                );

                navigate("/login");

                return;
            }

            showToast(
                err.response?.data?.message ||
                "Something went wrong.",
                "error"
            );
        }
        finally {

            setProcessing(false);

        }

    };

    useEffect(() => {
        loadReview();
    }, []);

    useEffect(() => {

        return () => {

            clearTimeout(timeoutRef.current);

            clearInterval(pollingRef.current);

        };

    }, []);

   

    if (pageLoading) {
        return (
            <SmallCubeLoader
                title="Preparing Review"
                subtitle="Loading your order summary..."
            />
        );
    }

    if (paymentOpening) {
        return (
            <SmallCubeLoader
                title="Opening Payment Gateway"
                subtitle="Please wait while we connect to Razorpay..."
            />
        );
    }

    if (redirecting) {
        return (
            <SmallCubeLoader
                title="Confirming Your Order"
                subtitle="Redirecting to your order details..."
            />
        );
    }


    return (
        <>

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

                        {/* Order Items */}

                        <OrderItemsSection
                            items={checkout?.cartItems || []}
                        />

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
                            summary={checkout?.summary || {}}
                            showCoupon={false}
                            loading={processing}
                            buttonText={
                                processing ? "Processing..." : "Place Order"
                            }
                            onButtonClick={handlePlaceOrder}
                        />
                    </div>

                </div>
            </div>
        </>
    );
}
