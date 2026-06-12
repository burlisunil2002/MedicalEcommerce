import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function AdminLoginPage() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {

        try {

            const res = await API.post(
                "/api/admin-login",
                {
                    email,
                    password
                }
            );

            if (res.data.success) {

                localStorage.setItem(
                    "role",
                    "Admin"
                );

                navigate("/admin/admin-dashboard");
            }

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Login Failed"
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">

            <div className="bg-white p-8 rounded-2xl shadow w-96">

                <h1 className="text-2xl font-bold mb-6">
                    Admin Login
                </h1>

                <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    className="border w-full p-3 rounded mb-4"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    className="border w-full p-3 rounded mb-4"
                />

                <button
                    onClick={login}
                    className="bg-blue-600 text-white w-full p-3 rounded"
                >
                    Login
                </button>

            </div>

        </div>
    );
}