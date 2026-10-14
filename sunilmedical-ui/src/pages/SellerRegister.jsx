import { useEffect, useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, X, CheckCircle2 } from "lucide-react";



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
    const [toast, setToast] = useState(null);

    const [success, setSuccess] = useState(false);
    const [gstCertificateFile, setGstCertificateFile] = useState(null);
    const [productLicenceFile, setProductLicenceFile] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

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

        warehouseFullAddress: "",

        warehouseContactPersonName: "",

        warehouseContactMobileNumber: "",

        accountHolder: "",

        accountNumber: "",

        ifsc: "",

        bankName: ""

    });

    // Show a dismissible toast whenever validation/API success or error text changes.
    useEffect(() => {
        if (!message) return undefined;
        setToast({ message, success });
        const timer = window.setTimeout(() => setToast(null), 5000);
        return () => window.clearTimeout(timer);
    }, [message, success]);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setSuccess(false);

        const errors = {};
        if (!gstCertificateFile) errors.gstCertificateDocument = "Please upload your GST certificate. This document is mandatory.";
        const required = [
            ["businessName", "Business name is required."],
            ["ownerName", "Owner name is required."],
            ["productType", "Please select a product type."],
            ["email", "Email address is required."],
            ["phone", "Mobile number is required."],
            ["password", "Password is required."],
            ["gstNumber", "GSTIN is required."],
            ["pan", "PAN number is required."],
            ["address", "Business address is required."],
            ["city", "City is required."],
            ["state", "State is required."],
            ["pincode", "Pincode is required."],
            ["warehouseFullAddress", "Warehouse full address is required."],
            ["warehouseContactPersonName", "Warehouse contact person name is required."],
            ["warehouseContactMobileNumber", "Warehouse contact mobile number is required."],
            ["accountHolder", "Account holder name is required."],
            ["accountNumber", "Bank account number is required."],
            ["ifsc", "IFSC code is required."],
            ["bankName", "Bank name is required."]
        ];
        required.forEach(([field, text]) => {
            if (!String(formData[field] || "").trim()) errors[field] = text;
        });

        if (formData.password && formData.password.length < 8) {
            errors.password = "Use at least 8 characters for your password.";
        }
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.email = "Enter a valid email address.";
        }
        const phone = formData.phone.trim();
        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            errors.phone = "Enter a valid 10-digit Indian mobile number.";
        }
        if (formData.pincode.trim() && !/^[1-9]\d{5}$/.test(formData.pincode.trim())) {
            errors.pincode = "Enter a valid 6-digit Indian PIN code.";
        }
        const warehouseMobile = formData.warehouseContactMobileNumber.trim();
        if (warehouseMobile && !/^[6-9]\d{9}$/.test(warehouseMobile)) {
            errors.warehouseContactMobileNumber = "Enter a valid 10-digit Indian warehouse contact mobile number.";
        }

        const pan = formData.pan.trim().toUpperCase();
        if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
            errors.pan = "Enter a valid PAN, for example ABCDE1234F.";
        }
        const gst = formData.gstNumber.trim().toUpperCase();
        if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) {
            errors.gstNumber = "Enter a valid 15-character GSTIN format.";
        } else if (gst && pan && gst.substring(2, 12) !== pan) {
            errors.gstNumber = "The PAN in the GSTIN must match the PAN entered above.";
        }
        if (formData.ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc.trim().toUpperCase())) {
            errors.ifsc = "Enter a valid 11-character IFSC code.";
        }

        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            setMessage("Please review the highlighted fields and correct the errors.");
            const firstInvalid = Object.keys(errors)[0];
            const fieldIdMap = {
                gstCertificateDocument: "gstCertificateDocument",
                productLicenceDocument: "productLicenceDocument",
                pincode: "pincode"
            };
            window.setTimeout(() => {
                const element = document.getElementById(fieldIdMap[firstInvalid] || firstInvalid)
                    || document.querySelector(`[name="${firstInvalid}"]`);
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
                element?.focus?.({ preventScroll: true });
            }, 100);
            return;
        }

        setFieldErrors({});
        setLoading(true);
        try {
            // Submit explicit backend property names as multipart/form-data.
            const data = new FormData();
            data.append("BusinessName", formData.businessName.trim());
            data.append("OwnerName", formData.ownerName.trim());
            data.append("ProductType", formData.productType.trim());
            data.append("Brand", formData.brand.trim());
            data.append("Email", formData.email.trim());
            data.append("Phone", formData.phone.trim());
            data.append("Password", formData.password);
            data.append("GSTNumber", formData.gstNumber.trim().toUpperCase());
            data.append("PAN", formData.pan.trim().toUpperCase());
            data.append("AddressLine1", formData.address.trim());
            data.append("City", formData.city.trim());
            data.append("State", formData.state.trim());
            data.append("Pincode", formData.pincode.trim());
            data.append("WarehouseFullAddress", formData.warehouseFullAddress.trim());
            data.append("WarehouseContactPersonName", formData.warehouseContactPersonName.trim());
            data.append("WarehouseContactMobileNumber", formData.warehouseContactMobileNumber.trim());
            data.append("AccountHolderName", formData.accountHolder.trim());
            data.append("AccountNumber", formData.accountNumber.trim());
            data.append("IFSCCode", formData.ifsc.trim().toUpperCase());
            data.append("BankName", formData.bankName.trim());
            data.append("GSTCertificateDocument", gstCertificateFile);
            if (productLicenceFile) data.append("ProductLicenceDocument", productLicenceFile);

            const response = await API.post("/api/Seller/register", data);
            if (response.data?.success === true) {
                setSuccess(true);
                setMessage(
                    response.data.message ||
                    "Registration successful! Your seller account is pending admin approval. Your free subscription dates will be confirmed below."
                );
                // Keep the seller on this page so the success message is visible.
                // Do not redirect before admin approval.
            } else {
                setSuccess(false);
                setMessage(response.data?.message || "The server did not confirm registration. Please try again.");
            }
        } catch (err) {
            console.error("Seller registration error:", err);
            const apiData = err.response?.data;
            let apiMessage = apiData?.message || apiData?.title || err.message || "Registration failed. Please try again.";
            const apiErrors = apiData?.errors;
            if (apiErrors && typeof apiErrors === "object") {
                const mapped = {};
                const keyMap = {
                    BusinessName: "businessName", OwnerName: "ownerName", ProductType: "productType",
                    Email: "email", Phone: "phone", Password: "password", GSTNumber: "gstNumber",
                    PAN: "pan", AddressLine1: "address", City: "city", State: "state", Pincode: "pincode",
                    WarehouseFullAddress: "warehouseFullAddress",
                    WarehouseContactPersonName: "warehouseContactPersonName",
                    WarehouseContactMobileNumber: "warehouseContactMobileNumber",
                    AccountHolderName: "accountHolder", AccountNumber: "accountNumber", IFSCCode: "ifsc",
                    BankName: "bankName", GSTCertificateDocument: "gstCertificateDocument",
                    ProductLicenceDocument: "productLicenceDocument"
                };
                Object.entries(apiErrors).forEach(([key, value]) => {
                    const target = keyMap[key] || keyMap[key.split(".").pop()] || key;
                    mapped[target] = Array.isArray(value) ? value.join(" ") : String(value);
                });
                setFieldErrors(mapped);
                const firstKey = Object.keys(mapped)[0];
                if (firstKey) {
                    window.setTimeout(() => {
                        const el = document.getElementById(firstKey) || document.querySelector(`[name="${firstKey}"]`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                        el?.focus?.({ preventScroll: true });
                    }, 100);
                }
                apiMessage = Object.values(mapped)[0] || apiMessage;
            }
            setSuccess(false);
            setMessage(apiMessage);
        } finally {
            setLoading(false);
        }
    };

    return (

        <>
            {toast && (
                <div
                    className="fixed right-3 top-3 sm:right-5 sm:top-5 z-[100] w-[calc(100%-1.5rem)] max-w-md"
                    role={toast.success ? "status" : "alert"}
                    aria-live={toast.success ? "polite" : "assertive"}
                >
                    <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm ${toast.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-white text-red-800"}`}>
                        {toast.success ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} /> : <X className="mt-0.5 shrink-0 text-red-600" size={22} />}
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base">{toast.success ? "Success" : "Please check"}</p>
                            <p className="mt-1 break-words text-sm leading-5">{toast.message}</p>
                        </div>
                        <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="rounded-md p-1 hover:bg-black/5">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-screen overflow-x-hidden bg-slate-100">

                <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600">

                    <div className="absolute inset-0 opacity-30">

                        <div className="absolute w-96 h-96 rounded-full bg-white blur-3xl -top-40 -left-20"></div>

                        <div className="absolute w-96 h-96 rounded-full bg-cyan-300 blur-3xl bottom-0 right-0"></div>

                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">

                        <div className="grid lg:grid-cols-2 gap-12 items-center">

                            <div>

                                <motion.h1

                                    initial={{ opacity: 0, y: 30 }}

                                    animate={{ opacity: 1, y: 0 }}

                                    className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight">

                                    Become a Trusted

                                    <span className="block text-cyan-300">

                                        Medical Seller

                                    </span>

                                </motion.h1>

                                <p className="mt-6 text-blue-100 text-lg">

                                    Join thousands of verified medical suppliers selling to hospitals, clinics and distributors across India.

                                </p>

                                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-7 sm:mt-10">

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-white min-w-0">

                                        <h2 className="text-2xl font-bold">

                                            10K+

                                        </h2>

                                        <p>Products</p>

                                    </div>

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-white min-w-0">

                                        <h2 className="text-2xl font-bold">

                                            5000+

                                        </h2>

                                        <p>Buyers</p>

                                    </div>

                                    <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-white min-w-0">

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

                <div className="max-w-6xl mx-auto px-3 sm:px-6 -mt-8 sm:-mt-12 lg:-mt-20 relative z-20">

                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-10">

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

                            <div>

                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

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
                                    role={success ? "status" : "alert"}
                                    aria-live={success ? "polite" : "assertive"}
                                    className={`mb-6 sm:mb-8 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-6 border ${success
                                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                >
                                    {success && (
                                        <div className="flex items-center gap-2 font-bold text-base sm:text-lg mb-1">
                                            <CheckCircle2 size={21} className="shrink-0" />
                                            Registration Successful
                                        </div>
                                    )}
                                    <p>{message}</p>
                                    {Object.keys(fieldErrors).length > 0 && (
                                        <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                                            {Object.entries(fieldErrors).map(([field, errorText]) => (
                                                <li key={field}>
                                                    <button
                                                        type="button"
                                                        className="underline text-left"
                                                        onClick={() => {
                                                            const el = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
                                                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                            el?.focus?.({ preventScroll: true });
                                                        }}
                                                    >{errorText}</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )
                        }

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-10"
                        >

                            {/* ================= BUSINESS DETAILS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 min-w-0">

                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-6">
                                    <Building2 className="text-blue-600" />
                                    Business Information
                                </h2>

                                {/* Business Name */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Business Name
                                    </label>

                                    <input
                                        type="text"
                                        id="businessName"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        placeholder="ABC Medical Pvt Ltd"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Owner */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Owner Name
                                    </label>

                                    <input
                                        type="text"
                                        id="ownerName"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Brand */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Brand
                                    </label>

                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        placeholder="Philips / Medline"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                    />

                                </div>

                                {/* Product Type */}

                                <div>

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Product Type
                                    </label>

                                    <select
                                        id="productType"
                                        name="productType"
                                        value={formData.productType}
                                        onChange={handleChange}
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
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

                            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 min-w-0">

                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-6">
                                    <User className="text-blue-600" />
                                    Contact Details
                                </h2>

                                {/* Email */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Email Address
                                    </label>

                                    <div className="relative mt-2">

                                        <Mail className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="seller@email.com"
                                            className="w-full min-w-0 pl-12 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                                {/* Phone */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Mobile Number
                                    </label>

                                    <div className="relative mt-2">

                                        <Phone className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            pattern="[6-9][0-9]{9}"
                                            maxLength={10}
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange({ target: { name: "phone", value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
                                            placeholder="9876543210"
                                            className="w-full min-w-0 pl-12 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                                {/* Password */}

                                <div>

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Password
                                    </label>

                                    <div className="relative mt-2">

                                        <Lock className="absolute left-3 top-4 text-gray-400" />

                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 8 Characters"
                                            autoComplete="new-password"
                                            className="w-full min-w-0 pl-12 pr-12 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
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

                            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 min-w-0">

                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-6">
                                    <BadgeCheck className="text-green-600" />
                                    Business Verification
                                </h2>

                                {/* GST */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        GST Number
                                    </label>

                                    <input
                                        type="text"
                                        id="gstNumber"
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
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        required
                                    />

                                </div>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Manual format and PAN-consistency check only. No GST API is called; this does not confirm registration status.
                                </p>

                                {/* PAN */}

                                <div>

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        PAN Number
                                    </label>

                                    <input
                                        type="text"
                                        id="pan"
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
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        required
                                    />

                                </div>

                            </div>

                            {/* ================= ADDRESS ================= */}

                            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 min-w-0">

                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-6">
                                    <MapPin className="text-red-500" />
                                    Business Address
                                </h2>

                                {/* Address */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Address
                                    </label>

                                    <textarea
                                        rows={3}
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Door No, Street, Area"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        required
                                    />

                                </div>

                                {/* City */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Visakhapatnam"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* State */}

                                <div className="mb-5">

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="Andhra Pradesh"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                                {/* Pincode */}

                                <div>

                                    <label className="block text-sm sm:text-base font-medium text-gray-700">
                                        Pincode
                                    </label>

                                    <input
                                        type="text"
                                        id="pincode"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        inputMode="numeric"
                                        placeholder="530001"
                                        className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />

                                </div>

                            </div>

                            {/* ================= REQUIRED WAREHOUSE DETAILS ================= */}
                            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-2">
                                    <MapPin className="text-indigo-600" />
                                    Warehouse Details <span className="text-red-600 text-xs sm:text-sm">Required *</span>
                                </h2>
                                <p className="text-sm text-slate-500 mb-5">Provide the warehouse location and the person who can be contacted for warehouse-related coordination.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="md:col-span-2 min-w-0">
                                        <label htmlFor="warehouseFullAddress" className="block text-sm sm:text-base font-medium text-gray-700">Warehouse Full Address <span className="text-red-600">*</span></label>
                                        <textarea id="warehouseFullAddress" name="warehouseFullAddress" rows={3} value={formData.warehouseFullAddress} onChange={handleChange} placeholder="Building/door number, street, area, city, state and PIN code" required aria-invalid={Boolean(fieldErrors.warehouseFullAddress)} className={`w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border outline-none resize-y focus:ring-2 ${fieldErrors.warehouseFullAddress ? "border-red-500 bg-red-50 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}`} />
                                        {fieldErrors.warehouseFullAddress && <p className="mt-1 text-sm text-red-600">{fieldErrors.warehouseFullAddress}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="warehouseContactPersonName" className="block text-sm sm:text-base font-medium text-gray-700">Warehouse Contact Person Name <span className="text-red-600">*</span></label>
                                        <input type="text" id="warehouseContactPersonName" name="warehouseContactPersonName" value={formData.warehouseContactPersonName} onChange={handleChange} placeholder="Full name of contact person" required aria-invalid={Boolean(fieldErrors.warehouseContactPersonName)} className={`w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 ${fieldErrors.warehouseContactPersonName ? "border-red-500 bg-red-50 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}`} />
                                        {fieldErrors.warehouseContactPersonName && <p className="mt-1 text-sm text-red-600">{fieldErrors.warehouseContactPersonName}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label htmlFor="warehouseContactMobileNumber" className="block text-sm sm:text-base font-medium text-gray-700">Warehouse Contact Mobile Number <span className="text-red-600">*</span></label>
                                        <input type="tel" id="warehouseContactMobileNumber" name="warehouseContactMobileNumber" inputMode="numeric" autoComplete="tel" maxLength={10} pattern="[6-9][0-9]{9}" value={formData.warehouseContactMobileNumber} onChange={(e) => handleChange({ target: { name: "warehouseContactMobileNumber", value: e.target.value.replace(/\D/g, "").slice(0, 10) } })} placeholder="9876543210" required aria-invalid={Boolean(fieldErrors.warehouseContactMobileNumber)} className={`w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 ${fieldErrors.warehouseContactMobileNumber ? "border-red-500 bg-red-50 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}`} />
                                        {fieldErrors.warehouseContactMobileNumber && <p className="mt-1 text-sm text-red-600">{fieldErrors.warehouseContactMobileNumber}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* ================= MANDATORY GST CERTIFICATE ================= */}

                            <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-amber-200 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2 mb-2">
                                    <FileText className="text-amber-600" />
                                    GST Certificate <span className="text-red-600 text-sm">Required *</span>
                                </h2>
                                <p className="text-sm text-slate-600 mb-5">
                                    Upload your GST registration certificate. This document is mandatory to complete seller registration.
                                </p>
                                <label htmlFor="gstCertificateDocument" className={`flex flex-col items-center justify-center text-center gap-3 rounded-xl border-2 border-dashed ${!gstCertificateFile && fieldErrors.gstCertificateDocument ? "border-red-400 bg-red-50" : "border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400"} p-5 sm:p-8 cursor-pointer transition`}>
                                    <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-amber-600 shadow-sm"><Upload size={23} /></span>
                                    <span className="font-semibold text-slate-800 break-all">{gstCertificateFile ? gstCertificateFile.name : "Choose GST certificate"}</span>
                                    <span className="text-xs text-slate-500">PDF, JPG, JPEG or PNG · Maximum 10 MB</span>
                                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-amber-700"><Upload size={16} /> Browse files</span>
                                    <input id="gstCertificateDocument" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" required={!gstCertificateFile}
                                        onChange={(e) => {
                                            const selected = e.target.files?.[0] || null;
                                            if (selected && selected.size > 10 * 1024 * 1024) {
                                                setGstCertificateFile(null); setMessage("GST certificate must be 10 MB or smaller."); e.target.value = ""; return;
                                            }
                                            setMessage(""); setGstCertificateFile(selected);
                                            setFieldErrors(prev => { const next = { ...prev }; delete next.gstCertificateDocument; return next; });
                                        }} />
                                </label>
                                {fieldErrors.gstCertificateDocument && !gstCertificateFile && <p id="gstCertificateDocument-error" role="alert" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.gstCertificateDocument}</p>}
                                {gstCertificateFile && <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-green-50 border border-green-200 p-3"><p className="flex items-center gap-2 text-sm text-green-800 break-all"><CheckCircle2 size={17} className="shrink-0" />{gstCertificateFile.name}</p><button type="button" onClick={() => setGstCertificateFile(null)} className="inline-flex items-center gap-1 self-start sm:self-auto text-sm font-medium text-red-600 hover:text-red-700"><X size={15} /> Remove file</button></div>}
                            </div>

                            {/* ================= OPTIONAL MAKE IN INDIA / PRODUCT LICENCE ================= */}

                            <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-100 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-2">
                                    <FileText className="text-blue-600" />
                                    Make in India / Product Licence Certificate
                                </h2>
                                <p className="text-sm text-slate-600 mb-5">
                                    Upload an applicable product licence, manufacturing certificate, or Make in India supporting certificate for review. This upload is optional unless your business category requires it.
                                </p>
                                <label htmlFor="productLicenceDocument" className="flex flex-col items-center justify-center text-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 p-5 sm:p-8 cursor-pointer transition">
                                    <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-blue-600 shadow-sm">
                                        <Upload size={23} />
                                    </span>
                                    <span className="font-semibold text-slate-800 break-all">
                                        {productLicenceFile ? productLicenceFile.name : "Choose certificate or product licence"}
                                    </span>
                                    <span className="text-xs text-slate-500">PDF, JPG, JPEG or PNG · Maximum 10 MB</span>
                                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700">
                                        <Upload size={16} /> Browse files
                                    </span>
                                    <input
                                        id="productLicenceDocument"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        className="sr-only"
                                        onChange={(e) => {
                                            const selected = e.target.files?.[0] || null;
                                            if (selected && selected.size > 10 * 1024 * 1024) {
                                                setProductLicenceFile(null);
                                                setMessage("Please choose a certificate smaller than 10 MB.");
                                                e.target.value = "";
                                                return;
                                            }
                                            setMessage("");
                                            setProductLicenceFile(selected);
                                        }}
                                    />
                                </label>
                                {productLicenceFile && (
                                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
                                        <p className="flex items-center gap-2 text-sm text-green-800 break-all">
                                            <CheckCircle2 size={17} className="shrink-0" />
                                            {productLicenceFile.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setProductLicenceFile(null)}
                                            className="inline-flex items-center gap-1 self-start sm:self-auto text-sm font-medium text-red-600 hover:text-red-700"
                                        >
                                            <X size={15} /> Remove file
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ================= BANK DETAILS ================= */}

                            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200">

                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-8">
                                    <Landmark className="text-indigo-600" />
                                    Bank Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                                    <div>

                                        <label className="block text-sm sm:text-base font-medium text-gray-700">
                                            Account Holder Name
                                        </label>

                                        <input
                                            type="text"
                                            id="accountHolder"
                                            name="accountHolder"
                                            value={formData.accountHolder}
                                            onChange={handleChange}
                                            placeholder="Account Holder"
                                            className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                    <div>

                                        <label className="block text-sm sm:text-base font-medium text-gray-700">
                                            Account Number
                                        </label>

                                        <input
                                            type="text"
                                            id="accountNumber"
                                            name="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                            placeholder="XXXXXXXXXXXX"
                                            className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                    <div>

                                        <label className="block text-sm sm:text-base font-medium text-gray-700">
                                            IFSC Code
                                        </label>

                                        <input
                                            type="text"
                                            id="ifsc"
                                            name="ifsc"
                                            value={formData.ifsc}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }));
                                                setFieldErrors(prev => {
                                                    if (!prev.ifsc) return prev;
                                                    const next = { ...prev };
                                                    delete next.ifsc;
                                                    return next;
                                                });
                                            }}
                                            placeholder="SBIN0001234"
                                            className={`w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border outline-none uppercase focus:ring-2 ${fieldErrors.ifsc ? "border-red-500 bg-red-50 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`}
                                            aria-invalid={Boolean(fieldErrors.ifsc)}
                                            aria-describedby={fieldErrors.ifsc ? "ifsc-error" : undefined}
                                            required
                                        />
                                        {fieldErrors.ifsc && (
                                            <p id="ifsc-error" role="alert" className="mt-1 text-sm font-medium text-red-600">
                                                {fieldErrors.ifsc}
                                            </p>
                                        )}

                                    </div>

                                    <div>

                                        <label className="block text-sm sm:text-base font-medium text-gray-700">
                                            Bank Name
                                        </label>

                                        <input
                                            type="text"
                                            id="bankName"
                                            name="bankName"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            placeholder="State Bank of India"
                                            className="w-full min-w-0 mt-2 p-3 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="lg:col-span-2 mt-8">

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed transition duration-300 disabled:opacity-60 flex justify-center items-center gap-3"
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
            </div>

        </>
    );
}
