import { useState, useEffect } from "react";
import API from "../services/api";
import OTPInput from "../components/OTPInput";

export default function LoginPage() {
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    // ⏱ Timer
    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [timer]);

    // 🔥 Send OTP
    const sendOtp = async () => {
        try {
            setLoading(true);

            const res = await API.post("/api/account/send-otp", { email });

            setStep("otp");
            setTimer(30);
        } catch (err) {
            alert(err.response?.data?.message || "Error sending OTP");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Verify OTP
    const verifyOtp = async () => {
        try {
            setLoading(true);

            const res = await API.post("/api/account/verify-otp", {
                email,
                otp
            });

            if (res.data.success) {
                window.location.href = "/";
            }
        } catch (err) {
            alert(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
            <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-pink-50 to-blue-50">

                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

                    <h2 className="text-2xl font-bold text-center mb-6">
                        Welcome Back 👋
                    </h2>

                    {/* EMAIL STEP */}
                    {step === "email" && (
                        <>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-pink-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <button
                                onClick={sendOtp}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </>
                    )}

                    {/* OTP STEP */}
                    {step === "otp" && (
                        <>
                            <p className="text-sm text-center mb-2">
                                OTP sent to <b>{email}</b>
                            </p>

                            <OTPInput value={otp} setValue={setOtp} />

                            <button
                                onClick={verifyOtp}
                                disabled={loading || otp.length < 6}
                                className="w-full bg-green-500 text-white py-3 rounded-lg mt-4 font-semibold hover:scale-105 transition"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            {/* RESEND */}
                            <div className="text-center mt-4 text-sm">
                                {timer > 0 ? (
                                    <span className="text-gray-500">
                                        Resend in {timer}s
                                    </span>
                                ) : (
                                    <button
                                        onClick={sendOtp}
                                        className="text-pink-500 font-medium"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

            </div>
    );
}