import { useEffect, useState } from "react";
import API from "../services/api";

import {
    ArrowLeft,
    Building2,
    User,
    BriefcaseBusiness,
    Phone,
    Mail,
    FileText,
    MapPin,
    Upload,
    ShieldCheck,
    Save,
    CheckCircle2,
    LockKeyhole,
    Headphones,
    ExternalLink,
    AlertCircle
} from "lucide-react";

export default function KycRegister() {

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [kycCompleted, setKycCompleted] = useState(false);

    const [file, setFile] = useState(null);
    const [existingDocument, setExistingDocument] = useState("");

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
        Address: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadKyc();
    }, []);

    /* =====================================================
       LOAD REGISTERED KYC
    ===================================================== */

    const loadKyc = async () => {

        try {

            setLoading(true);
            setError("");

            const res = await API.get(
                "/api/account/profile"
            );

            const kyc = res.data?.kyc || {};

            const completed =
                kyc.isProfileCompleted === true;

            setKycCompleted(completed);

            setForm({
                CompanyName:
                    kyc.companyName || "",

                CustomerName:
                    kyc.customerName || "",

                IndustrySector:
                    kyc.industrySector || "",

                MobileNo:
                    kyc.mobileNo || "",

                Email:
                    kyc.email || res.data?.email || "",

                SecondaryEmail:
                    kyc.secondaryEmail || "",

                SecondaryMobile:
                    kyc.secondaryMobile || "",

                GSTNo:
                    kyc.gstNo || "",

                PANNo:
                    kyc.panNo || "",

                Address:
                    kyc.address || ""
            });

            setExistingDocument(
                kyc.documentPath || ""
            );

        } catch (err) {

            console.error(
                "KYC loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load KYC details."
            );

        } finally {

            setLoading(false);

        }
    };


    /* =====================================================
       HANDLE INPUT
    ===================================================== */

    const handleChange = (
        field,
        value
    ) => {

        setForm(prev => ({
            ...prev,
            [field]: value
        }));

    };


    /* =====================================================
       SUBMIT KYC
    ===================================================== */

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (kycCompleted) {
            return;
        }

        setError("");
        setMessage("");

        try {

            setSaving(true);

            const data = new FormData();

            data.append(
                "CompanyName",
                form.CompanyName || ""
            );

            data.append(
                "CustomerName",
                form.CustomerName || ""
            );

            data.append(
                "IndustrySector",
                form.IndustrySector || ""
            );

            data.append(
                "MobileNo",
                form.MobileNo || ""
            );

            data.append(
                "Email",
                form.Email || ""
            );

            data.append(
                "SecondaryEmail",
                form.SecondaryEmail || ""
            );

            data.append(
                "SecondaryMobile",
                form.SecondaryMobile || ""
            );

            data.append(
                "GSTNo",
                form.GSTNo?.trim().toUpperCase() || ""
            );

            data.append(
                "PANNo",
                form.PANNo?.trim().toUpperCase() || ""
            );

            data.append(
                "Address",
                form.Address || ""
            );

            /*
             * Existing registration flow expects
             * AcceptPrivacy.
             */
            data.append(
                "AcceptPrivacy",
                "true"
            );

            if (file) {

                data.append(
                    "Document",
                    file
                );

            }

            const res = await API.post(
                "/api/account/register",
                data
            );

            setMessage(
                res.data?.message ||
                "KYC completed successfully."
            );

            /*
             * Reload registered information
             * after successful submission.
             */
            await loadKyc();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (err) {

            console.error(
                "KYC submission error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to complete KYC."
            );

        } finally {

            setSaving(false);

        }
    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">

                <div className="text-center">

                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />

                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Loading your KYC details...
                    </p>

                </div>

            </div>
        );

    }


    return (

        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

                {/* =================================================
                   TOP BAR
                ================================================= */}

                <div className="flex items-center gap-3 mb-5">

                    <button
                        type="button"
                        onClick={() =>
                            window.history.back()
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
                    >
                        <ArrowLeft
                            size={19}
                            className="text-slate-600"
                        />
                    </button>

                    <div>

                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                            KYC Registration
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-500">
                            Manage your business verification details
                        </p>

                    </div>

                </div>


                {/* =================================================
                   HERO
                ================================================= */}

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 shadow-xl mb-6">

                    {/* Decorative circles */}

                    <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/10" />

                    <div className="absolute -bottom-28 -left-10 w-60 h-60 rounded-full bg-white/10" />

                    <div className="relative p-6 sm:p-8 lg:p-10">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                            <div className="flex items-start gap-4">

                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shrink-0">

                                    {kycCompleted ? (
                                        <CheckCircle2 size={30} />
                                    ) : (
                                        <ShieldCheck size={30} />
                                    )}

                                </div>

                                <div>

                                    <div className="flex flex-wrap items-center gap-2">

                                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                                            {kycCompleted
                                                ? "KYC Completed"
                                                : "Complete Your KYC"}
                                        </h2>

                                        {kycCompleted ? (
                                            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                                                VERIFIED
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-bold">
                                                PENDING
                                            </span>
                                        )}

                                    </div>

                                    <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-6">

                                        {kycCompleted
                                            ? "Your KYC information has already been registered successfully. Your registered details are shown below."
                                            : "Complete your business information and verification to finish setting up your medical products account."}

                                    </p>

                                </div>

                            </div>


                            {/* STATUS */}

                            <div className="hidden md:flex items-center gap-2 text-white">

                                {kycCompleted ? (
                                    <>
                                        <CheckCircle2 size={18} />

                                        <span className="text-sm font-semibold">
                                            KYC Verified
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={18} />

                                        <span className="text-sm font-semibold">
                                            Action Required
                                        </span>
                                    </>
                                )}

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                   ALERTS
                ================================================= */}

                {message && (

                    <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-4">

                        <CheckCircle2
                            size={20}
                            className="text-green-600 shrink-0 mt-0.5"
                        />

                        <div>

                            <p className="font-semibold text-green-800 text-sm">
                                KYC Submitted
                            </p>

                            <p className="text-green-700 text-xs mt-1">
                                {message}
                            </p>

                        </div>

                    </div>

                )}


                {error && (

                    <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">

                        <AlertCircle
                            size={20}
                            className="text-red-600 shrink-0 mt-0.5"
                        />

                        <div>

                            <p className="font-semibold text-red-800 text-sm">
                                Unable to process KYC
                            </p>

                            <p className="text-red-700 text-xs mt-1">
                                {error}
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                   COMPLETED KYC - READ ONLY
                ================================================= */}

                {kycCompleted ? (

                    <CompletedKyc
                        form={form}
                        existingDocument={existingDocument}
                    />

                ) : (

                    /* =================================================
                       PENDING KYC - EDITABLE FORM
                    ================================================= */

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* BUSINESS INFORMATION */}

                        <KycSection
                            icon={
                                <Building2 size={19} />
                            }
                            title="Business Information"
                            description="Enter your registered business information."
                        >

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <KycInput
                                    label="Company Name"
                                    value={
                                        form.CompanyName
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "CompanyName",
                                            v
                                        )
                                    }
                                    icon={
                                        <Building2 size={17} />
                                    }
                                    required
                                />

                                <KycInput
                                    label="Customer Name"
                                    value={
                                        form.CustomerName
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "CustomerName",
                                            v
                                        )
                                    }
                                    icon={
                                        <User size={17} />
                                    }
                                    required
                                />

                                <KycInput
                                    label="Industry / Sector"
                                    value={
                                        form.IndustrySector
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "IndustrySector",
                                            v
                                        )
                                    }
                                    icon={
                                        <BriefcaseBusiness size={17} />
                                    }
                                    required
                                />

                            </div>

                        </KycSection>


                        {/* CONTACT INFORMATION */}

                        <KycSection
                            icon={
                                <Phone size={19} />
                            }
                            title="Contact Information"
                            description="Your registered contact information."
                        >

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <KycInput
                                    label="Mobile Number"
                                    value={
                                        form.MobileNo
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "MobileNo",
                                            v
                                        )
                                    }
                                    icon={
                                        <Phone size={17} />
                                    }
                                    required
                                />

                                <KycInput
                                    label="Primary Email"
                                    value={
                                        form.Email
                                    }
                                    disabled
                                    icon={
                                        <Mail size={17} />
                                    }
                                    hint="Your login email is used as the primary email."
                                />

                                <KycInput
                                    label="Secondary Email"
                                    value={
                                        form.SecondaryEmail
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "SecondaryEmail",
                                            v
                                        )
                                    }
                                    icon={
                                        <Mail size={17} />
                                    }
                                />

                                <KycInput
                                    label="Secondary Mobile"
                                    value={
                                        form.SecondaryMobile
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "SecondaryMobile",
                                            v
                                        )
                                    }
                                    icon={
                                        <Phone size={17} />
                                    }
                                />

                            </div>

                        </KycSection>


                        {/* TAX INFORMATION */}

                        <KycSection
                            icon={
                                <FileText size={19} />
                            }
                            title="GST & PAN Information"
                            description="Provide your business tax identification details."
                        >

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <KycInput
                                    label="GST Number"
                                    value={
                                        form.GSTNo
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "GSTNo",
                                            v.toUpperCase()
                                        )
                                    }
                                    icon={
                                        <FileText size={17} />
                                    }
                                    required
                                />

                                <KycInput
                                    label="PAN Number"
                                    value={
                                        form.PANNo
                                    }
                                    onChange={v =>
                                        handleChange(
                                            "PANNo",
                                            v.toUpperCase()
                                        )
                                    }
                                    icon={
                                        <FileText size={17} />
                                    }
                                    required
                                />

                            </div>

                            <div className="mt-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 p-4">

                                <div className="flex gap-3">

                                    <ShieldCheck
                                        size={20}
                                        className="text-blue-600 shrink-0"
                                    />

                                    <div>

                                        <p className="text-sm font-semibold text-blue-900">
                                            GST & PAN Verification
                                        </p>

                                        <p className="text-xs text-blue-700 mt-1 leading-5">
                                            Your GST and PAN details will be
                                            verified during KYC submission.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </KycSection>


                        {/* BUSINESS ADDRESS */}

                        <KycSection
                            icon={
                                <MapPin size={19} />
                            }
                            title="Business Address"
                            description="Enter your registered business address."
                        >

                            <textarea
                                value={
                                    form.Address
                                }
                                onChange={e =>
                                    handleChange(
                                        "Address",
                                        e.target.value
                                    )
                                }
                                rows={5}
                                required
                                placeholder="Enter complete registered business address"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-sm text-slate-800 outline-none resize-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />

                        </KycSection>


                        {/* DOCUMENT */}

                        <KycSection
                            icon={
                                <FileText size={19} />
                            }
                            title="KYC Document"
                            description="Upload your KYC supporting document."
                        >

                            {existingDocument && (

                                <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">

                                    <div className="flex items-center gap-3">

                                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">

                                            <FileText size={20} />

                                        </div>

                                        <div>

                                            <p className="font-semibold text-sm text-slate-800">
                                                Existing document
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                A document is already registered.
                                            </p>

                                        </div>

                                    </div>

                                    <a
                                        href={
                                            existingDocument
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-blue-600 text-sm font-semibold hover:bg-blue-50"
                                    >
                                        View
                                        <ExternalLink
                                            size={15}
                                        />
                                    </a>

                                </div>

                            )}


                            <label className="block cursor-pointer">

                                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/60 to-cyan-50/60 hover:border-blue-400 hover:bg-blue-50 p-7 sm:p-9 text-center transition">

                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-sm text-blue-600 flex items-center justify-center">

                                        <Upload size={25} />

                                    </div>

                                    <p className="mt-4 font-bold text-slate-800 text-sm">
                                        {file
                                            ? file.name
                                            : "Upload KYC Document"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        PDF, JPG, JPEG or PNG
                                    </p>

                                    <p className="mt-3 text-[11px] text-slate-400">
                                        Click here to select a file
                                    </p>

                                </div>

                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={e =>
                                        setFile(
                                            e.target.files?.[0] ||
                                            null
                                        )
                                    }
                                />

                            </label>

                        </KycSection>


                        {/* PRIVACY */}

                        <div className="rounded-2xl bg-slate-900 p-5 sm:p-6">

                            <div className="flex gap-3">

                                <ShieldCheck
                                    size={20}
                                    className="text-cyan-400 shrink-0"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-white">
                                        Secure Business Verification
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1 leading-5">
                                        Your submitted business information
                                        is used for account verification and
                                        compliance purposes.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* SUBMIT */}

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-5">

                            <button
                                type="button"
                                onClick={() =>
                                    window.history.back()
                                }
                                className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >

                                <Save size={18} />

                                {saving
                                    ? "Submitting KYC..."
                                    : "Complete KYC"}

                            </button>

                        </div>

                    </form>

                )}

            </div>

        </div>
    );
}


