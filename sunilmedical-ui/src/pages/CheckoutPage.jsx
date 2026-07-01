import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../components/SummaryCard";
import AddressCard from "../components/checkout/AddressCard";
import AddressForm from "../components/checkout/AddressForm";

import {
    getCheckout,
    addAddress,
    updateAddress
} from "../services/checkoutService";

export default function CheckoutPage() {

    const navigate = useNavigate();

    const [checkout, setCheckout] = useState(null);

    const [selectedAddress, setSelectedAddress] =
        useState(null);

    const [editingAddress, setEditingAddress] =
        useState(null);

    const loadCheckout = async () => {
        try {
            const res = await getCheckout();

            setCheckout(res.data);

            if (res.data.addresses?.length > 0) {

                const defaultAddress =
                    res.data.addresses.find(x => x.isDefault);

                // if default exists select it
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress.id);
                }

                // otherwise select latest added address
                else {
                    setSelectedAddress(
                        res.data.addresses[0].id
                    );
                }
            }

            // clear edit form after reload
            setEditingAddress(null);

        } catch (err) {
            console.error(
                "Checkout load failed:",
                err
            );
        }
    };

    useEffect(() => {
        loadCheckout();
    }, []);

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

        } catch (err) {

            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Unable to save address.";

            alert(message);

            console.error(err);
        }
    };

    if (!checkout || !checkout.summary) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">
                        Loading checkout...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8">

            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white p-6 rounded-3xl shadow-sm">

                        <div className="flex justify-between mb-5">

                            <h2 className="text-2xl font-bold">
                                Delivery Address
                            </h2>

                            <button
                                onClick={() => navigate("/cart")}
                                className="mb-4 flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium"
                            >
                                ← Back to Cart
                            </button>

                        </div>

                        <div className="space-y-4">
                            {checkout?.addresses?.length > 0 ? (
                                checkout.addresses.map((a) => (
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
                                    No address added yet
                                </p>
                            )}

                        </div>

                    </div>

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
                    onButtonClick={() => {
                        if (!selectedAddress) {
                            alert("Please select delivery address");
                            return;
                        }

                        navigate("/review");
                    }}
                    />
                </div>

            </div>
        </div>
    );
}