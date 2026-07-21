import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

    const [selectedAddress, setSelectedAddress] =
        useState(null);

    const [editingAddress, setEditingAddress] =
        useState(null);

    const [pageLoading, setPageLoading] = useState(true);


    const loadCheckout = async () => {

        try {

            setPageLoading(true);

            const res = await getCheckout();

            setCheckout(res.data);

            setCartItems(res.data.cartItems || []);

            if (res.data.addresses?.length > 0) {

                let selected =
                    res.data.addresses.find(
                        x => x.id === res.data.selectedAddressId
                    );

                if (!selected)
                    selected =
                        res.data.addresses.find(
                            x => x.isDefault
                        );

                if (!selected)
                    selected =
                        res.data.addresses[0];

                setSelectedAddress(selected.id);
            }

            setEditingAddress(null);

        }
        catch (err) {

            console.error("Checkout load failed:", err);

        }
        finally {
            setPageLoading(false);

        }

    };

    useEffect(() => {

        loadCheckout();

    }, []);

    useEffect(() => {

        if (location.state?.refreshCheckout) {

            loadCheckout();

            navigate(
                location.pathname,
                {
                    replace: true,
                    state: null
                }
            );

        }

    }, [location.state]);

    const handleSaveAddress = async (form) => {

        try {

            if (editingAddress) {

                await updateAddress(
                    editingAddress.id,
                    form
                );

            } else {

                await addAddress(form);

            }

            await loadCheckout();

        }
        catch (err) {

            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Unable to save address.";

            alert(message);

        }
        finally {

        }

    };

    if (pageLoading) {
        return (
            <SmallCubeLoader
                title="Preparing Checkout"
                subtitle="Loading your addresses..."
            />
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8">

            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    {/* Delivery Address */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm">

                        <div className="flex items-center justify-between mb-5">

                            <h2 className="text-2xl font-bold">
                                Delivery Address
                            </h2>

                            <button
                                onClick={() => navigate("/cart")}
                                className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 font-medium"
                            >
                                ← Back to Cart
                            </button>

                        </div>

                        <div className="space-y-4">

                            {checkout?.addresses?.length > 0 ? (
                                checkout.addresses.map(a => (
                                    <AddressCard
                                        key={a.id}
                                        address={a}
                                        selected={selectedAddress === a.id}
                                        onSelect={async () => {
                                            await selectAddress(a.id);
                                            setSelectedAddress(a.id);
                                        }}
                                        onEdit={setEditingAddress}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500">
                                    No address added yet.
                                </p>
                            )}

                        </div>

                    </div>

                    {/* Order Items */}
                    <OrderItemsSection
                        items={cartItems}
                    />

                    {/* Address Form */}
                    <AddressForm
                        initialData={editingAddress || {}}
                        onSave={handleSaveAddress}
                    />

                </div>

                <div className="self-start lg:sticky lg:top-24 h-fit">

                    <SummaryCard
                        summary={checkout?.summary || {}}
                        showCoupon={false}
                        buttonText="Proceed To Review"
                        onButtonClick={async () => {

                            if (!selectedAddress) {
                                alert("Please select delivery address");
                                return;
                            }

                            try {

                                await selectAddress(selectedAddress);

                                navigate("/review");

                            } catch {

                                alert("Unable to save selected address.");

                            }

                        }}
                    />

                </div>

            </div>
        </div>
    );
}