/* =========================================================
   COMPLETED KYC
========================================================= */

function CompletedKyc({
    form,
    existingDocument
}) {

    return (

        <div className="space-y-5">

            {/* COMPLETED BANNER */}

            <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">

                <div className="p-5 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50">

                    <div className="flex items-start gap-4">

                        <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={25} />
                        </div>

                        <div>

                            <h3 className="font-bold text-green-900 text-lg">
                                Your KYC is Completed
                            </h3>

                            <p className="text-sm text-green-700 mt-1 leading-6">
                                Your KYC information has already been
                                registered successfully. The information
                                below is your registered KYC data.
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* REGISTERED INFORMATION */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>

                        <div>

                            <h2 className="font-bold text-lg text-slate-900">
                                Registered KYC Details
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                These details are currently registered on your account.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="p-5 sm:p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <ReadOnlyField
                            icon={<Building2 size={18} />}
                            label="Company Name"
                            value={form.CompanyName}
                        />

                        <ReadOnlyField
                            icon={<User size={18} />}
                            label="Customer Name"
                            value={form.CustomerName}
                        />

                        <ReadOnlyField
                            icon={<BriefcaseBusiness size={18} />}
                            label="Industry / Sector"
                            value={form.IndustrySector}
                        />

                        <ReadOnlyField
                            icon={<Phone size={18} />}
                            label="Mobile Number"
                            value={form.MobileNo}
                        />

                        <ReadOnlyField
                            icon={<Mail size={18} />}
                            label="Primary Email"
                            value={form.Email}
                        />

                        <ReadOnlyField
                            icon={<Mail size={18} />}
                            label="Secondary Email"
                            value={form.SecondaryEmail}
                        />

                        <ReadOnlyField
                            icon={<Phone size={18} />}
                            label="Secondary Mobile"
                            value={form.SecondaryMobile}
                        />

                        <ReadOnlyField
                            icon={<FileText size={18} />}
                            label="GST Number"
                            value={form.GSTNo}
                        />

                        <ReadOnlyField
                            icon={<FileText size={18} />}
                            label="PAN Number"
                            value={form.PANNo}
                        />

                        <div className="md:col-span-2">

                            <ReadOnlyField
                                icon={<MapPin size={18} />}
                                label="Business Address"
                                value={form.Address}
                                multiline
                            />

                        </div>

                    </div>


                    {/* DOCUMENT */}

                    {existingDocument && (

                        <div className="mt-6 pt-5 border-t border-slate-100">

                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>

                                    <div>

                                        <p className="font-semibold text-sm text-slate-800">
                                            Registered KYC Document
                                        </p>

                                        <p className="text-xs text-slate-500 mt-1">
                                            This is the document submitted during KYC registration.
                                        </p>

                                    </div>

                                </div>

                                <a
                                    href={
                                        existingDocument
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                                >
                                    View Document
                                    <ExternalLink
                                        size={15}
                                    />
                                </a>

                            </div>

                        </div>

                    )}

                </div>

            </div>


            {/* HELP DESK */}

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 sm:p-6">

                <div className="flex flex-col md:flex-row md:items-center gap-5">

                    <div className="w-12 h-12 rounded-xl bg-white text-orange-600 flex items-center justify-center shadow-sm shrink-0">

                        <Headphones size={25} />

                    </div>

                    <div className="flex-1">

                        <h3 className="font-bold text-slate-900">
                            Need to change your KYC details?
                        </h3>

                        <p className="text-sm text-slate-600 mt-1 leading-6">
                            KYC information cannot be edited directly after
                            registration. Please contact our Help Desk for
                            assistance with any KYC changes.
                        </p>

                    </div>

                    <a
                        href="/support"
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-sm"
                    >
                        <Headphones size={17} />
                        Contact Help Desk
                    </a>

                </div>

            </div>

        </div>

    );
}


/* =========================================================
   SECTION
========================================================= */

function KycSection({
    icon,
    title,
    description,
    children
}) {

    return (

        <section className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/30 overflow-hidden">

            <div className="px-5 sm:px-7 py-5 bg-gradient-to-r from-blue-50 via-white to-cyan-50 border-b border-blue-100">

                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
                        {icon}
                    </div>

                    <div>

                        <h2 className="font-bold text-slate-900">
                            {title}
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            {description}
                        </p>

                    </div>

                </div>

            </div>

            <div className="p-5 sm:p-7">

                {children}

            </div>

        </section>

    );
}


/* =========================================================
   INPUT
========================================================= */

function KycInput({
    label,
    value,
    onChange,
    icon,
    required = false,
    disabled = false,
    hint
}) {

    return (

        <div>

            <label className="block text-xs font-bold text-slate-600 mb-2">

                {label}

                {required && (
                    <span className="text-red-500 ml-1">
                        *
                    </span>
                )}

            </label>

            <div className="relative">

                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </div>

                <input
                    value={value || ""}
                    disabled={disabled}
                    required={required}
                    onChange={e =>
                        onChange?.(
                            e.target.value
                        )
                    }
                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm outline-none transition ${disabled
                            ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        }`}
                />

            </div>

            {hint && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                    {hint}
                </p>
            )}

        </div>

    );
}


/* =========================================================
   READ ONLY FIELD
========================================================= */

function ReadOnlyField({
    icon,
    label,
    value,
    multiline = false
}) {

    return (

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-center gap-2 text-slate-500">

                {icon}

                <span className="text-xs font-bold">
                    {label}
                </span>

                <LockKeyhole
                    size={13}
                    className="ml-auto text-slate-400"
                />

            </div>

            <p className={`mt-2 text-sm font-semibold text-slate-800 break-words ${multiline
                    ? "leading-6"
                    : ""
                }`}>
                {value || "Not provided"}
            </p>

        </div>

    );
}