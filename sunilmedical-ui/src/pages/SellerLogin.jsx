import { useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";


import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Building2,
    CircleCheckBig
} from "lucide-react";

export default function SellerLogin() {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const [success, setSuccess] = useState(false);

    const [loginData, setLoginData] = useState({

        email: "",

        password: ""

    });

    const handleChange = (e) => {

        setLoginData({

            ...loginData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        setMessage("");

        try {

            const form = new FormData();

            form.append("email", loginData.email);
            form.append("password", loginData.password);

            const response = await API.post(
                "/api/Seller/login",
                loginData
            );

            if (response.data.success) {

                localStorage.setItem(
                    "seller",
                    JSON.stringify(response.data.seller)
                );

                setSuccess(true);

                setMessage(response.data.message);

                setTimeout(() => {

                    navigate("/seller/dashboard");

                }, 800);

            }

            else {

                setSuccess(false);

                setMessage(response.data.message);

            }

        }

        catch (err) {

            setSuccess(false);

            setMessage(

                err.response?.data?.message ||

                "Login Failed."

            );

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-slate-100">

            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600">

                <div className="absolute inset-0 opacity-20">

                    <div className="absolute w-96 h-96 rounded-full bg-white blur-3xl -top-40 -left-20"></div>

                    <div className="absolute w-96 h-96 rounded-full bg-cyan-300 blur-3xl bottom-0 right-0"></div>

                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-20">

                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        <div>

                            <motion.h1

                                initial={{ opacity: 0, y: 40 }}

                                animate={{ opacity: 1, y: 0 }}

                                transition={{ duration: .7 }}

                                className="text-6xl font-black text-white leading-tight">

                                Welcome Back

                                <span className="block text-cyan-300">

                                    Seller

                                </span>

                            </motion.h1>

                            <p className="mt-6 text-blue-100 text-lg">

                                Manage products, orders, analytics and grow your medical business from one dashboard.

                            </p>

                            <div className="mt-10 space-y-5">

                                <div className="flex items-center gap-3 text-white">

                                    <CircleCheckBig />

                                    Verified Marketplace

                                </div>

                                <div className="flex items-center gap-3 text-white">

                                    <ShieldCheck />

                                    Secure Payments

                                </div>

                                <div className="flex items-center gap-3 text-white">

                                    <Building2 />

                                    100+ Medical Sellers

                                </div>

                            </div>

                        </div>

                        <div>

                            <img
                                loading="lazy"
                                src="/images/sellerimage.jpg"
                                alt="Medical Seller"
                                className="rounded-3xl shadow-2xl border-8 border-white/20 object-cover w-full"
                            />

                        </div>

                    </div>

                </div>

            </div>
            <div className="max-w-lg mx-auto -mt-24 relative z-20">

                <div className="bg-white rounded-3xl shadow-2xl p-10">

                    <h2 className="text-4xl font-bold text-center">

                        Seller Login

                    </h2>

                    <p className="text-center text-gray-500 mt-3">

                        Access your seller dashboard

                    </p>

                    {
                        message && (
                            <div
                                className={`mt-6 rounded-xl p-4 text-sm font-medium ${success
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
                        className="space-y-6 mt-8"
                    >
                        <div>

                            <label className="font-semibold text-gray-700">

                                Email Address

                            </label>

                            <div className="relative mt-2">

                                <Mail
                                    size={20}
                                    className="absolute left-4 top-4 text-gray-400"
                                />

                                <input

                                    type="email"

                                    name="email"

                                    value={loginData.email}

                                    onChange={handleChange}

                                    placeholder="seller@company.com"

                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"

                                    required

                                />

                            </div>

                        </div>
                        <div>

                            <label className="font-semibold text-gray-700">

                                Password

                            </label>

                            <div className="relative mt-2">

                                <Lock
                                    size={20}
                                    className="absolute left-4 top-4 text-gray-400"
                                />

                                <input

                                    type={showPassword ? "text" : "password"}

                                    name="password"

                                    value={loginData.password}

                                    onChange={handleChange}

                                    placeholder="Enter Password"

                                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"

                                    required

                                />

                                <button

                                    type="button"

                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }

                                    className="absolute right-4 top-4"

                                >

                                    {
                                        showPassword ?

                                            <EyeOff size={20} />

                                            :

                                            <Eye size={20} />

                                    }

                                </button>

                            </div>

                        </div>
                        <div className="flex justify-between items-center">

                            <label className="flex items-center gap-2 text-sm">

                                <input
                                    type="checkbox"
                                    className="rounded"
                                />

                                Remember Me

                            </label>

                            <Link
                                to="/seller-forgot-password"
                                className="text-blue-600 text-sm hover:underline"
                            >
                                Forgot Password?
                            </Link>

                        </div>
                        <button

                            type="submit"

                            disabled={loading}

                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition flex justify-center items-center gap-3 disabled:opacity-60"

                        >

                            {
                                loading ?

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

                                        Signing In...

                                    </>

                                    :

                                    <>

                                        Login

                                        <ArrowRight size={20} />

                                    </>

                            }

                        </button>
                        <div className="text-center pt-6">

                            <p className="text-gray-500">

                                Don't have a seller account?

                            </p>

                            <button
                                onClick={() => navigate("/seller-register")}
                            >

                                Become a Seller →

                            </button>

                        </div>
                    </form>

                <div className="relative my-8">

                    <div className="border-t"></div>

                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-gray-400 text-sm">

                        Trusted Medical Marketplace

                    </span>

                </div>
                <div className="grid grid-cols-3 gap-4">

                    <div className="text-center">

                        <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center">

                            <ShieldCheck className="text-blue-600" />

                        </div>

                        <h4 className="font-semibold mt-3">

                            Secure Login

                        </h4>

                        <p className="text-xs text-gray-500 mt-1">

                            SSL Protected

                        </p>

                    </div>

                    <div className="text-center">

                        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">

                            <CircleCheckBig className="text-green-600" />

                        </div>

                        <h4 className="font-semibold mt-3">

                            Verified Sellers

                        </h4>

                        <p className="text-xs text-gray-500 mt-1">

                            Trusted Marketplace

                        </p>

                    </div>

                    <div className="text-center">

                        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">

                            <Building2 className="text-indigo-600" />

                        </div>

                        <h4 className="font-semibold mt-3">

                            Medical Network

                        </h4>

                        <p className="text-xs text-gray-500 mt-1">

                            Hospitals & Clinics

                        </p>

                    </div>

                </div>
            </div>
        </div>
        <footer className="mt-20 bg-slate-900 text-slate-300">

    <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid md:grid-cols-4 gap-10">

            <div>

                <h2 className="text-2xl font-bold text-white">

                    MedMarket

                </h2>

                <p className="mt-4 text-sm leading-6">

                    India's trusted online medical marketplace connecting manufacturers, distributors and healthcare providers.

                </p>

            </div>

            <div>

                <h3 className="font-semibold text-white">

                    Sellers

                </h3>

                <ul className="mt-4 space-y-2 text-sm">

                    <li>Seller Dashboard</li>

                    <li>Manage Products</li>

                    <li>Orders</li>

                    <li>Reports</li>

                </ul>

            </div>

            <div>

                <h3 className="font-semibold text-white">

                    Company

                </h3>

                <ul className="mt-4 space-y-2 text-sm">

                    <li>About Us</li>

                    <li>Privacy Policy</li>

                    <li>Terms & Conditions</li>

                    <li>Support</li>

                </ul>

            </div>

            <div>

                <h3 className="font-semibold text-white">

                    Contact

                </h3>

                <p className="mt-4 text-sm">

                    support@sunilmedicalproducts.com

                </p>

                <p className="mt-2 text-sm">

                    +91 9014060858

                </p>

            </div>

        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 text-center text-sm">

            © 2026 SunilMedMarket. All Rights Reserved.

        </div>

    </div>

</footer>
</div >
);
}