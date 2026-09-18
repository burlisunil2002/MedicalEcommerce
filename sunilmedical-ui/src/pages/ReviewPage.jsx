import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    MapPin,
    Package,
    ShieldCheck,
    Smartphone,
    Truck,
    WalletCards,
} from "lucide-react";

import SummaryCard from "../components/SummaryCard";
import OrderItemsSection from "../components/checkout/OrderItemsSection";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";
import { useCart } from "../context/CartContext";
import API from "../services/api";
import { getCheckout, selectAddress } from "../services/checkoutService";

const REVIEW_CACHE_KEY = "checkout_review_snapshot_v1";

const hasSummary = (value) =>
    value && typeof value === "object" && Object.keys(value).length > 0;

const formatAddress = (address) => {
    if (!address) return null;

    return {
        id: address.id,
        fullName: address.fullName || address.name || "",
        phoneNumber:
            address.mobileNumber || address.phoneNumber || address.mobile || "",
        address: [address.addressLine1, address.addressLine2]
            .filter(Boolean)
            .join(" "),
        landmark: address.landmark || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        addressType: address.addressType || address.type || "Home",
    };
};

const getBestAddress = (data) => {
    const addresses = Array.isArray(data?.addresses) ? data.addresses : [];
    if (!addresses.length) return null;

    const selected =
        addresses.find(
            (x) => String(x.id) === String(data?.selectedAddressId)
        ) ||
        addresses.find((x) => x.isDefault === true) ||
        addresses[0];

    return formatAddress(selected);
};

