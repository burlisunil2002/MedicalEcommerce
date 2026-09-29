import { useEffect, useState } from "react";
import API from "../services/api";
import {
    User,
    Mail,
    Phone,
    Building2,
    FileText,
    MapPin,
    Pencil,
    Trash2,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    X,
    Save,
    Home,
    BriefcaseBusiness,
    MapPinned
} from "lucide-react";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editProfile, setEditProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [editingAddress, setEditingAddress] = useState(null);
    const [savingAddress, setSavingAddress] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);

            const res = await API.get("/api/account/profile");

            setUser({
                ...res.data,
                addresses: res.data.addresses || []
            });
        } catch (err) {
            console.error("Profile loading failed:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load profile."
            );
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    const updateUserField = (field, value) => {
        setUser(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const saveProfile = async () => {
        try {
            setSavingProfile(true);
            setError("");

            await API.post("/api/account/update-profile", {
                CustomerName: user.name,
                MobileNo: user.mobile
            });

            setEditProfile(false);

            showMessage("Profile updated successfully.");

            await loadProfile();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const openAddressEdit = (address) => {
        setEditingAddress({
            ...address
        });
    };

    const updateAddressField = (field, value) => {
        setEditingAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const saveAddress = async () => {
        if (!editingAddress?.id) return;

        try {
            setSavingAddress(true);
            setError("");

            await API.put(
                `/api/account/addresses/${editingAddress.id}`,
                {
                    Id: editingAddress.id,
                    FullName: editingAddress.fullName,
                    MobileNumber: editingAddress.mobile,
                    AddressLine1: editingAddress.addressLine1,
                    AddressLine2: editingAddress.addressLine2 || "",
                    Landmark: editingAddress.landmark || "",
                    City: editingAddress.city,
                    State: editingAddress.state,
                    Pincode: editingAddress.pincode,
                    AddressType: editingAddress.label || "Home",
                    IsDefault: !!editingAddress.isDefault
                }
            );

            setEditingAddress(null);

            showMessage("Address updated successfully.");

            await loadProfile();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to update address."
            );
        } finally {
            setSavingAddress(false);
        }
    };

    const deleteAddress = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) return;

        try {
            setError("");

            await API.delete(
                `/api/account/addresses/${id}`
            );

            showMessage("Address deleted successfully.");

            await loadProfile();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to delete address."
            );
        }
    };

    const setDefaultAddress = async (id) => {
        try {
            setError("");

            await API.put(
                `/api/account/addresses/${id}/default`
            );

            showMessage("Default address updated.");

            await loadProfile();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to update default address."
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm text-slate-500">
                        Loading your account...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
                    <p className="text-red-600 font-medium">
                        {error || "Unable to load profile."}
                    </p>

                    <button
                        onClick={loadProfile}
                        className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const kyc = user.kyc || {};

    return (
        <div className="min-h-screen bg-slate-50">

            {/* SUCCESS MESSAGE */}
            {message && (
                <div className="fixed top-5 right-5 z-[100] bg-white border border-green-200 shadow-xl rounded-xl px-5 py-3 flex items-center gap-3">
                    <CheckCircle2
                        size={20}
                        className="text-green-600"
                    />

                    <span className="text-sm font-medium text-slate-700">
                        {message}
                    </span>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        My Account
                    </h1>

                    <p className="text-sm text-slate-500 mt-1">
                        Manage your profile, KYC information and saved addresses
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT SIDEBAR */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:sticky lg:top-6">

                            <div className="p-6 text-center border-b border-slate-100">

                                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                                    {(user.name || user.email || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <h2 className="mt-4 font-bold text-slate-900">
                                    {user.name || "Customer"}
                                </h2>

                                <p className="text-sm text-slate-500 mt-1 break-all">
                                    {user.email}
                                </p>

                                {kyc.isProfileCompleted && (
                                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                                        <ShieldCheck size={14} />
                                        KYC Completed
                                    </div>
                                )}
                            </div>

                            <div className="p-3">

                                <button
                                    onClick={() =>
                                        window.scrollTo({
                                            top: 0,
                                            behavior: "smooth"
                                        })
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <User
                                            size={18}
                                            className="text-slate-500"
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                                            Profile
                                        </span>
                                    </div>

                                    <ChevronRight size={16} />
                                </button>

                                <button
                                    onClick={() =>
                                        document
                                            .getElementById("kyc-section")
                                            ?.scrollIntoView({
                                                behavior: "smooth"
                                            })
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck
                                            size={18}
                                            className="text-slate-500"
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                                            KYC Details
                                        </span>
                                    </div>

                                    <ChevronRight size={16} />
                                </button>

                                <button
                                    onClick={() =>
                                        document
                                            .getElementById("addresses-section")
                                            ?.scrollIntoView({
                                                behavior: "smooth"
                                            })
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin
                                            size={18}
                                            className="text-slate-500"
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                                            Saved Addresses
                                        </span>
                                    </div>

                                    <ChevronRight size={16} />
                                </button>

                            </div>
                        </div>
                    </aside>

                    {/* MAIN */}
                    <main className="lg:col-span-3 space-y-6">

                        {/* CUSTOMER DETAILS */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">

                            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">

                                <div>
                                    <h2 className="font-bold text-lg text-slate-900">
                                        Customer Details
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Your basic account information
                                    </p>
                                </div>

                                {!editProfile ? (
                                    <button
                                        onClick={() => setEditProfile(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setEditProfile(false)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                )}

                            </div>

                            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                                <InfoField
                                    icon={<User size={18} />}
                                    label="Customer Name"
                                    value={user.name}
                                    editable={editProfile}
                                    onChange={(value) =>
                                        updateUserField("name", value)
                                    }
                                />

                                <InfoField
                                    icon={<Mail size={18} />}
                                    label="Email Address"
                                    value={user.email}
                                    disabled
                                />

                                <InfoField
                                    icon={<Phone size={18} />}
                                    label="Mobile Number"
                                    value={user.mobile}
                                    editable={editProfile}
                                    onChange={(value) =>
                                        updateUserField("mobile", value)
                                    }
                                />

                            </div>

                            {editProfile && (
                                <div className="px-5 sm:px-6 pb-6 flex justify-end">
                                    <button
                                        onClick={saveProfile}
                                        disabled={savingProfile}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-60"
                                    >
                                        <Save size={17} />

                                        {savingProfile
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            )}

                        </section>

                        {/* KYC */}
                        {/* =========================================================
   KYC SECTION
========================================================= */}

                        <section
                            id="kyc-section"
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >

                            <div className="px-5 sm:px-6 py-5 border-b border-slate-100">

                                <div className="flex items-center gap-3">

                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kyc.isProfileCompleted
                                            ? "bg-green-50 text-green-600"
                                            : "bg-red-50 text-red-600"
                                        }`}>
                                        <ShieldCheck size={21} />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-lg text-slate-900">
                                            KYC / Business Details
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {kyc.isProfileCompleted
                                                ? "Your verified business information"
                                                : "Complete your KYC to access all customer features"
                                            }
                                        </p>
                                    </div>

                                </div>

                            </div>


                            {/* =====================================================
       KYC PENDING
    ===================================================== */}

                            {!kyc.isProfileCompleted ? (

                                <div className="p-5 sm:p-7">

                                    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-5 sm:p-7">

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

                                            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                <ShieldCheck size={30} />
                                            </div>

                                            <div className="flex-1">

                                                <div className="flex flex-wrap items-center gap-2">

                                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                                        KYC Verification Pending
                                                    </h3>

                                                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                        Pending
                                                    </span>

                                                </div>

                                                <p className="mt-2 text-sm text-slate-600 leading-6">
                                                    Your KYC details have not been completed yet.
                                                    Complete your business information and verification
                                                    to finish setting up your account.
                                                </p>

                                            </div>

                                            <button
                                                onClick={() =>
                                                    window.location.href =
                                                    "/kyc/register"
                                                }
                                                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm transition"
                                            >
                                                <ShieldCheck size={17} />
                                                Complete KYC
                                                <ChevronRight size={17} />
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            ) : (

                                /* =================================================
                                   KYC COMPLETED - READ ONLY
                                ================================================= */

                                <div className="p-5 sm:p-6">

                                    <div className="mb-5 flex flex-wrap items-center gap-2">

                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                            <CheckCircle2 size={14} />
                                            KYC Completed
                                        </span>

                                        {kyc.gstVerified === true && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                <ShieldCheck size={14} />
                                                GST Verified
                                            </span>
                                        )}

                                    </div>


                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <DetailBox
                                            icon={<Building2 size={18} />}
                                            label="Company Name"
                                            value={kyc.companyName}
                                        />

                                        <DetailBox
                                            icon={<User size={18} />}
                                            label="Customer Name"
                                            value={kyc.customerName}
                                        />

                                        <DetailBox
                                            icon={<BriefcaseBusiness size={18} />}
                                            label="Industry / Sector"
                                            value={kyc.industrySector}
                                        />

                                        <DetailBox
                                            icon={<Phone size={18} />}
                                            label="Registered Mobile"
                                            value={kyc.mobileNo}
                                        />

                                        <DetailBox
                                            icon={<Mail size={18} />}
                                            label="Primary Email"
                                            value={kyc.email}
                                        />

                                        <DetailBox
                                            icon={<Mail size={18} />}
                                            label="Secondary Email"
                                            value={kyc.secondaryEmail}
                                        />

                                        <DetailBox
                                            icon={<Phone size={18} />}
                                            label="Secondary Mobile"
                                            value={kyc.secondaryMobile}
                                        />

                                        <DetailBox
                                            icon={<FileText size={18} />}
                                            label="GST Number"
                                            value={kyc.gstNo}
                                        />

                                        <DetailBox
                                            icon={<FileText size={18} />}
                                            label="PAN Number"
                                            value={kyc.panNo}
                                        />

                                        <DetailBox
                                            icon={<MapPin size={18} />}
                                            label="GST State"
                                            value={kyc.gstState}
                                        />

                                        <div className="md:col-span-2">

                                            <DetailBox
                                                icon={<MapPinned size={18} />}
                                                label="Business Address"
                                                value={kyc.address}
                                            />

                                        </div>

                                    </div>


                                    {kyc.documentPath && (
                                        <div className="mt-5 pt-5 border-t border-slate-100">

                                            <a
                                                href={kyc.documentPath}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                <FileText size={17} />
                                                View KYC Document
                                            </a>

                                        </div>
                                    )}

                                </div>

                            )}

                        </section>

                        {/* ADDRESSES */}
                        <section
                            id="addresses-section"
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                        >

                            <div className="px-5 sm:px-6 py-5 border-b border-slate-100">

                                <div className="flex items-center gap-3">

                                    <MapPin
                                        size={21}
                                        className="text-blue-600"
                                    />

                                    <div>
                                        <h2 className="font-bold text-lg text-slate-900">
                                            Saved Addresses
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Addresses saved during checkout
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="p-5 sm:p-6">

                                {user.addresses?.length === 0 ? (
                                    <div className="text-center py-12">

                                        <MapPin
                                            size={42}
                                            className="mx-auto text-slate-300"
                                        />

                                        <h3 className="mt-4 font-semibold text-slate-700">
                                            No saved addresses
                                        </h3>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Add an address during checkout.
                                        </p>

                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                        {user.addresses.map(address => (
                                            <AddressCard
                                                key={address.id}
                                                address={address}
                                                onEdit={() =>
                                                    openAddressEdit(address)
                                                }
                                                onDelete={() =>
                                                    deleteAddress(address.id)
                                                }
                                                onDefault={() =>
                                                    setDefaultAddress(address.id)
                                                }
                                            />
                                        ))}

                                    </div>
                                )}

                            </div>

                        </section>

                    </main>
                </div>
            </div>

            {/* ADDRESS EDIT MODAL */}
            {editingAddress && (
                <AddressModal
                    address={editingAddress}
                    saving={savingAddress}
                    onClose={() => setEditingAddress(null)}
                    onChange={updateAddressField}
                    onSave={saveAddress}
                />
            )}

        </div>
    );
}


/* =========================================================
   INFO FIELD
========================================================= */

function InfoField({
    icon,
    label,
    value,
    editable = false,
    disabled = false,
    onChange
}) {
    return (
        <div>

            <label className="block text-xs font-semibold text-slate-500 mb-2">
                {label}
            </label>

            <div className="relative">

                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </div>

                <input
                    value={value || ""}
                    disabled={disabled || !editable}
                    onChange={e =>
                        onChange?.(e.target.value)
                    }
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition ${disabled || !editable
                            ? "bg-slate-50 border-slate-200 text-slate-600"
                            : "bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        }`}
                />

            </div>
        </div>
    );
}


/* =========================================================
   DETAIL BOX
========================================================= */

function DetailBox({
    icon,
    label,
    value
}) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

            <div className="flex items-center gap-2 text-slate-500">
                {icon}

                <span className="text-xs font-semibold">
                    {label}
                </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-800 break-words">
                {value || "Not provided"}
            </p>

        </div>
    );
}


/* =========================================================
   ADDRESS CARD
========================================================= */

function AddressCard({
    address,
    onEdit,
    onDelete,
    onDefault
}) {
    return (
        <div className="border border-slate-200 rounded-2xl p-5 hover:border-blue-200 transition">

            <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-2">

                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        {address.label?.toLowerCase() === "office" ||
                            address.label?.toLowerCase() === "work" ? (
                            <BriefcaseBusiness size={18} />
                        ) : (
                            <Home size={18} />
                        )}
                    </div>

                    <div>

                        <div className="flex items-center gap-2 flex-wrap">

                            <h3 className="font-bold text-slate-900">
                                {address.label || "Home"}
                            </h3>

                            {address.isDefault && (
                                <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase">
                                    Default
                                </span>
                            )}

                        </div>

                    </div>

                </div>

                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600"
                    title="Edit address"
                >
                    <Pencil size={17} />
                </button>

            </div>

            <div className="mt-4 space-y-1 text-sm">

                <p className="font-semibold text-slate-800">
                    {address.fullName}
                </p>

                <p className="text-slate-600">
                    {address.mobile}
                </p>

                <p className="text-slate-600">
                    {address.addressLine1}
                </p>

                {address.addressLine2 && (
                    <p className="text-slate-600">
                        {address.addressLine2}
                    </p>
                )}

                {address.landmark && (
                    <p className="text-slate-600">
                        Landmark: {address.landmark}
                    </p>
                )}

                <p className="text-slate-700 font-medium">
                    {address.city}, {address.state} - {address.pincode}
                </p>

            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">

                {!address.isDefault ? (
                    <button
                        onClick={onDefault}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Set as Default
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Default Address
                    </span>
                )}

                <button
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                >
                    <Trash2 size={14} />
                    Delete
                </button>

            </div>

        </div>
    );
}


/* =========================================================
   ADDRESS MODAL
========================================================= */

function AddressModal({
    address,
    saving,
    onClose,
    onChange,
    onSave
}) {
    return (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">

                <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 flex items-center justify-between">

                    <div>
                        <h2 className="font-bold text-lg text-slate-900">
                            Edit Address
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            Update your saved checkout address
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>

                </div>

                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <AddressInput
                        label="Full Name"
                        value={address.fullName}
                        onChange={v =>
                            onChange("fullName", v)
                        }
                    />

                    <AddressInput
                        label="Mobile Number"
                        value={address.mobile}
                        onChange={v =>
                            onChange("mobile", v)
                        }
                    />

                    <div className="md:col-span-2">
                        <AddressInput
                            label="Address Line 1"
                            value={address.addressLine1}
                            onChange={v =>
                                onChange("addressLine1", v)
                            }
                        />
                    </div>

                    <AddressInput
                        label="Address Line 2"
                        value={address.addressLine2}
                        onChange={v =>
                            onChange("addressLine2", v)
                        }
                    />

                    <AddressInput
                        label="Landmark"
                        value={address.landmark}
                        onChange={v =>
                            onChange("landmark", v)
                        }
                    />

                    <AddressInput
                        label="City"
                        value={address.city}
                        onChange={v =>
                            onChange("city", v)
                        }
                    />

                    <AddressInput
                        label="State"
                        value={address.state}
                        onChange={v =>
                            onChange("state", v)
                        }
                    />

                    <AddressInput
                        label="Pincode"
                        value={address.pincode}
                        onChange={v =>
                            onChange("pincode", v)
                        }
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Address Type
                        </label>

                        <select
                            value={address.label || "Home"}
                            onChange={e =>
                                onChange(
                                    "label",
                                    e.target.value
                                )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="Home">
                                Home
                            </option>

                            <option value="Office">
                                Office
                            </option>

                            <option value="Work">
                                Work
                            </option>
                        </select>
                    </div>

                    <div className="md:col-span-2">

                        <label className="flex items-center gap-3 cursor-pointer">

                            <input
                                type="checkbox"
                                checked={
                                    !!address.isDefault
                                }
                                onChange={e =>
                                    onChange(
                                        "isDefault",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4"
                            />

                            <span className="text-sm font-medium text-slate-700">
                                Make this my default address
                            </span>

                        </label>

                    </div>

                </div>

                <div className="border-t border-slate-100 px-5 sm:px-6 py-4 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
                    >
                        <Save size={16} />

                        {saving
                            ? "Saving..."
                            : "Save Address"}
                    </button>

                </div>

            </div>
        </div>
    );
}


/* =========================================================
   ADDRESS INPUT
========================================================= */

function AddressInput({
    label,
    value,
    onChange
}) {
    return (
        <div>

            <label className="block text-xs font-semibold text-slate-500 mb-2">
                {label}
            </label>

            <input
                value={value || ""}
                onChange={e =>
                    onChange(e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

        </div>
    );
}