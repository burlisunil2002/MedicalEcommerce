import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Lock,
    MapPin,
    Plus,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import SummaryCard from "../components/SummaryCard";
import AddressCard from "../components/checkout/AddressCard";
import AddressForm from "../components/checkout/AddressForm";
import OrderItemsSection from "../components/checkout/OrderItemsSection";
import {
    getCheckout,
    addAddress,
    updateAddress,
    selectAddress,
} from "../services/checkoutService";

const CHECKOUT_CACHE_KEY = "medical_checkout_cache_v2";
const REVIEW_CACHE_KEY = "checkout_review_snapshot_v1";

const hasSummary = (value) =>
    value && typeof value === "object" && Object.keys(value).length > 0;

export default function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        items: cartContextItems,
        summary: cartContextSummary,
        loading: cartLoading,
    } = useCart();

    const [checkout, setCheckout] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [editingAddress, setEditingAddress] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);
    const [selectingAddress, setSelectingAddress] = useState(false);
    const [proceeding, setProceeding] = useState(false);

    const cartItems = useMemo(() => {
        if (Array.isArray(cartContextItems)) return cartContextItems;
        if (Array.isArray(checkout?.cartItems)) return checkout.cartItems;
        return [];
    }, [cartContextItems, checkout?.cartItems]);

    const summary = useMemo(() => {
        if (hasSummary(cartContextSummary)) return cartContextSummary;
        return checkout?.summary || {};
    }, [cartContextSummary, checkout?.summary]);

    const saveCheckoutCache = useCallback((nextAddresses, nextSelectedAddress) => {
        try {
            sessionStorage.setItem(
                CHECKOUT_CACHE_KEY,
                JSON.stringify({
                    addresses: nextAddresses || [],
                    selectedAddressId: nextSelectedAddress ?? null,
                    updatedAt: Date.now(),
                })
            );
        } catch (error) {
            console.warn("Checkout cache unavailable:", error);
        }
    }, []);

    const restoreCheckoutCache = useCallback(() => {
        try {
            const raw = sessionStorage.getItem(CHECKOUT_CACHE_KEY);
            if (!raw) return;

            const cached = JSON.parse(raw);
            const cachedAddresses = Array.isArray(cached?.addresses)
                ? cached.addresses
                : [];

            setAddresses(cachedAddresses);

            const cachedId = cached?.selectedAddressId;
            if (cachedId != null) {
                setSelectedAddress(cachedId);
                return;
            }

            const fallback =
                cachedAddresses.find((x) => x.isDefault === true) ||
                cachedAddresses[0];

            setSelectedAddress(fallback?.id ?? null);
        } catch (error) {
            console.warn("Checkout cache restore failed:", error);
        }
    }, []);

    const resolveSelectedAddress = useCallback(
        (nextAddresses, serverSelectedId = null) => {
            if (!Array.isArray(nextAddresses) || nextAddresses.length === 0) {
                setSelectedAddress(null);
                saveCheckoutCache([], null);
                return null;
            }

            const selected =
                nextAddresses.find(
                    (address) =>
                        serverSelectedId != null &&
                        String(address.id) === String(serverSelectedId)
                ) ||
                nextAddresses.find((address) => address.isDefault === true) ||
                nextAddresses[0];

            const selectedId = selected?.id ?? null;
            setSelectedAddress(selectedId);
            saveCheckoutCache(nextAddresses, selectedId);
            return selectedId;
        },
        [saveCheckoutCache]
    );

    const loadCheckout = useCallback(async () => {
        try {
            const response = await getCheckout();
            const data = response?.data || {};

            const serverAddresses = Array.isArray(data.addresses)
                ? data.addresses
                : [];

            setCheckout(data);
            setAddresses(serverAddresses);
            resolveSelectedAddress(
                serverAddresses,
                data.selectedAddressId
            );

            return data;
        } catch (error) {
            console.error("Checkout synchronization failed:", error);
            return null;
        } finally {
            setCheckoutLoading(false);
        }
    }, [resolveSelectedAddress]);

    useEffect(() => {
        restoreCheckoutCache();
        loadCheckout();
    }, [restoreCheckoutCache, loadCheckout]);

    useEffect(() => {
        if (!location.state?.refreshCheckout) return;

        loadCheckout();

        navigate(location.pathname, {
            replace: true,
            state: null,
        });
    }, [location.state?.refreshCheckout, location.pathname, navigate, loadCheckout]);

    const handleSaveAddress = useCallback(
        async (form) => {
            if (savingAddress) return;

            try {
                setSavingAddress(true);

                if (editingAddress?.id) {
                    await updateAddress(editingAddress.id, form);
                } else {
                    await addAddress(form);
                }

                await loadCheckout();
                setEditingAddress(null);
            } catch (error) {
                console.error("Address save failed:", error);
                window.alert(
                    error?.response?.data?.message ||
                    "Unable to save address. Please try again."
                );
            } finally {
                setSavingAddress(false);
            }
        },
        [savingAddress, editingAddress, loadCheckout]
    );

    const handleSelectAddress = useCallback(
        async (addressId) => {
            if (selectingAddress || !addressId) return;

            const previousId = selectedAddress;

            // Optimistic UI: selection changes immediately.
            setSelectedAddress(addressId);
            saveCheckoutCache(addresses, addressId);
            setSelectingAddress(true);

            try {
                await selectAddress(addressId);
            } catch (error) {
                console.error("Address selection failed:", error);
                setSelectedAddress(previousId);
                saveCheckoutCache(addresses, previousId);
                window.alert(
                    error?.response?.data?.message ||
                    "Unable to select this address. Please try again."
                );
            } finally {
                setSelectingAddress(false);
            }
        },
        [selectingAddress, selectedAddress, addresses, saveCheckoutCache]
    );

    const scrollToAddressForm = useCallback(() => {
        requestAnimationFrame(() => {
            document
                .getElementById("address-form")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, []);

    const handleEditAddress = useCallback(
        (address) => {
            if (savingAddress || proceeding) return;
            setEditingAddress(address);
            scrollToAddressForm();
        },
        [savingAddress, proceeding, scrollToAddressForm]
    );

    const handleAddNewAddress = useCallback(() => {
        if (savingAddress || proceeding) return;
        setEditingAddress({});
        scrollToAddressForm();
    }, [savingAddress, proceeding, scrollToAddressForm]);

    const handleCancelAddressEdit = useCallback(() => {
        if (!savingAddress) setEditingAddress(null);
    }, [savingAddress]);

    const selectedAddressObject = useMemo(
        () =>
            addresses.find(
                (address) => String(address.id) === String(selectedAddress)
            ) || null,
        [addresses, selectedAddress]
    );

    const handleProceedToReview = useCallback(() => {
        if (proceeding) return;

        if (!selectedAddressObject) {
            window.alert("Please select a delivery address.");
            return;
        }

        if (!cartItems.length) {
            window.alert("Your cart is empty.");
            navigate("/cart");
            return;
        }

        const snapshot = {
            checkout,
            cartItems,
            selectedAddress: selectedAddressObject,
            summary,
            selectedAddressId: selectedAddressObject.id,
            createdAt: Date.now(),
        };

        try {
            sessionStorage.setItem(
                REVIEW_CACHE_KEY,
                JSON.stringify(snapshot)
            );
        } catch (error) {
            console.warn("Review snapshot unavailable:", error);
        }

        // No API call here. Review renders from this snapshot immediately.
        setProceeding(true);
        navigate("/review", {
            state: { checkoutSnapshot: snapshot },
        });
    }, [
        proceeding,
        selectedAddressObject,
        cartItems,
        checkout,
        summary,
        navigate,
    ]);

    const isCartReady = Array.isArray(cartContextItems);
    const showEmptyCart =
        isCartReady &&
        !cartLoading &&
        !checkoutLoading &&
        cartItems.length === 0;

    if (showEmptyCart) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                        🛒
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-gray-900">
                        Your cart is empty
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        Add products to your cart before proceeding to checkout.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <header className="mb-5 sm:mb-7">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Cart</span>
                        </button>

                        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
                            <Lock size={14} className="text-emerald-600" />
                            Secure Checkout
                        </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Checkout Step 1 of 3
                            </p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                Checkout
                            </h1>
                            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">
                                Select your delivery address and review your items before continuing.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-7">
                    <main className="min-w-0 space-y-5 lg:col-span-2">
                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-5 sm:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={19} className="text-emerald-600" />
                                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                                Delivery Address
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Choose where your order should be delivered.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddNewAddress}
                                        disabled={savingAddress || proceeding}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus size={15} />
                                        Add New Address
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6">
                                {addresses.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {addresses.map((address) => (
                                            <AddressCard
                                                key={address.id}
                                                address={address}
                                                selected={
                                                    String(selectedAddress) ===
                                                    String(address.id)
                                                }
                                                selecting={selectingAddress}
                                                onSelect={() =>
                                                    handleSelectAddress(address.id)
                                                }
                                                onEdit={handleEditAddress}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
                                        <MapPin size={24} className="mx-auto text-emerald-600" />
                                        <h3 className="mt-4 text-base font-bold text-gray-900">
                                            Add a delivery address
                                        </h3>
                                        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-gray-500">
                                            Add your address to continue with checkout.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleAddNewAddress}
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                        >
                                            <Plus size={15} />
                                            Add Address
                                        </button>
                                    </div>
                                )}

                                {selectedAddressObject && (
                                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                                        <Check size={15} />
                                        <span className="min-w-0 flex-1">
                                            Delivering to your selected address.
                                        </span>
                                        {selectingAddress && (
                                            <span className="shrink-0">Saving...</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {editingAddress !== null && (
                            <section id="address-form" className="scroll-mt-24">
                                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {editingAddress?.id
                                                ? "Edit Address"
                                                : "Add Delivery Address"}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Enter accurate delivery details.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCancelAddressEdit}
                                        disabled={savingAddress}
                                        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <AddressForm
                                    initialData={editingAddress || {}}
                                    onSave={handleSaveAddress}
                                />
                            </section>
                        )}

                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                                <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                                    Your Items
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {cartItems.reduce(
                                        (total, item) => total + Math.max(0, Number(item?.quantity || 0)),
                                        0
                                    )} {cartItems.reduce(
                                        (total, item) => total + Math.max(0, Number(item?.quantity || 0)),
                                        0
                                    ) === 1 ? "item" : "items"} in your order
                                </p>
                            </div>
                            <OrderItemsSection
                                items={cartItems}
                                loading={checkoutLoading && !isCartReady}
                            />
                        </section>
                    </main>

                    <aside className="h-fit lg:sticky lg:top-24">
                        <SummaryCard
                            summary={summary}
                            showCoupon={false}
                            buttonText={proceeding ? "Opening Review..." : "Proceed To Review"}
                            onButtonClick={handleProceedToReview}
                            loading={proceeding}
                        />
                        <div className="mt-3 flex items-start gap-2 px-1 text-xs leading-5 text-gray-500">
                            <Lock size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>
                                Final stock, price and delivery information is validated by the server before payment.
                            </span>
                        </div>
                    </aside>
                </div>

                {cartItems.length > 0 && (
                    <div className="h-20 lg:hidden" />
                )}

                {cartItems.length > 0 && (
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6 lg:hidden">
                        <div className="mx-auto flex max-w-7xl items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-gray-500">Order Total</p>
                                <p className="truncate text-base font-bold tabular-nums text-gray-900">
                                    ₹{Number(summary?.total ?? summary?.grandTotal ?? summary?.finalTotal ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleProceedToReview}
                                disabled={proceeding || !selectedAddressObject}
                                className="flex min-h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {proceeding ? "Opening..." : "Proceed To Review"}
                                {!proceeding && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
