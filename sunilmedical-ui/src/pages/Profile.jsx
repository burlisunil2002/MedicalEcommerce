import { useEffect, useState } from "react";
import API from "../services/api";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        API.get("/api/account/profile")
            .then(res => setUser(res.data));
    }, []);

    const handleChange = (field, value) => {
        setUser(prev => ({ ...prev, [field]: value }));
    };

    const saveProfile = async () => {
        API.post("/api/account/update-profile", user);
        alert("Profile Updated");
        setEdit(false);
    };

    if (!user) return <div className="p-6">Loading...</div>;

    return (

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">

                <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-6">

                    {/* SIDEBAR */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg">

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold">
                                {user.name?.[0]}
                            </div>

                            <h3 className="mt-3 font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>

                        <div className="mt-6 space-y-2">
                            <button className="menu-item">📦 Orders</button>
                            <button className="menu-item">🎧 Support</button>
                        </div>

                    </div>

                    {/* MAIN */}
                    <div className="md:col-span-3 bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl">

                        <div className="flex justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Profile Details</h2>
                                <p className="text-gray-500 text-sm">Manage your account</p>
                            </div>

                            <button
                                onClick={() => setEdit(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                ✏️ Edit
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">

                            <input
                                value={user.name || ""}
                                onChange={e => handleChange("name", e.target.value)}
                                className="input"
                                disabled={!edit}
                                placeholder="Name"
                            />

                            <input
                                value={user.email || ""}
                                disabled
                                className="input bg-gray-100"
                            />

                            <input
                                value={user.mobile || ""}
                                onChange={e => handleChange("mobile", e.target.value)}
                                className="input"
                                disabled={!edit}
                                placeholder="Mobile"
                            />

                            <textarea
                                value={user.address || ""}
                                onChange={e => handleChange("address", e.target.value)}
                                className="input col-span-2"
                                disabled={!edit}
                                placeholder="Address"
                            />

                        </div>

                        {edit && (
                            <div className="mt-6 text-right">
                                <button
                                    onClick={saveProfile}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg"
                                >
                                    💾 Save
                                </button>
                            </div>
                        )}

                    </div>

                </div>
            </div>

    );
}