import React, { memo, useCallback, useEffect, useState } from "react";

const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha",
    "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
    "Uttarakhand", "West Bengal"
];

const EMPTY_FORM = {
    fullName: "",
    mobileNumber: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home"
};

const inputClass = (error) =>
    `w-full min-h-12 rounded-xl border px-4 py-3 text-sm sm:text-base outline-none transition
    ${error
        ? "border-red-500 bg-red-50 focus:border-red-500"
        : "border-gray-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"}`;

const cleanName = (value) =>
    value
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ.' -]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, 60);

const cleanLetters = (value, max = 60) =>
    value
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ.' -]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, max);

const cleanDigits = (value, max) =>
    value.replace(/\D/g, "").slice(0, max);

const cleanAddress = (value, max) =>
    value
        .replace(/[<>]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, max);

const Field = memo(function Field({
    label,
    required = false,
    optional = false,
    error,
    children
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
                {label}
                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
                {optional && (
                    <span className="text-gray-400 font-normal ml-1">
                        (optional)
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p
                    className="text-red-500 text-xs sm:text-sm mt-1.5"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
});

function AddressForm({ initialData = {}, onSave }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEditing = Boolean(initialData?.id);

    useEffect(() => {
        setForm({
            ...EMPTY_FORM,
            fullName: initialData?.fullName || "",
            mobileNumber: initialData?.mobileNumber || "",
            addressLine1: initialData?.addressLine1 || "",
            addressLine2: initialData?.addressLine2 || "",
            landmark: initialData?.landmark || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            pincode: initialData?.pincode || "",
            addressType: initialData?.addressType || "Home"
        });
        setErrors({});
    }, [initialData]);

    const change = useCallback((event) => {
        const { name, value } = event.target;

        const cleaners = {
            fullName: (v) => cleanName(v),
            mobileNumber: (v) => cleanDigits(v, 10),
            addressLine1: (v) => cleanAddress(v, 150),
            addressLine2: (v) => cleanAddress(v, 100),
            landmark: (v) => cleanAddress(v, 80),
            city: (v) => cleanLetters(v, 60),
            pincode: (v) => cleanDigits(v, 6)
        };

        const nextValue = cleaners[name]
            ? cleaners[name](value)
            : value;

        setForm((prev) => ({
            ...prev,
            [name]: nextValue
        }));

        setErrors((prev) => {
            if (!prev[name]) return prev;

            const next = { ...prev };
            delete next[name];
            return next;
        });
    }, []);

    const validate = useCallback(() => {
        const e = {};

        const fullName = form.fullName.trim();
        const mobile = form.mobileNumber.trim();
        const line1 = form.addressLine1.trim();
        const line2 = form.addressLine2.trim();
        const landmark = form.landmark.trim();
        const city = form.city.trim();
        const pincode = form.pincode.trim();

        if (!fullName) {
            e.fullName = "Enter your full name";
        } else if (fullName.length < 3) {
            e.fullName = "Enter a valid name";
        } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(fullName)) {
            e.fullName = "Use letters only";
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            e.mobileNumber = "Enter a valid 10-digit mobile number";
        }

        if (!line1) {
            e.addressLine1 =
                "Enter your house, flat, building or street";
        } else if (line1.length < 5) {
            e.addressLine1 = "Enter a more complete address";
        }

        if (line2 && line2.length < 2) {
            e.addressLine2 =
                "Enter a valid locality or leave this blank";
        }

        if (landmark && landmark.length < 2) {
            e.landmark =
                "Enter a valid landmark or leave this blank";
        }

        if (!city) {
            e.city = "Enter your city";
        } else if (
            !/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(city)
        ) {
            e.city = "Use letters only";
        } else if (city.length < 2) {
            e.city = "Enter a valid city";
        }

        if (!STATES.includes(form.state)) {
            e.state = "Select your state";
        }

        if (!/^\d{6}$/.test(pincode)) {
            e.pincode = "Enter a valid 6-digit pincode";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    }, [form]);

    const save = useCallback(async () => {
        if (loading || !onSave || !validate()) return;

        const payload = {
            ...form,
            fullName: form.fullName.trim(),
            mobileNumber: form.mobileNumber.trim(),
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim(),
            landmark: form.landmark.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim()
        };

        try {
            setLoading(true);
            await onSave(payload);
        } finally {
            setLoading(false);
        }
    }, [form, loading, onSave, validate]);

    const reset = useCallback(() => {
        setForm(EMPTY_FORM);
        setErrors({});
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-gradient-to-r from-emerald-50 to-white">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {isEditing ? "Edit Address" : "Add New Address"}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                    Enter your delivery address accurately.
                </p>
            </div>

            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    <Field
                        label="Full Name"
                        required
                        error={errors.fullName}
                    >
                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={change}
                            placeholder="Enter full name"
                            autoComplete="name"
                            maxLength={60}
                            className={inputClass(errors.fullName)}
                        />
                    </Field>

                    <Field
                        label="Mobile Number"
                        required
                        error={errors.mobileNumber}
                    >
                        <input
                            type="tel"
                            name="mobileNumber"
                            value={form.mobileNumber}
                            onChange={change}
                            placeholder="10-digit mobile number"
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            className={inputClass(errors.mobileNumber)}
                        />
                    </Field>

                    <div className="lg:col-span-2">
                        <Field
                            label="House No / Building / Street"
                            required
                            error={errors.addressLine1}
                        >
                            <input
                                type="text"
                                name="addressLine1"
                                value={form.addressLine1}
                                onChange={change}
                                placeholder="Flat / House No, Building, Street"
                                autoComplete="street-address"
                                maxLength={150}
                                className={inputClass(errors.addressLine1)}
                            />
                        </Field>
                    </div>

                    <div className="lg:col-span-2">
                        <Field
                            label="Area / Locality"
                            optional
                            error={errors.addressLine2}
                        >
                            <input
                                type="text"
                                name="addressLine2"
                                value={form.addressLine2}
                                onChange={change}
                                placeholder="Area, Colony, Locality"
                                autoComplete="address-line2"
                                maxLength={100}
                                className={inputClass(errors.addressLine2)}
                            />
                        </Field>
                    </div>

                    <div className="lg:col-span-2">
                        <Field
                            label="Landmark"
                            optional
                            error={errors.landmark}
                        >
                            <input
                                type="text"
                                name="landmark"
                                value={form.landmark}
                                onChange={change}
                                placeholder="Nearby hospital, school, temple, etc."
                                maxLength={80}
                                className={inputClass(errors.landmark)}
                            />
                        </Field>
                    </div>

                    <Field
                        label="City"
                        required
                        error={errors.city}
                    >
                        <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={change}
                            placeholder="Enter city"
                            autoComplete="address-level2"
                            maxLength={60}
                            className={inputClass(errors.city)}
                        />
                    </Field>

                    <Field
                        label="State"
                        required
                        error={errors.state}
                    >
                        <select
                            name="state"
                            value={form.state}
                            onChange={change}
                            autoComplete="address-level1"
                            className={inputClass(errors.state)}
                        >
                            <option value="">
                                Select state
                            </option>

                            {STATES.map((state) => (
                                <option
                                    key={state}
                                    value={state}
                                >
                                    {state}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field
                        label="Pincode"
                        required
                        error={errors.pincode}
                    >
                        <input
                            type="text"
                            name="pincode"
                            value={form.pincode}
                            onChange={change}
                            placeholder="6-digit pincode"
                            autoComplete="postal-code"
                            inputMode="numeric"
                            maxLength={6}
                            className={inputClass(errors.pincode)}
                        />
                    </Field>
                </div>

                <div className="mt-6 sm:mt-8">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Address Type
                    </label>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {["Home", "Office", "Other"].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        addressType: type
                                    }))
                                }
                                className={`rounded-xl sm:rounded-2xl border-2 py-3 sm:py-4 px-2 font-semibold text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500
                                ${form.addressType === type
                                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 text-gray-700 hover:border-emerald-400"
                                    }`}
                                aria-pressed={
                                    form.addressType === type
                                }
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 border-t pt-5 sm:pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={reset}
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Reset
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={save}
                        disabled={loading}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        {loading
                            ? "Saving..."
                            : isEditing
                                ? "Update Address"
                                : "Save Address"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(AddressForm);
