import { useState, useEffect } from "react";
export default function AddressForm({
    initialData = {},
    onSave
}) {
    const [form, setForm] =
        useState(initialData);

    const change = (e) =>
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    const validate = () => {

        if (!form.fullName?.trim()) {

            alert("Enter Full Name");

            return false;
        }

        if (form.fullName.trim().length < 3) {

            alert("Enter valid Full Name");

            return false;
        }

        if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {

            alert("Enter valid Mobile Number");

            return false;
        }

        if (!form.addressLine1?.trim()) {

            alert("Enter Address");

            return false;
        }

        if (form.addressLine1.length < 10) {

            alert("Enter complete Address");

            return false;
        }

        if (!form.city?.trim()) {

            alert("Enter City");

            return false;
        }

        if (!form.state?.trim()) {

            alert("Enter State");

            return false;
        }

        if (!/^\d{6}$/.test(form.pincode)) {

            alert("Enter valid Pincode");

            return false;
        }

        return true;
    };

    useEffect(() => {
        setForm({
            fullName: initialData?.fullName || "",
            mobileNumber: initialData?.mobileNumber || "",
            addressLine1: initialData?.addressLine1 || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            pincode: initialData?.pincode || "",
            addressType: initialData?.addressType || "Home"
        });
    }, [initialData]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow">

            <div className="grid md:grid-cols-2 gap-4">

                <input
                    name="fullName"
                    placeholder="Full Name"
                    onChange={change}
                    value={form.fullName || ""}
                    className="border p-3 rounded-xl"
                />

                <input
                    name="mobileNumber"
                    placeholder="Mobile Number"
                    onChange={change}
                    value={form.mobileNumber || ""}
                    className="border p-3 rounded-xl"
                />

                <input
                    name="addressLine1"
                    placeholder="Address"
                    onChange={change}
                    value={form.addressLine1 || ""}
                    className="border p-3 rounded-xl md:col-span-2"
                />

                <input
                    name="city"
                    placeholder="City"
                    onChange={change}
                    value={form.city || ""}
                    className="border p-3 rounded-xl"
                />

                <input
                    name="state"
                    placeholder="State"
                    onChange={change}
                    value={form.state || ""}
                    className="border p-3 rounded-xl"
                />

                <input
                    name="pincode"
                    placeholder="Pincode"
                    onChange={change}
                    value={form.pincode || ""}
                    className="border p-3 rounded-xl"
                />

            </div>

                <button
                onClick={() => {
                    console.log(form);

                    if (!validate()) return;

                    onSave(form);
                }}
                    className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl"
                >
                Save Address
            </button>
        </div>
    );
}