import { useState } from "react";
import API from "../services/api";

export default function KycRegister() {

    const [form, setForm] = useState({
        CompanyName: "",
        CustomerName: "",
        IndustrySector: "",
        MobileNo: "",
        Email: "",
        SecondaryEmail: "",
        SecondaryMobile: "",
        GSTNo: "",
        PANNo: "",
        Address: "",
        AcceptPrivacy: false
    });

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.AcceptPrivacy) {
            alert("Please accept privacy policy");
            return;
        }

        const data = new FormData();

        Object.keys(form).forEach(key => {
            data.append(key, form[key]);
        });

        if (file) data.append("Document", file);

        try {
            setLoading(true);

            const res = await API.post("/api/account/register", data);
            alert(res.data.message || "KYC Completed");
            window.location.href = "/";
        } catch (err) {
            alert(err.response?.data?.message || "Error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">

                <div className="w-full max-w-6xl grid md:grid-cols-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">

                    {/* LEFT PANEL */}
                    <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-purple-700 text-white p-10">
                        <h2 className="text-4xl font-bold mb-4">Join Us 🚀</h2>
                        <p className="text-center text-blue-100">
                            Manage your orders, invoices and business seamlessly.
                        </p>
                    </div>

                    {/* FORM SIDE */}
                    <div className="p-8 md:p-10">

                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            Create Account
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Fill in your business details
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">

                            <input className="input" placeholder="Company Name"
                                onChange={e => handleChange("CompanyName", e.target.value)} />

                            <input className="input" placeholder="Customer Name"
                                onChange={e => handleChange("CustomerName", e.target.value)} />

                            <input className="input" placeholder="Industry"
                                onChange={e => handleChange("IndustrySector", e.target.value)} />

                            <input className="input" placeholder="Mobile Number"
                                onChange={e => handleChange("MobileNo", e.target.value)} />

                            <input className="input" placeholder="Email"
                                onChange={e => handleChange("Email", e.target.value)} />

                            <input className="input" placeholder="Secondary Email"
                                onChange={e => handleChange("SecondaryEmail", e.target.value)} />

                            <input className="input" placeholder="Secondary Mobile"
                                onChange={e => handleChange("SecondaryMobile", e.target.value)} />

                            <input className="input uppercase" placeholder="GST Number"
                                onChange={e => handleChange("GSTNo", e.target.value.toUpperCase())} />

                            <input className="input uppercase" placeholder="PAN Number"
                                onChange={e => handleChange("PANNo", e.target.value.toUpperCase())} />

                            <textarea className="input md:col-span-2"
                                placeholder="Full Address"
                                onChange={e => handleChange("Address", e.target.value)} />

                            <input type="file"
                                className="md:col-span-2"
                                onChange={e => setFile(e.target.files[0])} />

                        </div>

                        {/* PRIVACY */}
                        <div className="flex items-center mt-5">
                            <input
                                type="checkbox"
                                className="mr-2"
                                onChange={e => handleChange("AcceptPrivacy", e.target.checked)}
                            />
                            <span className="text-sm text-gray-600">
                                I accept Privacy Policy
                            </span>
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={handleSubmit}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                            ) : (
                                "Register Now"
                            )}
                        </button>

                    </div>

                </div>

            </div>

    );
}