import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";


export default function MainHeader() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const navigate = useNavigate();
    const { cartCount } = useCart();

    const { loadCart } = useCart();
    const { wishlistCount } = useWishlist();


    const handleLogout = async () => {
        try {
            await API.post("/api/account/logout");
        } catch { }

        setUser(null);
        loadCart(); // reset cart

        navigate("/login");
    };

    const isKycDone = user?.isProfileCompleted;

    // 🔥 WHATSAPP CONFIG
    const whatsappNumber = "9014060858"; // 🔁 replace

    const handleChat = () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!isKycDone) {
            navigate("/kyc/register");
            return;
        }

        const msg = encodeURIComponent("Hi, I need assistance with products.");
        window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
    };

    // 🔐 LOAD USER
    useEffect(() => {
        API.get("/api/user")
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    // 🔍 SEARCH
    useEffect(() => {
        if (search.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            API.get(`/api/products/search?term=${search}`)
                .then(res => setSuggestions(res.data))
                .catch(() => setSuggestions([]));
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 shadow-md">

            {/* 🔥 TOP STRIP */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs text-center py-1">
                🚀 Trusted | Fast Delivery
            </div>

            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

                {/* LEFT */}
                <div className="flex items-center gap-3">
                    <img
                        src="/images/sunillogo.png"
                        className="h-9 cursor-pointer"
                        onClick={() => navigate("/")}
                    />
                </div>

                {/* SEARCH */}
                <div className="flex-1 mx-6 relative hidden md:block">

                    <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-pink-400">

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products, brands..."
                            className="flex-1 bg-transparent outline-none px-2 text-sm"
                        />

                        <button onClick={() => navigate(`/search/${search}`)}>
                            🔍
                        </button>
                    </div>

                    {/* SUGGESTIONS */}
                    {suggestions.length > 0 && (
                        <div className="absolute top-12 w-full bg-white shadow-xl rounded-xl z-50">

                            {suggestions.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setSearch("");
                                        setSuggestions([]);
                                        navigate(`/product/${item.id}`);
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
                                >
                                    <img
                                        src={item.imageUrl || "/images/no-image.png"}
                                        className="w-10 h-10 rounded object-cover"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.brand}</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

                </div>

                {/* RIGHT MENU */}
                <div className="flex items-center gap-4">

                    {/* HOME */}
                    <button
                        onClick={() => navigate("/")}
                        className="hidden md:block text-sm font-medium hover:text-blue-600"
                    >
                        Home
                    </button>

                    {/* KYC */}
                    {user && (
                        <button
                            onClick={() => navigate(isKycDone ? "/kyc/view" : "/kyc/register")}
                            className={`text-xs px-3 py-1 rounded-full font-medium
                            ${isKycDone
                                    ? "bg-green-100 text-green-600"
                                    : "bg-orange-100 text-orange-600 animate-pulse"}`}
                        >
                            {isKycDone ? "KYC was Completed ✓" : "KYC is Pending"}
                        </button>
                    )}

                    {/* 💬 CHAT */}
                    <button
                        onClick={handleChat}
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow transition"
                    >
                        💬 <span className="hidden md:inline">Chat Now</span>
                    </button>

                    {/* ❤️ */}
                    <Link to="/wishlist" className="relative hover:scale-110 transition">
                        ❤️
                        {wishlistCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-1.5 py-[2px] rounded-full">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* 🛒 */}
                    <Link to="/cart" className="relative hover:scale-110 transition">
                        🛒
                        {cartCount > 0 && <span className="badge-blue">{cartCount}</span>}
                    </Link>

                    {/* PROFILE */}
                    {user ? (
                        <div className="relative">

                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold"
                            >
                                {user.name?.[0]}
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-lg overflow-hidden">

                                    <button onClick={() => navigate("/profile")} className="menu-item">👤 Profile</button>
                                    <button onClick={() => navigate("/my-orders")} className="menu-item">📦 Orders</button>
                                    <button onClick={() => navigate("/kyc/register")} className="menu-item">🧾 KYC</button>

                                    <button onClick={handleLogout} className="menu-item text-red-500">
                                        🚪 Logout
                                    </button>

                                </div>
                            )}

                        </div>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-lg"
                        >
                            Login
                        </button>
                    )}

                </div>

            </div>
        </header>
    );
}