const readReviewCache = () => {
    try {
        const raw = sessionStorage.getItem(REVIEW_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("Unable to read review snapshot:", error);
        return null;
    }
};

const writeReviewCache = (snapshot) => {
    try {
        sessionStorage.setItem(REVIEW_CACHE_KEY, JSON.stringify(snapshot));
    } catch (error) {
        console.warn("Unable to save review snapshot:", error);
    }
};

export default function ReviewPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        items: contextCartItems,
        summary: contextSummary,
        loadCart,
    } = useCart();

    const timeoutRef = useRef(null);
    const pollingRef = useRef(null);
    const toastTimerRef = useRef(null);
    const mountedRef = useRef(true);

    const navigationSnapshot = location.state?.checkoutSnapshot || null;
    const cachedSnapshot = useMemo(
        () => navigationSnapshot || readReviewCache(),
        [navigationSnapshot]
    );

    const [checkout, setCheckout] = useState(
        cachedSnapshot?.checkout || null
    );
    const [cartItems, setCartItems] = useState(
        Array.isArray(cachedSnapshot?.cartItems)
            ? cachedSnapshot.cartItems
            : Array.isArray(contextCartItems)
                ? contextCartItems
                : []
    );
    const [selectedAddress, setSelectedAddress] = useState(
        cachedSnapshot?.selectedAddress || getBestAddress(cachedSnapshot?.checkout)
    );
    const [paymentMethod, setPaymentMethod] = useState(
        cachedSnapshot?.paymentMethod || "ONLINE"
    );
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [paymentOpening, setPaymentOpening] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const initialSummary =
        cachedSnapshot?.summary || contextSummary || cachedSnapshot?.checkout?.summary || {};

    const summary = useMemo(() => {
        if (hasSummary(checkout?.summary)) return checkout.summary;
        if (hasSummary(cachedSnapshot?.summary)) return cachedSnapshot.summary;
        if (hasSummary(contextSummary)) return contextSummary;
        return initialSummary;
    }, [checkout?.summary, cachedSnapshot?.summary, contextSummary, initialSummary]);

    const totalItems = useMemo(
        () =>
            (cartItems || []).reduce(
                (total, item) => total + Math.max(0, Number(item?.quantity || 0)),
                0
            ),
        [cartItems]
    );

    const showToast = useCallback((text, type = "success") => {
        if (!mountedRef.current) return;

        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        setMessage(text);
        setMessageType(type);

        toastTimerRef.current = window.setTimeout(() => {
            if (!mountedRef.current) return;
            setMessage("");
            setMessageType("");
        }, 3000);
    }, []);

    /*
     * One background server reconciliation only.
     * The page itself never waits for this request to render.
     */
    useEffect(() => {
        let active = true;

        const refresh = async () => {
            try {
                setRefreshing(true);
                const response = await getCheckout();
                const data = response?.data;

                if (!active || !data) return;

                setCheckout(data);

                const serverItems =
                    Array.isArray(data?.cartItems)
                        ? data.cartItems
                        : Array.isArray(data?.items)
                            ? data.items
                            : null;

                if (Array.isArray(serverItems) && serverItems.length > 0) {
                    setCartItems(serverItems);
                }

                const serverAddress = getBestAddress(data);
                if (serverAddress) {
                    setSelectedAddress(serverAddress);
                }

                writeReviewCache({
                    checkout: data,
                    cartItems:
                        Array.isArray(serverItems) && serverItems.length > 0
                            ? serverItems
                            : cartItems,
                    selectedAddress: serverAddress || selectedAddress,
                    selectedAddressId:
                        serverAddress?.id || selectedAddress?.id || null,
                    summary: data.summary || summary,
                    paymentMethod,
                    updatedAt: Date.now(),
                });
            } catch (error) {
                console.error("Review background refresh failed:", error);
            } finally {
                if (active) setRefreshing(false);
            }
        };

        refresh();

        return () => {
            active = false;
        };
        // Run the server reconciliation once when Review mounts.
    }, []);

    useEffect(() => {
        writeReviewCache({
            checkout,
            cartItems,
            selectedAddress,
            selectedAddressId: selectedAddress?.id || null,
            summary,
            paymentMethod,
            updatedAt: Date.now(),
        });
    }, [checkout, cartItems, selectedAddress, summary, paymentMethod]);

    const handleChangeAddress = useCallback(() => {
        if (processing) return;

        navigate("/checkout", {
            state: {
                fromReview: true,
                refreshCheckout: true,
            },
        });
    }, [navigate, processing]);

    const startPolling = useCallback(
        (razorpayOrderId) => {
            let attempts = 0;

            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }

            pollingRef.current = setInterval(async () => {
                attempts += 1;

                try {
                    const { data } = await API.get(
                        `/api/order/check-payment-status/${razorpayOrderId}`
                    );

                    if (data.success) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                        setProcessing(false);
                        setRedirecting(true);

                        navigate(`/success-order/${data.orderId}`, {
                            replace: true,
                        });
                        return;
                    }

                    if (attempts >= 30) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                        setProcessing(false);
                        setRedirecting(false);
                        showToast(
                            "Payment verification is taking longer than expected.",
                            "error"
                        );
                    }
                } catch (error) {
                    console.error("Payment polling failed:", error);
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setProcessing(false);
                    setRedirecting(false);
                    showToast("Unable to verify payment.", "error");
                }
            }, 2500);
        },
        [navigate, showToast]
    );

    const handlePlaceOrder = async () => {
        if (processing) return;

        if (!selectedAddress?.id) {
            showToast("Please select a delivery address.", "error");
            return;
        }

        if (!cartItems?.length) {
            showToast("Your cart is empty.", "error");
            navigate("/cart");
            return;
        }

        try {
            setProcessing(true);

            // Server remains authoritative for the final selected address.
            await selectAddress(selectedAddress.id);

            const payload = { checkout: true };

            if (paymentMethod === "COD") {
                const { data } = await API.post(
                    "/api/order/place-cod",
                    payload
                );

                if (!data.success) {
                    showToast(
                        data.message || "Unable to place order.",
                        "error"
                    );
                    setProcessing(false);
                    return;
                }

                sessionStorage.removeItem(REVIEW_CACHE_KEY);
                loadCart().catch((error) =>
                    console.error("Cart refresh failed:", error)
                );

                window.dispatchEvent(new Event("cartUpdated"));
                setProcessing(false);
                setRedirecting(true);

                timeoutRef.current = setTimeout(() => {
                    navigate(`/success-order/${data.orderId}`, {
                        replace: true,
                    });
                }, 150);

                return;
            }

            const { data: order } = await API.post(
                "/api/order/create",
                payload
            );

            if (!order.success) {
                showToast(
                    order.message || "Unable to create payment.",
                    "error"
                );
                setProcessing(false);
                return;
            }

            if (!window.Razorpay) {
                setProcessing(false);
                showToast("Payment gateway is unavailable. Please try again.", "error");
                return;
            }

            setPaymentOpening(true);

            const razorpay = new window.Razorpay({
                key: order.razorpayKey,
                amount: order.amount,
                currency: order.currency,
                order_id: order.razorpayOrderId,

                handler: async (response) => {
                    setPaymentOpening(false);
                    setRedirecting(true);

                    try {
                        const { data: verify } = await API.post(
                            "/api/order/verify-payment",
                            {
                                razorpay_payment_id:
                                    response.razorpay_payment_id,
                                razorpay_order_id:
                                    response.razorpay_order_id,
                                razorpay_signature:
                                    response.razorpay_signature,
                            }
                        );

                        if (!verify.success) {
                            setRedirecting(false);
                            setProcessing(false);
                            showToast(
                                verify.message || "Payment verification failed.",
                                "error"
                            );
                            return;
                        }

                        sessionStorage.removeItem(REVIEW_CACHE_KEY);
                        loadCart().catch((error) =>
                            console.error("Cart refresh failed:", error)
                        );
                        window.dispatchEvent(new Event("cartUpdated"));

                        startPolling(order.razorpayOrderId);
                    } catch (error) {
                        console.error("Payment verification error:", error);
                        setRedirecting(false);
                        setProcessing(false);
                        showToast(
                            error?.response?.data?.message ||
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
                        showToast("Payment cancelled.", "error");
                    },
                },
            });

            requestAnimationFrame(() => {
                if (!mountedRef.current) return;
                setPaymentOpening(false);
                razorpay.open();
            });
        } catch (error) {
            console.error("Place order error:", error);
            setPaymentOpening(false);
            setProcessing(false);

            if (error?.response?.status === 401) {
                sessionStorage.setItem("redirectAfterLogin", "/review");
                navigate("/login", { replace: true });
                return;
            }

            showToast(
                error?.response?.data?.message ||
                "Something went wrong. Please try again.",
                "error"
            );
        }
    };

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

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
                subtitle="Please wait while we confirm your payment..."
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8">
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/checkout")}
                        disabled={processing}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-emerald-600 disabled:opacity-50"
                    >
                        <ArrowLeft size={18} />
                        Back to Checkout
                    </button>

                    <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
                        <ShieldCheck size={17} className="text-emerald-600" />
                        Secure Checkout
                    </div>
                </div>
            </header>

            {message && (
                <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
                    <div
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${messageType === "error"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {messageType === "error" ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        ) : (
                            <CheckCircle2 size={18} className="shrink-0" />
                        )}
                        <span>{message}</span>
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 size={16} />
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
                                    Checkout Step 2 of 3
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                                Review Your Order
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                                Confirm your delivery address, items and payment method before placing your order.
                            </p>
                        </div>

                        {refreshing && (
                            <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-500" />
                                Syncing latest order details...
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-7">
                    <div className="min-w-0 space-y-5 lg:col-span-2">
                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                                            <MapPin size={19} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                                                Delivery Address
                                            </h2>
                                            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                                Your order will be delivered here.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleChangeAddress}
                                        disabled={processing}
                                        className="shrink-0 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 disabled:opacity-50"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6">
                                {selectedAddress ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white">
                                                <CheckCircle2 size={19} className="text-emerald-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">
                                                        {selectedAddress.fullName}
                                                    </h3>
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                                        Selected
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-gray-700">
                                                    {selectedAddress.address}
                                                </p>
                                                {selectedAddress.landmark && (
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Landmark: {selectedAddress.landmark}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-sm text-gray-700">
                                                    {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                                                </p>
                                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                                    <Smartphone size={15} />
                                                    <span>{selectedAddress.phoneNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-700">
                                            No delivery address selected.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleChangeAddress}
                                            className="mt-2 text-sm font-bold text-red-700 underline"
                                        >
                                            Select Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <OrderItemsSection
                            items={cartItems || []}
                            showHeader={true}
                        />

                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                                        <CreditCard size={19} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                                            Payment Method
                                        </h2>
                                        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                            Choose your preferred payment option.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 sm:p-6">
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition sm:gap-4 ${paymentMethod === "COD"
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        } ${processing ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={paymentMethod === "COD"}
                                        onChange={() => setPaymentMethod("COD")}
                                        disabled={processing}
                                        className="h-4 w-4 shrink-0 accent-emerald-600"
                                    />
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
                                        <Truck size={19} className="text-gray-700" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                                        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                            Pay when your order is delivered.
                                        </p>
                                    </div>
                                    {paymentMethod === "COD" && (
                                        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                                    )}
                                </label>

                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition sm:gap-4 ${paymentMethod === "ONLINE"
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        } ${processing ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="ONLINE"
                                        checked={paymentMethod === "ONLINE"}
                                        onChange={() => setPaymentMethod("ONLINE")}
                                        disabled={processing}
                                        className="h-4 w-4 shrink-0 accent-emerald-600"
                                    />
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
                                        <WalletCards size={19} className="text-gray-700" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900">Online Payment</p>
                                        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                            Pay securely using Razorpay.
                                        </p>
                                    </div>
                                    {paymentMethod === "ONLINE" && (
                                        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                                    )}
                                </label>

                                <div className="flex items-start gap-2 pt-2 text-xs text-gray-500">
                                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                                    <span>
                                        Your payment information is securely processed. Card details are not stored by this application.
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="h-fit lg:sticky lg:top-24">
                        <SummaryCard
                            summary={summary}
                            showCoupon={false}
                            buttonText={
                                processing
                                    ? "Processing..."
                                    : paymentMethod === "COD"
                                        ? "Place Order"
                                        : "Pay Securely"
                            }
                            onButtonClick={handlePlaceOrder}
                            loading={processing}
                        />
                        <div className="mt-3 flex items-start gap-2 px-1 text-xs leading-5 text-gray-500">
                            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>
                                The server validates stock, price, delivery and the final payable amount before order creation.
                            </span>
                        </div>
                    </aside>
                </div>
            </main>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-500">Total Amount</p>
                        <p className="truncate text-base font-bold tabular-nums text-gray-900">
                            ₹{Number(summary?.total ?? summary?.grandTotal ?? summary?.finalTotal ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={processing || !selectedAddress?.id || !cartItems.length}
                        className="min-h-11 min-w-[150px] rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? "Processing..."
                            : paymentMethod === "COD"
                                ? "Place Order"
                                : "Pay Securely"}
                    </button>
                </div>
            </div>
        </div>
    );
}
