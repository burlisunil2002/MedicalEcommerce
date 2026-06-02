import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import API from "../services/api";
import OTPInput from "../components/OTPInput";

export default function LoginPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [otpKey, setOtpKey] = useState(Date.now());

    useEffect(() => {
        if (timer <= 0) return;

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    const sendOtp = async () => {
        if (!email.trim()) {
            alert("Please enter email");
            return;
        }

        try {
            setLoading(true);

            // Reset old OTP
            setOtp("");
            setOtpKey(Date.now());

            await API.post("/api/account/send-otp", {
                email: email.trim()
            });

            setStep("otp");
            setTimer(30);

        } catch (err) {
            alert(
                err?.response?.data?.message ||
                "Failed to send OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (otp.length !== 6) {
            alert("Please enter valid 6 digit OTP");
            return;
        }

        try {
            setLoading(true);

            const res = await API.post(
                "/api/account/verify-otp",
                {
                    email: email.trim(),
                    otp: otp.trim()
                }
            );

            if (res.data.success) {
                window.location.replace("/");
            }

        } catch (err) {
            alert(
                err?.response?.data?.message ||
                "Invalid OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center px-4">

                <button
                    onClick={() => navigate("/")}
                    className="fixed top-5 left-5 z-20 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border p-8">

                    <h1 className="text-3xl font-bold text-center mb-2">
                        Welcome Back 👋
                    </h1>

                    <p className="text-center text-gray-500 mb-6">
                        Login using Email OTP
                    </p>

                    {step === "email" && (
                        <>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="Enter your email"
                                className="w-full border rounded-xl p-4 mb-4 focus:ring-2 focus:ring-pink-500 outline-none"
                            />

                            <button
                                onClick={sendOtp}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 rounded-xl"
                            >
                                Send OTP
                            </button>
                        </>
                    )}

                    {step === "otp" && (
                        <>
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-500">
                                    OTP sent to
                                </p>

                                <p className="font-semibold">
                                    {email}
                                </p>
                            </div>

                            <OTPInput
                                key={otpKey}
                                value={otp}
                                setValue={setOtp}
                            />

                            <button
                                onClick={verifyOtp}
                                disabled={
                                    loading ||
                                    otp.length !== 6
                                }
                                className="w-full mt-5 bg-green-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                            >
                                Verify OTP
                            </button>

                            <div className="text-center mt-5">

                                {timer > 0 ? (
                                    <span className="text-gray-500 text-sm">
                                        Resend OTP in {timer}s
                                    </span>
                                ) : (
                                    <button
                                        onClick={sendOtp}
                                        className="text-pink-600 font-semibold"
                                    >
                                        Resend OTP
                                    </button>
                                )}

                            </div>

                            <button
                                onClick={() => {
                                    setStep("email");
                                    setOtp("");
                                }}
                                className="w-full mt-4 text-sm text-gray-500"
                            >
                                Change Email
                            </button>
                        </>
                    )}

                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">

                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center">

                        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

                        <p className="mt-4 font-medium">
                            {step === "email"
                                ? "Sending OTP..."
                                : "Verifying OTP..."}
                        </p>

                    </div>

                </div>
            )}
        </>
    );
}