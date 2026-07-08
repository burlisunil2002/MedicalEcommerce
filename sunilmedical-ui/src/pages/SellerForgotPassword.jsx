import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import API from "../services/api";

export default function SellerForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);

    const submit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const { data } = await API.post(
                "/api/Seller/seller-forgot-password",
                {
                    email
                });

            Swal.fire({
                icon: "success",
                title: "Reset Link Sent",
                text: data.message
            });

            setEmail("");

        }
        catch (err) {

            Swal.fire(
                "Error",
                err.response?.data?.message ||
                "Unable to send reset link.",
                "error");

        }
        finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 via-white to-cyan-100">

            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">

                <button

                    onClick={() => navigate("/seller-login")}

                    className="flex items-center gap-2 text-blue-600 mb-8"

                >

                    <ArrowLeft size={18} />

                    Back

                </button>

                <h1 className="text-3xl font-bold text-center">

                    Forgot Password

                </h1>

                <p className="text-gray-500 text-center mt-3">

                    Enter your registered seller email.

                </p>

                <form

                    onSubmit={submit}

                    className="mt-8 space-y-6"

                >

                    <div>

                        <label>

                            Email Address

                        </label>

                        <div className="relative mt-2">

                            <Mail

                                className="absolute left-4 top-4 text-gray-400"

                                size={18}

                            />

                            <input

                                type="email"

                                required

                                value={email}

                                onChange={(e) => setEmail(e.target.value)}

                                className="w-full pl-11 py-3 border rounded-xl outline-none"

                                placeholder="seller@email.com"

                            />

                        </div>

                    </div>

                    <button

                        disabled={loading}

                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold"

                    >

                        {

                            loading

                                ?

                                <div className="flex justify-center">

                                    <Loader2 className="animate-spin" />

                                </div>

                                :

                                "Send Reset Link"

                        }

                    </button>

                </form>

            </div>

        </div>

    );

}