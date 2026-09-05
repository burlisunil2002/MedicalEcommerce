import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import SummaryCard from "../components/SummaryCard";
import OrderItemsSection from "../components/checkout/OrderItemsSection";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";

import { useCart } from "../context/CartContext";
import API from "../services/api";

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
    const [cartItems, setCartItems] = useState([]);

    const [selectedAddress, setSelectedAddress] = useState(null);

    const [paymentMethod, setPaymentMethod] = useState("ONLINE");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [pageLoading, setPageLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentOpening, setPaymentOpening] = useState(false);
    const [redirecting, setRedirecting] = useState(false);


    // =========================================================
    // TOAST / MESSAGE
    // =========================================================

    const showToast = (text, type = "success") => {

        setMessage(text);
        setMessageType(type);

        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 3000);
    };


    // =========================================================
    // LOAD REVIEW DATA
    // =========================================================

    const loadReview = async () => {

        try {

            setPageLoading(true);

            const { data } = await getCheckout();

            setCheckout(data);

            setCartItems(data?.cartItems || []);

            const addresses = data?.addresses || [];

            if (addresses.length === 0) {

                setSelectedAddress(null);

                return;
            }


            let selected =
                addresses.find(
                    x => x.id === data.selectedAddressId
                );


            if (!selected) {

                selected =
                    addresses.find(
                        x => x.isDefault
                    );
            }


            if (!selected) {

                selected = addresses[0];
            }


            const formattedAddress = {

                id: selected.id,

                fullName: selected.fullName,

                phoneNumber: selected.mobileNumber,

                address:
                    `${selected.addressLine1} ${selected.addressLine2 ?? ""}`.trim(),

                city: selected.city,

                state: selected.state,

                pincode: selected.pincode
            };


            setSelectedAddress(formattedAddress);


            // Save selected/default address if needed
            if (!data.selectedAddressId) {

                await selectAddress(selected.id);
            }

        }
        catch (err) {

            console.error(
                "Review page load failed:",
                err
            );

            showToast(
                err?.response?.data?.message ||
                "Unable to load checkout.",
                "error"
            );

        }
        finally {

            setPageLoading(false);
        }
    };


    // =========================================================
    // PAYMENT STATUS POLLING
    // =========================================================

    const startPolling = (razorpayOrderId) => {

        let attempts = 0;

        pollingRef.current =
            setInterval(async () => {

                attempts++;

                try {

                    const { data } =
                        await API.get(
                            `/api/order/check-payment-status/${razorpayOrderId}`
                        );


                    if (data.success) {

                        clearInterval(
                            pollingRef.current
                        );

                        pollingRef.current = null;

                        setProcessing(false);

                        setRedirecting(true);


                        navigate(
                            `/success-order/${data.orderId}`,
                            {
                                replace: true
                            }
                        );

                        return;
                    }


                    if (attempts >= 30) {

                        clearInterval(
                            pollingRef.current
                        );

                        pollingRef.current = null;

                        setProcessing(false);
                        setRedirecting(false);


                        showToast(
                            "Payment verification is taking longer than expected.",
                            "error"
                        );
                    }

                }
                catch (err) {

                    console.error(
                        "Payment status polling failed:",
                        err
                    );

                    clearInterval(
                        pollingRef.current
                    );

                    pollingRef.current = null;

                    setProcessing(false);
                    setRedirecting(false);


                    showToast(
                        "Unable to verify payment.",
                        "error"
                    );
                }

            }, 2500);
    };


    // =========================================================
    // PLACE ORDER
    // =========================================================

    const handlePlaceOrder = async () => {

        if (processing) {
            return;
        }


        if (!selectedAddress) {

            showToast(
                "Please select a delivery address.",
                "error"
            );

            return;
        }


        try {

            setProcessing(true);


            // Save selected address
            await selectAddress(
                selectedAddress.id
            );


            const payload = {
                checkout: true
            };


            // =================================================
            // CASH ON DELIVERY
            // =================================================

            if (paymentMethod === "COD") {

                const { data } =
                    await API.post(
                        "/api/order/place-cod",
                        payload
                    );


                if (!data.success) {

                    showToast(
                        data.message ||
                        "Unable to place order.",
                        "error"
                    );

                    setProcessing(false);

                    return;
                }


                // Refresh cart
                await loadCart();

                window.dispatchEvent(
                    new Event("cartUpdated")
                );


                setProcessing(false);
                setRedirecting(true);


                timeoutRef.current =
                    setTimeout(() => {

                        navigate(
                            `/success-order/${data.orderId}`,
                            {
                                replace: true
                            }
                        );

                    }, 500);


                return;
            }


            // =================================================
            // ONLINE PAYMENT
            // =================================================

            const { data: order } =
                await API.post(
                    "/api/order/create",
                    payload
                );


            if (!order.success) {

                showToast(
                    order.message ||
                    "Unable to create payment.",
                    "error"
                );

                setProcessing(false);

                return;
            }


            // Show payment loading screen
            setPaymentOpening(true);


            // =================================================
            // RAZORPAY
            // =================================================

            const razorpay =
                new window.Razorpay({

                    key: order.razorpayKey,

                    amount: order.amount,

                    currency: order.currency,

                    order_id:
                        order.razorpayOrderId,


                    handler:
                        async function (response) {

                            // Immediately show confirmation screen
                            setPaymentOpening(false);
                            setRedirecting(true);


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

                                    setRedirecting(false);
                                    setProcessing(false);


                                    showToast(
                                        verify.message ||
                                        "Payment verification failed.",
                                        "error"
                                    );

                                    return;
                                }


                                // Remove old local cart
                                localStorage.removeItem(
                                    "cart"
                                );


                                // Start server-side verification polling
                                startPolling(
                                    order.razorpayOrderId
                                );

                            }
                            catch (err) {

                                console.error(
                                    "Payment verification error:",
                                    err
                                );

                                setRedirecting(false);
                                setProcessing(false);


                                showToast(
                                    err?.response?.data?.message ||
                                    "Payment verification failed.",
                                    "error"
                                );
                            }
                        },


                    modal: {

                        confirm_close: false,


                        ondismiss: () => {

                            setPaymentOpening(false);
                            setProcessing(false);


                            showToast(
                                "Payment cancelled.",
                                "error"
                            );
                        }
                    }
                });


            // Give React time to render loading state
            setTimeout(() => {

                setPaymentOpening(false);

                razorpay.open();

            }, 250);

        }
        catch (err) {

            console.error(
                "Place order error:",
                err
            );


            setPaymentOpening(false);
            setProcessing(false);


            // Authentication expired
            if (
                err?.response?.status === 401
            ) {

                sessionStorage.setItem(
                    "redirectAfterLogin",
                    window.location.pathname
                );


                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );

                return;
            }


            showToast(
                err?.response?.data?.message ||
                "Something went wrong. Please try again.",
                "error"
            );
        }
    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadReview();

    }, []);


    // =========================================================
    // CLEANUP
    // =========================================================

    useEffect(() => {

        return () => {

            if (timeoutRef.current) {

                clearTimeout(
                    timeoutRef.current
                );
            }


            if (pollingRef.current) {

                clearInterval(
                    pollingRef.current
                );
            }
        };

    }, []);


    // =========================================================
    // INITIAL LOADING
    // =========================================================

    if (pageLoading) {

        return (
            <SmallCubeLoader
                title="Preparing Review"
                subtitle="Loading your order summary..."
            />
        );
    }


    // =========================================================
    // PAYMENT OPENING
    // =========================================================

    if (paymentOpening) {

        return (
            <SmallCubeLoader
                title="Opening Payment Gateway"
                subtitle="Please wait while we connect to Razorpay..."
            />
        );
    }


    // =========================================================
    // ORDER REDIRECT
    // =========================================================

    if (redirecting) {

        return (
            <SmallCubeLoader
                title="Confirming Your Order"
                subtitle="Please wait while we confirm your payment..."
            />
        );
    }


    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-100 py-6 sm:py-8">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


                {/* =================================================
                    TOAST MESSAGE
                ================================================= */}

                {message && (
                    <div
                        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${messageType === "error"
                                ? "bg-red-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                    >
                        {message}
                    </div>
                )}


                {/* =================================================
                    BACK BUTTON
                ================================================= */}

                <div className="mb-5">

                    <button
                        type="button"
                        onClick={() => navigate("/checkout")}
                        disabled={processing}
                        className="inline-flex items-center gap-2 text-gray-700 hover:text-emerald-600 font-medium transition disabled:opacity-50"
                    >
                        <span className="text-xl">
                            ←
                        </span>

                        <span>
                            Back to Checkout
                        </span>
                    </button>

                </div>


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="mb-6">

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Review Your Order
                    </h1>

                    <p className="mt-1 text-sm sm:text-base text-gray-500">
                        Please review your delivery address, items and payment method before placing your order.
                    </p>

                </div>



                {/* =================================================
                    MAIN GRID
                ================================================= */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                    {/* =================================================
                        LEFT CONTENT
                    ================================================= */}

                    <div className="lg:col-span-2 space-y-6">


                        {/* =================================================
                            DELIVERY ADDRESS
                        ================================================= */}

                        <div className="bg-white rounded-3xl shadow-sm p-5 sm:p-6">

                            <div className="flex items-center justify-between gap-4 mb-5">

                                <div>

                                    <h2 className="text-xl font-bold text-gray-900">
                                        Delivery Address
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Your order will be delivered to this address.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={() => navigate("/checkout")}
                                    disabled={processing}
                                    className="hidden sm:inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                                >
                                    Change
                                </button>

                            </div>


                            {selectedAddress ? (

                                <div className="border border-gray-200 rounded-2xl p-4 sm:p-5">

                                    <div className="flex items-start justify-between gap-4">

                                        <div>

                                            <p className="font-semibold text-gray-900">
                                                {selectedAddress.fullName}
                                            </p>

                                            <p className="text-sm text-gray-600 mt-2 leading-6">
                                                {selectedAddress.address}
                                            </p>

                                            <p className="text-sm text-gray-600">
                                                {selectedAddress.city},{" "}
                                                {selectedAddress.state} -{" "}
                                                {selectedAddress.pincode}
                                            </p>

                                            <p className="text-sm text-gray-600 mt-2">
                                                Mobile:{" "}
                                                {selectedAddress.phoneNumber}
                                            </p>

                                        </div>


                                        <div className="shrink-0">

                                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                                Selected
                                            </span>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={() => navigate("/checkout")}
                                        disabled={processing}
                                        className="sm:hidden mt-4 text-sm font-medium text-emerald-600"
                                    >
                                        Change Address
                                    </button>

                                </div>

                            ) : (

                                <div className="border border-red-200 bg-red-50 rounded-2xl p-4">

                                    <p className="text-sm font-medium text-red-700">
                                        No delivery address selected.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/checkout")}
                                        className="mt-3 text-sm font-semibold text-red-700 underline"
                                    >
                                        Select Address
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            ORDER ITEMS
                        ================================================= */}

                        <div className="bg-white rounded-3xl shadow-sm p-5 sm:p-6">

                            <div className="mb-5">

                                <h2 className="text-xl font-bold text-gray-900">
                                    Order Items
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Review the products and quantities in your order.
                                </p>

                            </div>


                            {cartItems.length > 0 ? (

                                <OrderItemsSection
                                    items={cartItems}
                                />

                            ) : (

                                <div className="border border-gray-200 rounded-2xl p-5 text-center">

                                    <p className="text-gray-500 text-sm">
                                        No items found in your cart.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/cart")}
                                        className="mt-3 text-sm font-semibold text-emerald-600"
                                    >
                                        Return to Cart
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            PAYMENT METHOD
                        ================================================= */}

                        <div className="bg-white rounded-3xl shadow-sm p-5 sm:p-6">

                            <div className="mb-5">

                                <h2 className="text-xl font-bold text-gray-900">
                                    Payment Method
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Select how you would like to pay for your order.
                                </p>

                            </div>


                            <div className="space-y-3">


                                {/* COD */}
                                <label
                                    className={`flex items-center gap-4 border rounded-2xl p-4 cursor-pointer transition ${paymentMethod === "COD"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >

                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={
                                            paymentMethod === "COD"
                                        }
                                        onChange={() =>
                                            setPaymentMethod("COD")
                                        }
                                        disabled={processing}
                                        className="w-4 h-4"
                                    />


                                    <div className="flex-1">

                                        <p className="font-semibold text-gray-900">
                                            Cash on Delivery
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Pay when your order is delivered.
                                        </p>

                                    </div>

                                </label>


                                {/* ONLINE */}
                                <label
                                    className={`flex items-center gap-4 border rounded-2xl p-4 cursor-pointer transition ${paymentMethod === "ONLINE"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >

                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="ONLINE"
                                        checked={
                                            paymentMethod === "ONLINE"
                                        }
                                        onChange={() =>
                                            setPaymentMethod("ONLINE")
                                        }
                                        disabled={processing}
                                        className="w-4 h-4"
                                    />


                                    <div className="flex-1">

                                        <p className="font-semibold text-gray-900">
                                            Online Payment
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Pay securely using Razorpay.
                                        </p>

                                    </div>

                                </label>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        RIGHT SUMMARY
                    ================================================= */}

                    <div className="lg:sticky lg:top-24 h-fit">

                        <SummaryCard
                            summary={
                                checkout?.summary || {}
                            }
                            showCoupon={false}
                            buttonText={
                                processing
                                    ? "Processing..."
                                    : paymentMethod === "COD"
                                        ? "Place Order"
                                        : "Pay Securely"
                            }
                            onButtonClick={
                                handlePlaceOrder
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    MOBILE BOTTOM ACTION
                ================================================= */}

                <div className="lg:hidden mt-6">

                    <button
                        type="button"
                        onClick={() => navigate("/checkout")}
                        disabled={processing}
                        className="w-full h-12 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        ← Back to Checkout
                    </button>

                </div>

            </div>

        </div>
    );
}