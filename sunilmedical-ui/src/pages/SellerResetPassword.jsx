import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import Swal from "sweetalert2";
import API from "../services/api";

export default function SellerResetPassword() {

    const navigate = useNavigate();

    const [params] = useSearchParams();

    const email = params.get("email");

    const token = params.get("token");

    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const submit = async (e) => {

        e.preventDefault();

        if (password !== confirmPassword) {

            Swal.fire(
                "Error",
                "Passwords do not match.",
                "error");

            return;

        }

        try {

            setLoading(true);

            const { data } = await API.post(

                "/api/Seller/seller-reset-password",

                {

                    email,

                    token,

                    newPassword: password,

                    confirmPassword

                });

            Swal.fire({

                icon: "success",

                title: "Password Updated",

                text: data.message

            }).then(() => {

                navigate("/seller-login");

            });

        }

        catch (err) {

            Swal.fire(

                "Error",

                err.response?.data?.message ||

                "Unable to update password.",

                "error");

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-cyan-50">

            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">

                <h2 className="text-3xl font-bold text-center">

                    Reset Password

                </h2>

                <form

                    onSubmit={submit}

                    className="space-y-6 mt-8"

                >

                    <div>

                        <label>

                            New Password

                        </label>

                        <div className="relative mt-2">

                            <Lock

                                size={18}

                                className="absolute left-4 top-4 text-gray-400"

                            />

                            <input

                                type="password"

                                required

                                value={password}

                                onChange={(e) => setPassword(e.target.value)}

                                className="w-full pl-11 py-3 border rounded-xl"

                            />

                        </div>

                    </div>

                    <div>

                        <label>

                            Confirm Password

                        </label>

                        <div className="relative mt-2">

                            <Lock

                                size={18}

                                className="absolute left-4 top-4 text-gray-400"

                            />

                            <input

                                type="password"

                                required

                                value={confirmPassword}

                                onChange={(e) => setConfirmPassword(e.target.value)}

                                className="w-full pl-11 py-3 border rounded-xl"

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

                                "Updating..."

                                :

                                "Update Password"

                        }

                    </button>

                </form>

            </div>

        </div>

    );

}