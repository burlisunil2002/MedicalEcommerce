import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function AdminLoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const login = async (e) => {
        e?.preventDefault();

        if (loading) return;

        setError("");

        if (!email.trim()) {
            setError("Please enter your admin email.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            const res = await API.post("/api/admin-login", {
                email: email.trim(),
                password,
            });

            if (res.data?.success) {
                localStorage.setItem("role", "Admin");

                navigate("/admin/dashboard", {
                    replace: true,
                });

                return;
            }

            setError(
                res.data?.message ||
                "Unable to sign in. Please check your credentials."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />

                <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">

                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">

                    {/* Header */}
                    <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10">

                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-8 w-8 text-white"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3z"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8v6"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 11h6"
                                    />
                                </svg>

                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center">

                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                Admin Login
                            </h1>

                            <p className="mt-2 text-sm sm:text-base text-slate-500">
                                Sign in to access your administration dashboard
                            </p>

                        </div>

                    </div>

                    {/* Form */}
                    <form
                        onSubmit={login}
                        className="px-6 pb-8 sm:px-8 sm:pb-10"
                    >

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                            >
                                <div className="flex items-start gap-3">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            d="M12 8v4"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            d="M12 16h.01"
                                        />
                                    </svg>

                                    <p className="text-sm font-medium text-red-700">
                                        {error}
                                    </p>

                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="mb-5">

                            <label
                                htmlFor="admin-email"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Admin Email
                            </label>

                            <div className="relative">

                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-5 w-5 text-slate-400"
                                    >
                                        <rect
                                            x="3"
                                            y="5"
                                            width="18"
                                            height="14"
                                            rx="2"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m3 7 9 6 9-6"
                                        />
                                    </svg>
                                </div>

                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="Enter your admin email"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck="false"
                                    disabled={loading}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />

                            </div>

                        </div>

                        {/* Password */}
                        <div className="mb-6">

                            <label
                                htmlFor="admin-password"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Password
                            </label>

                            <div className="relative">

                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-5 w-5 text-slate-400"
                                    >
                                        <rect
                                            x="5"
                                            y="10"
                                            width="14"
                                            height="10"
                                            rx="2"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 10V7a4 4 0 0 1 8 0v3"
                                        />
                                    </svg>
                                </div>

                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                                >
                                    {showPassword ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 3l18 18"
                                            />

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                                            />

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 3.5 9.5 7-0.4 1.3-1.1 2.4-2 3.4"
                                            />

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6.2 6.2C4.5 7.4 3.5 9 2.5 12c1 3.5 4.5 7 9.5 7 1.6 0 3-.3 4.3-.9"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                                            />

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="2.5"
                                            />
                                        </svg>
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/30 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                        >

                            {loading ? (
                                <>
                                    <svg
                                        className="h-5 w-5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            className="opacity-30"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />

                                        <path
                                            d="M21 12a9 9 0 0 0-9-9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <span>
                                        Signing in...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        Sign in to Dashboard
                                    </span>

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="h-5 w-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 12h14"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m13 6 6 6-6 6"
                                        />
                                    </svg>
                                </>
                            )}

                        </button>

                        {/* Security Information */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4"
                            >
                                <rect
                                    x="5"
                                    y="10"
                                    width="14"
                                    height="10"
                                    rx="2"
                                />

                                <path
                                    strokeLinecap="round"
                                    d="M8 10V7a4 4 0 0 1 8 0v3"
                                />
                            </svg>

                            <span>
                                Secure administrator access
                            </span>

                        </div>

                    </form>

                </div>

                {/* Footer */}
                <p className="mt-5 text-center text-xs text-slate-400 px-4">
                    Authorized administrators only
                </p>

            </div>

        </div>
    );
}