import { useState, useEffect } from "react";

const STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
];

export default function AddressForm({
    initialData = {},
    onSave
}) {

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({

        fullName: "",

        mobileNumber: "",

        addressLine1: "",

        addressLine2: "",

        landmark: "",

        city: "",

        state: "",

        pincode: "",

        addressType: "Home"

    });

    const [errors, setErrors] = useState({});

    useEffect(() => {

        setForm({

            fullName: initialData.fullName || "",

            mobileNumber: initialData.mobileNumber || "",

            addressLine1: initialData.addressLine1 || "",

            addressLine2: initialData.addressLine2 || "",

            landmark: initialData.landmark || "",

            city: initialData.city || "",

            state: initialData.state || "",

            pincode: initialData.pincode || "",

            addressType: initialData.addressType || "Home"

        });

    }, [initialData]);

    const change = (e) => {

        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        setErrors(prev => ({
            ...prev,
            [name]: ""
        }));

    };

    const validate = () => {

        let e = {};

        if (!form.fullName.trim()) {

            e.fullName = "Full Name is required";

        }
        else if (
            !/^[A-Za-z ]+$/.test(form.fullName)
        ) {

            e.fullName =
                "Only alphabets are allowed";

        }
        else if (
            form.fullName.trim().length < 3
        ) {

            e.fullName =
                "Enter valid Full Name";

        }

        if (
            !/^[6-9]\d{9}$/.test(
                form.mobileNumber
            )
        ) {

            e.mobileNumber =
                "Enter valid Mobile Number";

        }

        if (!form.addressLine1.trim()) {

            e.addressLine1 =
                "House No / Street is required";

        }
        else if (
            form.addressLine1.length < 10
        ) {

            e.addressLine1 =
                "Address is too short";

        }

        if (!form.city.trim()) {

            e.city = "Enter City";

        }
        else if (
            !/^[A-Za-z ]+$/.test(
                form.city
            )
        ) {

            e.city =
                "Invalid City";

        }

        if (!form.state) {

            e.state = "Select State";

        }

        if (
            !/^\d{6}$/.test(
                form.pincode
            )
        ) {

            e.pincode =
                "Invalid Pincode";

        }

        setErrors(e);

        return Object.keys(e).length === 0;

    };

    const save = async () => {

        if (!validate()) return;

        try {

            setLoading(true);

            await onSave(form);

        }
        finally {

            setLoading(false);

        }

    };

    return (

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Header */}

            <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50 to-white">

                <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">

                        📍

                    </div>

                    <div>

                        <h2 className="text-2xl font-bold text-gray-800">

                            {initialData?.id
                                ? "Edit Address"
                                : "Add New Address"}

                        </h2>

                        <p className="text-gray-500 text-sm mt-1">

                            Please enter your delivery details.

                        </p>

                    </div>

                </div>

            </div>

            <div className="p-6">

                <div className="grid lg:grid-cols-2 gap-5">

                    {/* Full Name */}

                    <div>

                        <label className="block text-sm font-semibold mb-2">

                            Full Name
                            <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={change}
                            placeholder="Enter your full name"
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.fullName
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        />

                        {errors.fullName &&

                            <p className="text-red-500 text-sm mt-1">

                                {errors.fullName}

                            </p>

                        }

                    </div>

                    {/* Mobile */}

                    <div>

                        <label className="block text-sm font-semibold mb-2">

                            Mobile Number
                            <span className="text-red-500">*</span>

                        </label>

                        <input
                            type="tel"
                            maxLength={10}
                            name="mobileNumber"
                            value={form.mobileNumber}
                            onChange={change}
                            placeholder="10 Digit Mobile Number"
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.mobileNumber
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        />

                        {errors.mobileNumber &&

                            <p className="text-red-500 text-sm mt-1">

                                {errors.mobileNumber}

                            </p>

                        }

                    </div>

                    {/* Address Line 1 */}

                    <div className="lg:col-span-2">

                        <label className="block text-sm font-semibold mb-2">

                            House No / Building / Street
                            <span className="text-red-500">*</span>

                        </label>

                        <input
                            name="addressLine1"
                            value={form.addressLine1}
                            onChange={change}
                            placeholder="Flat No, Apartment, Street"
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.addressLine1
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        />

                        {errors.addressLine1 &&

                            <p className="text-red-500 text-sm mt-1">

                                {errors.addressLine1}

                            </p>

                        }

                    </div>

                    {/* Address Line 2 */}

                    <div className="lg:col-span-2">

                        <label className="block text-sm font-semibold mb-2">

                            Area / Locality

                        </label>

                        <input
                            name="addressLine2"
                            value={form.addressLine2}
                            onChange={change}
                            placeholder="Area, Colony, Locality"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 outline-none"
                        />

                    </div>

                    {/* Landmark */}

                    <div className="lg:col-span-2">

                        <label className="block text-sm font-semibold mb-2">

                            Landmark

                        </label>

                        <input
                            name="landmark"
                            value={form.landmark}
                            onChange={change}
                            placeholder="Near Temple / School / Hospital"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 outline-none"
                        />

                    </div>
                    {/* City */}

                    <div>

                        <label className="block text-sm font-semibold mb-2">

                            City
                            <span className="text-red-500">*</span>

                        </label>

                        <input
                            name="city"
                            value={form.city}
                            onChange={change}
                            placeholder="Enter City"
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.city
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        />

                        {errors.city && (

                            <p className="text-red-500 text-sm mt-1">

                                {errors.city}

                            </p>

                        )}

                    </div>

                    {/* State */}

                    <div>

                        <label className="block text-sm font-semibold mb-2">

                            State
                            <span className="text-red-500">*</span>

                        </label>

                        <select
                            name="state"
                            value={form.state}
                            onChange={change}
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.state
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        >

                            <option value="">

                                Select State

                            </option>

                            {STATES.map(state => (

                                <option
                                    key={state}
                                    value={state}
                                >

                                    {state}

                                </option>

                            ))}

                        </select>

                        {errors.state && (

                            <p className="text-red-500 text-sm mt-1">

                                {errors.state}

                            </p>

                        )}

                    </div>

                    {/* Pincode */}

                    <div>

                        <label className="block text-sm font-semibold mb-2">

                            Pincode
                            <span className="text-red-500">*</span>

                        </label>

                        <input
                            maxLength={6}
                            name="pincode"
                            value={form.pincode}
                            onChange={change}
                            placeholder="6 Digit Pincode"
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    ${errors.pincode
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-emerald-500"
                                }`}
                        />

                        {errors.pincode && (

                            <p className="text-red-500 text-sm mt-1">

                                {errors.pincode}

                            </p>

                        )}

                    </div>

                </div>

                {/* Address Type */}

                <div className="mt-8">

                    <label className="block text-sm font-semibold mb-4">

                        Address Type

                    </label>

                    <div className="grid grid-cols-3 gap-4">

                        {["Home", "Office", "Other"].map(type => (

                            <button
                                key={type}
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        addressType: type
                                    })
                                }
                                className={`rounded-2xl border-2 py-4 transition-all duration-300
                        ${form.addressType === type
                                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 hover:border-emerald-400"
                                    }`}
                            >

                                <div className="text-3xl">

                                    {type === "Home"
                                        ? "🏠"
                                        : type === "Office"
                                            ? "🏢"
                                            : "📍"}

                                </div>

                                <div className="font-semibold mt-2">

                                    {type}

                                </div>

                            </button>

                        ))}

                    </div>

                </div>

                {/* Footer */}

                <div className="mt-10 border-t pt-6 flex flex-col-reverse sm:flex-row justify-end gap-4">

                    {initialData?.id && (

                        <button
                            type="button"
                            onClick={() => {

                                setForm({
                                    fullName: "",
                                    mobileNumber: "",
                                    addressLine1: "",
                                    addressLine2: "",
                                    landmark: "",
                                    city: "",
                                    state: "",
                                    pincode: "",
                                    addressType: "Home"
                                });

                                setErrors({});

                            }}
                            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                        >

                            Cancel

                        </button>

                    )}

                    <button
                        type="button"
                        onClick={save}
                        disabled={loading}
                        className={`px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg
                ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02]"
                            }`}
                    >

                        {loading
                            ? (
                                <div className="flex items-center justify-center gap-2">

                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >

                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />

                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        />

                                    </svg>

                                    Saving...

                                </div>
                            )
                            : (
                                initialData?.id
                                    ? "Update Address"
                                    : "Save Address"
                            )}

                    </button>

                </div>

            </div>

        </div>

    );
}