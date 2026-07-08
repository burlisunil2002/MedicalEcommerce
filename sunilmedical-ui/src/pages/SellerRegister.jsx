import { useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";



import {
    Building2,
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    MapPin,
    Landmark,
    BadgeCheck,
    ArrowRight
} from "lucide-react";

export default function SellerRegister() {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState("");

    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({

        businessName: "",

        ownerName: "",

        productType: "",

        brand: "",

        email: "",

        phone: "",

        password: "",

        gstNumber: "",

        pan: "",

        address: "",

        city: "",

        state: "",

        pincode: "",

        accountHolder: "",

        accountNumber: "",

        ifsc: "",

        bankName: ""

    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return;

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setSuccess(false);

        try {

            // Basic Validation

            if (formData.password.length < 8) {
                setLoading(false);
                setMessage("Password should be minimum 8 characters.");
                return;
            }

            const phoneRegex = /^[6-9]\d{9}$/;

            if (!phoneRegex.test(formData.phone)) {
                setMessage("Invalid mobile number.");
                return;
            }

            if (formData.pincode.length !== 6) {
                setLoading(false);
                setMessage("Enter a valid pincode.");
                return;
            }

            const response = await API.post(
                "/Seller/register",
                formData
            );

            if (response.data.success) {

                setSuccess(true);

                setMessage(response.data.message);

                setTimeout(() => {

                    navigate(response.data.redirectUrl);

                }, 1500);

            }
            else {

                setMessage(response.data.message);

            }

        }
        catch (err) {

            console.error(err);

            setMessage(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );

        }
        finally {

            setLoading(false);

        }

    };

    return (

        <>

            <div className="min-h-screen bg-slate-100">

                <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600">

                    <div className="absolute inset-0 opacity-30">

                        <div className="absolute w-96 h-96 rounded-full bg-white blur-3xl -top-40 -left-20"></div>

                        <div className="absolute w-96 h-96 rounded-full bg-cyan-300 blur-3xl bottom-0 right-0"></div>

                    </div>

                    <div className="relative max-w-7xl mx-auto px-6 py-20">

                        <div className="grid lg:grid-cols-2 gap-12 items-center">

                            <div>

                                <motion.h1

                                    initial={{ opacity: 0, y: 30 }}

                                    animate={{ opacity: 1, y: 0 }}

                                    className="text-6xl font-black text-white leading-tight">

                                    Become a Trusted

                                    <span className="block text-cyan-300">

                                        Medical Seller

                                    </span>

                                </motion.h1>

                                <p className="mt-6 text-blue-100 text-lg">

                                    Join thousands of verified medical suppliers selling to hospitals, clinics and distributors across India.

                                </p>

                                <div className="flex gap-4 mt-10">

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-4 text-white">

                                        <h2 className="text-2xl font-bold">

                                            10K+

                                        </h2>

                                        <p>Products</p>

                                    </div>

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-4 text-white">

                                        <h2 className="text-2xl font-bold">

                                            5000+

                                        </h2>

                                        <p>Buyers</p>

                                    </div>

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-4 text-white">

                                        <h2 className="text-2xl font-bold">

                                            100+

                                        </h2>

                                        <p>Sellers</p>

                                    </div>

                                </div>

                            </div>

                            <div>

                                
                                <img
                                    loading="lazy"
                                    src="/images/sellerimage.jpg"
                                    alt="Seller Registration"
                                    className="rounded-3xl shadow-2xl border-8 border-white/20 object-cover w-full"
                                />
                                 

                            </div>

                        </div>

                    </div>

                </div>

                <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">

                    <div className="bg-white rounded-3xl shadow-2xl p-10">

                        <div className="flex justify-between items-center">

                            <div>

                                <h2 className="text-4xl font-bold">

                                    Seller Registration

                                </h2>

                                <p className="text-gray-500 mt-2">

                                    Fill all required information.

                                </p>

                            </div>

                            <div>

                            <button
                                onClick={() => navigate("/seller-home")}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
                            >
                                <ArrowLeft size={18} />
                                Back to Seller Home
                                </button>

                            </div>

                        </div>

                        {
                            message &&
                            (
                                <div
                                    className={`mb-8 rounded-xl p-4 font-medium ${success
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-red-100 text-red-700 border border-red-300"
                                        }`}
                                >
                                    {message}
                                </div>
                            )
                        }

                        <form
                            onSubmit={handleSubmit}
                            className="grid lg:grid-cols-2 gap-8 mt-10"
                        >

                            {/* ================= BUSINESS DETAILS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-8 border">

                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                    <Building2 className="text-blue-600" />
                                    Business Information
                                </h2>

                                {/* Business Name */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Business Name
                                    </label>

                                    <input
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        placeholder="ABC Medical Pvt Ltd"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Owner */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Owner Name
                                    </label>

                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Brand */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Brand
                                    </label>

                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        placeholder="Philips / Medline"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                    />

                                </div>

                                {/* Product Type */}

                                <div>

                                    <label className="font-medium text-gray-700">
                                        Product Type
                                    </label>

                                    <select
                                        name="productType"
                                        value={formData.productType}
                                        onChange={handleChange}
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >

                                        <option value="">
                                            Select Product Type
                                        </option>

                                        <option>
                                            Disposables & Consumables
                                        </option>

                                        <option>
                                            Medical Equipment
                                        </option>

                                        <option>
                                            Surgical Instruments
                                        </option>

                                        <option>
                                            Laboratory Products & Diagnostics
                                        </option>

                                        <option>
                                            Medical Furniture
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* ================= CONTACT DETAILS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-8 border">

                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                    <User className="text-blue-600" />
                                    Contact Details
                                </h2>

                                {/* Email */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Email Address
                                    </label>

                                    <div className="relative mt-2">

                                        <Mail className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="seller@email.com"
                                            className="w-full pl-12 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                                {/* Phone */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Mobile Number
                                    </label>

                                    <div className="relative mt-2">

                                        <Phone className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type="tel"
                                            name="phone"
                                            pattern="[6-9][0-9]{9}"
                                            maxLength={10}
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="9876543210"
                                            className="w-full pl-12 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                                {/* Password */}

                                <div>

                                    <label className="font-medium text-gray-700">
                                        Password
                                    </label>

                                    <div className="relative mt-2">

                                        <Lock className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 8 Characters"
                                            className="w-full pl-12 pr-12 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4"
                                        >

                                            {showPassword ?

                                                <EyeOff size={20} />

                                                :

                                                <Eye size={20} />

                                            }

                                        </button>

                                    </div>

                                </div>

                            </div>

                            {/* ================= KYC DETAILS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-8 border">

                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                    <BadgeCheck className="text-green-600" />
                                    Business Verification
                                </h2>
                                
                                {/* GST */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        GST Number
                                    </label>

                                    <input
                                        type="text"
                                        name="gstNumber"
                                        value={formData.gstNumber}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                gstNumber: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength={15}
                                        pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        required
                                    />

                                </div>

                                {/* PAN */}

                                <div>

                                    <label className="font-medium text-gray-700">
                                        PAN Number
                                    </label>

                                    <input
                                        type="text"
                                        name="pan"
                                        value={formData.pan}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                pan: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        required
                                    />

                                </div>

                            </div>

                            {/* ================= ADDRESS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-8 border">

                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                    <MapPin className="text-red-500" />
                                    Business Address
                                </h2>

                                {/* Address */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        Address
                                    </label>

                                    <textarea
                                        rows={3}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Door No, Street, Area"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        required
                                    />

                                </div>

                                {/* City */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Visakhapatnam"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* State */}

                                <div className="mb-5">

                                    <label className="font-medium text-gray-700">
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="Andhra Pradesh"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Pincode */}

                                <div>

                                    <label className="font-medium text-gray-700">
                                        Pincode
                                    </label>

                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        inputMode="numeric"
                                        placeholder="530001"
                                        className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                            </div>

                            {/* ================= BANK DETAILS ================= */}

                            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 border">

                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-8">
                                    <Landmark className="text-indigo-600" />
                                    Bank Details
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">

                                    <div>

                                        <label className="font-medium text-gray-700">
                                            Account Holder Name
                                        </label>

                                        <input
                                            type="text"
                                            name="accountHolder"
                                            value={formData.accountHolder}
                                            onChange={handleChange}
                                            placeholder="Account Holder"
                                            className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                    <div>

                                        <label className="font-medium text-gray-700">
                                            Account Number
                                        </label>

                                        <input
                                            type="text"
                                            name="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                            placeholder="XXXXXXXXXXXX"
                                            className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                    <div>

                                        <label className="font-medium text-gray-700">
                                            IFSC Code
                                        </label>

                                        <input
                                            type="text"
                                            name="ifsc"
                                            value={formData.ifsc}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    ifsc: e.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder="SBIN0001234"
                                            className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                            required
                                        />

                                    </div>

                                    <div>

                                        <label className="font-medium text-gray-700">
                                            Bank Name
                                        </label>

                                        <input
                                            type="text"
                                            name="bankName"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            placeholder="State Bank of India"
                                            className="w-full mt-2 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="lg:col-span-2 mt-8">

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed transition duration-300 disabled:opacity-60 flex justify-center items-center gap-3"
                                >

                                    {
                                        loading
                                            ?

                                            <>
                                                <svg
                                                    className="animate-spin h-5 w-5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="white"
                                                        strokeWidth="4"
                                                        opacity=".3"
                                                    />

                                                    <path
                                                        fill="white"
                                                        d="M22 12a10 10 0 00-10-10v4a6 6 0 016 6h4z"
                                                    />
                                                </svg>

                                                Registering...

                                            </>

                                            :

                                            <>

                                                Register Seller

                                                <ArrowRight size={20} />

                                            </>

                                    }

                                </button>

                            </div>
                        </form>

                    </div>
                </div>

                <footer className="mt-16 bg-slate-900 text-slate-300">

                    <div className="max-w-7xl mx-auto px-6 py-12">

                        <div className="grid md:grid-cols-4 gap-8">

                            <div>

                                <h3 className="text-white font-bold text-xl">

                                    MedMarket

                                </h3>

                                <p className="mt-4 text-sm">

                                    India's trusted online medical marketplace connecting verified sellers with hospitals, clinics and distributors.

                                </p>

                            </div>

                            <div>

                                <h4 className="text-white font-semibold">

                                    Sellers

                                </h4>

                                <ul className="space-y-2 mt-4 text-sm">

                                    <li>Seller Dashboard</li>

                                    <li>Pricing</li>

                                    <li>Support</li>

                                    <li>FAQs</li>

                                </ul>

                            </div>

                            <div>

                                <h4 className="text-white font-semibold">

                                    Company

                                </h4>

                                <ul className="space-y-2 mt-4 text-sm">

                                    <li>About</li>

                                    <li>Privacy Policy</li>

                                    <li>Terms</li>

                                </ul>

                            </div>

                            <div>

                                <h4 className="text-white font-semibold">

                                    Contact

                                </h4>

                                <p className="mt-4 text-sm">

                                    support@medmarket.com

                                </p>

                            </div>

                        </div>

                        <div className="border-t border-slate-700 mt-10 pt-6 text-center text-sm">

                            © 2026 MedMarket. All Rights Reserved.

                        </div>

                    </div>

                </footer>
            </div>

        </>
    );
}
