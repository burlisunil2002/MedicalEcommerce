import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SummaryCard from "../components/SummaryCard";
import AddressCard from "../components/checkout/AddressCard";
import AddressForm from "../components/checkout/AddressForm";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";
import OrderItemsSection from "../components/checkout/OrderItemsSection";

import {
    getCheckout,
    addAddress,
    updateAddress,
    selectAddress
} from "../services/checkoutService";


export default function CheckoutPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const [checkout, setCheckout] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [editingAddress, setEditingAddress] = useState(null);

    const [pageLoading, setPageLoading] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);
    const [selectingAddress, setSelectingAddress] = useState(false);
    const [proceeding, setProceeding] = useState(false);


    // =====================================================
    // LOAD CHECKOUT
    // =====================================================

    const loadCheckout = async (showLoader = true) => {

        try {

            if (showLoader) {
                setPageLoading(true);
            }

            const res = await getCheckout();

            const data = res?.data || {};

            setCheckout(data);

            setCartItems(data.cartItems || []);


            // ---------------------------------------------
            // SELECT ADDRESS
            // ---------------------------------------------

            if (data.addresses?.length > 0) {

                let selected = null;

                // Previously selected address
                if (data.selectedAddressId) {

                    selected = data.addresses.find(
                        address =>
                            address.id ===
                            data.selectedAddressId
                    );

                }

                // Default address
                if (!selected) {

                    selected = data.addresses.find(
                        address =>
                            address.isDefault === true
                    );

                }

                // First address
                if (!selected) {

                    selected = data.addresses[0];

                }

                setSelectedAddress(
                    selected?.id || null
                );

            } else {

                setSelectedAddress(null);

            }

            setEditingAddress(null);

        } catch (error) {

            console.error(
                "Checkout load failed:",
                error
            );

        } finally {

            if (showLoader) {
                setPageLoading(false);
            }

        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadCheckout(true);

    }, []);


    // =====================================================
    // REFRESH WHEN RETURNING FROM ANOTHER PAGE
    // =====================================================

    useEffect(() => {

        if (!location.state?.refreshCheckout) {
            return;
        }

        loadCheckout(false);

        // Remove refresh flag from browser history
        navigate(
            location.pathname,
            {
                replace: true,
                state: null
            }
        );

    }, [location.state, location.pathname, navigate]);


    // =====================================================
    // SAVE ADDRESS
    // =====================================================

    const handleSaveAddress = async (form) => {

        try {

            setSavingAddress(true);

            if (editingAddress) {

                await updateAddress(
                    editingAddress.id,
                    form
                );

            } else {

                await addAddress(form);

            }

            // Refresh checkout without full-page loader
            await loadCheckout(false);

        } catch (error) {

            console.error(
                "Address save failed:",
                error
            );

            const message =
                error?.response?.data?.message ||
                "Unable to save address.";

            alert(message);

        } finally {

            setSavingAddress(false);

        }
    };


    // =====================================================
    // SELECT ADDRESS
    // =====================================================

    const handleSelectAddress = async (addressId) => {

        if (selectingAddress) {
            return;
        }

        try {

            setSelectingAddress(true);

            await selectAddress(addressId);

            setSelectedAddress(addressId);

        } catch (error) {

            console.error(
                "Address selection failed:",
                error
            );

            alert(
                "Unable to select this address."
            );

        } finally {

            setSelectingAddress(false);

        }
    };


    // =====================================================
    // PROCEED TO REVIEW
    // =====================================================

    const handleProceedToReview = async () => {

        if (!selectedAddress) {

            alert(
                "Please select a delivery address."
            );

            return;
        }

        if (proceeding) {
            return;
        }

        try {

            setProceeding(true);

            await selectAddress(
                selectedAddress
            );

            navigate("/review");

        } catch (error) {

            console.error(
                "Proceed to review failed:",
                error
            );

            alert(
                "Unable to save selected address."
            );

            setProceeding(false);
        }
    };


    // =====================================================
    // INITIAL PAGE LOADER
    // =====================================================

    if (pageLoading) {

        return (
            <SmallCubeLoader
                title="Preparing Checkout"
                subtitle="Loading your delivery details..."
            />
        );

    }


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div className="mb-6">

                    <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            bg-white
                            border
                            border-gray-200
                            rounded-xl
                            text-gray-700
                            font-medium
                            shadow-sm
                            hover:border-pink-300
                            hover:text-pink-600
                            transition
                        "
                    >
                        <span className="text-lg">
                            ←
                        </span>

                        <span>
                            Back to Cart
                        </span>
                    </button>


                    <div className="mt-5">

                        <h1 className="
                            text-2xl
                            sm:text-3xl
                            font-bold
                            text-gray-900
                        ">
                            Checkout
                        </h1>

                        <p className="
                            mt-1
                            text-sm
                            text-gray-500
                        ">
                            Confirm your delivery details before continuing.
                        </p>

                    </div>

                </div>


                {/* ================================================= */}
                {/* MAIN CONTENT */}
                {/* ================================================= */}

                <div className="
                    grid
                    grid-cols-1
                    lg:grid-cols-3
                    gap-6
                ">

                    {/* ================================================= */}
                    {/* LEFT COLUMN */}
                    {/* ================================================= */}

                    <div className="
                        lg:col-span-2
                        space-y-6
                    ">


                        {/* DELIVERY ADDRESS */}

                        <section className="
                            bg-white
                            rounded-3xl
                            border
                            border-gray-200
                            shadow-sm
                            p-5
                            sm:p-6
                        ">

                            <div className="mb-5">

                                <h2 className="
                                    text-xl
                                    sm:text-xl
                                    font-bold
                                    text-gray-900
                                ">
                                    Delivery Address
                                </h2>

                                <p className="
                                    mt-1
                                    text-sm
                                    text-gray-500
                                ">
                                    Select where you want your order delivered.
                                </p>

                            </div>


                            {/* ADDRESS LIST */}

                            {checkout?.addresses?.length > 0 ? (

                                <div className="space-y-4">

                                    {checkout.addresses.map(
                                        address => (

                                            <AddressCard
                                                key={address.id}
                                                address={address}
                                                selected={
                                                    selectedAddress ===
                                                    address.id
                                                }
                                                onSelect={() =>
                                                    handleSelectAddress(
                                                        address.id
                                                    )
                                                }
                                                onEdit={
                                                    setEditingAddress
                                                }
                                            />

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="
                                    border
                                    border-dashed
                                    border-gray-300
                                    rounded-2xl
                                    p-6
                                    text-center
                                ">

                                    <p className="
                                        text-sm
                                        text-gray-500
                                    ">
                                        No delivery address added yet.
                                    </p>

                                </div>

                            )}

                        </section>


                        {/* ORDER ITEMS */}

                        <section>

                            <OrderItemsSection
                                items={cartItems}
                            />

                        </section>


                        {/* ADDRESS FORM */}

                        <section>

                            <AddressForm
                                initialData={
                                    editingAddress || {}
                                }
                                onSave={
                                    handleSaveAddress
                                }
                            />

                        </section>

                    </div>


                    {/* ================================================= */}
                    {/* RIGHT COLUMN */}
                    {/* ================================================= */}

                    <aside className="
                        self-start
                        lg:sticky
                        lg:top-24
                    ">

                        <SummaryCard
                            summary={
                                checkout?.summary || {}
                            }
                            showCoupon={false}
                            buttonText={
                                proceeding
                                    ? "Preparing Review..."
                                    : "Proceed To Review"
                            }
                            onButtonClick={
                                handleProceedToReview
                            }
                        />

                    </aside>

                </div>


                {/* ================================================= */}
                {/* MOBILE BACK BUTTON */}
                {/* ================================================= */}

                <div className="
                    mt-6
                    lg:hidden
                ">

                    <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="
                            w-full
                            py-3
                            bg-white
                            border
                            border-gray-200
                            rounded-xl
                            text-gray-700
                            font-medium
                            hover:border-pink-300
                            hover:text-pink-600
                            transition
                        "
                    >
                        ← Back to Cart
                    </button>

                </div>

            </div>

        </div>
    );
}