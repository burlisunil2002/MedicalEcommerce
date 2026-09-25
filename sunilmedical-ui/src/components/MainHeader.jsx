import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Heart,
    ShoppingCart,
    UserRound,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Package,
    FileText,
    Store,
    MessageCircle,
    Home,
} from "lucide-react";

import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";


export default function MainHeader() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const navigate = useNavigate();

    const { cartCount, loadCart } = useCart();
    const { wishlistCount } = useWishlist();

    const isKycDone = user?.isProfileCompleted;

    /* =========================================================
       WHATSAPP
    ========================================================= */

    const whatsappNumber = "919014060858";

    const handleChat = () => {
        const msg = encodeURIComponent(
            "Hi, I need assistance with products."
        );

        window.open(
            `https://wa.me/${whatsappNumber}?text=${msg}`,
            "_blank",
            "noopener,noreferrer"
        );
    };


    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = async () => {
        try {
            await API.post("/api/account/logout");
        } catch {
            // Ignore logout API errors
        }

        setUser(null);
        setMenuOpen(false);
        setMobileMenuOpen(false);

        await loadCart();

        window.dispatchEvent(
            new Event("userLoggedOut")
        );

        navigate("/login");
    };


    /* =========================================================
       LOAD USER
    ========================================================= */

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data } =
                    await API.get("/api/user");

                setUser(data);
            } catch {
                setUser(null);
            }
        };

        loadUser();

        window.addEventListener(
            "userLoggedIn",
            loadUser
        );

        return () => {
            window.removeEventListener(
                "userLoggedIn",
                loadUser
            );
        };
    }, []);


    /* =========================================================
       SEARCH
    ========================================================= */

    useEffect(() => {
        if (search.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const controller =
            new AbortController();

        const timer = setTimeout(
            async () => {
                try {
                    const res =
                        await API.get(
                            `/api/products/search?term=${encodeURIComponent(
                                search.trim()
                            )}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        );

                    setSuggestions(
                        Array.isArray(res.data)
                            ? res.data
                            : []
                    );
                } catch {
                    setSuggestions([]);
                }
            },
            300
        );

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search]);


    /* =========================================================
       SEARCH SUBMIT
    ========================================================= */

    const handleSearch = () => {
        const value = search.trim();

        if (!value) return;

        setSuggestions([]);

        navigate(
            `/search/${encodeURIComponent(value)}`
        );
    };


    /* =========================================================
       NAVIGATION
    ========================================================= */

    const goTo = (path) => {
        setMenuOpen(false);
        setMobileMenuOpen(false);
        navigate(path);
    };


    return (
        <header
            className="
                sticky
                top-0
                z-50
                w-full
                bg-white
                shadow-sm
            "
        >

            {/* =====================================================
                TOP TRUST STRIP
            ====================================================== */}

            <div
                className="
                    flex
                    h-6
                    items-center
                    justify-center
                    bg-gradient-to-r
                    from-pink-500
                    via-purple-500
                    to-indigo-500
                    px-2
                    text-[10px]
                    font-medium
                    text-white
                    sm:h-7
                    sm:text-xs
                "
            >
                🚀 Trusted Products
                <span className="mx-1.5 opacity-70">
                    |
                </span>
                Fast Delivery
            </div>


            {/* =====================================================
                MAIN HEADER
            ====================================================== */}

            <div
                className="
                    mx-auto
                    w-full
                    max-w-[1440px]
                    px-3
                    sm:px-5
                    lg:px-8
                "
            >

                {/* =================================================
                    TOP ROW
                ================================================== */}

                <div
                    className="
                        flex
                        min-h-[58px]
                        items-center
                        gap-2
                        sm:min-h-[66px]
                        sm:gap-4
                    "
                >

                    {/* =============================================
                        LOGO
                    ============================================== */}

                    <Link
                        to="/"
                        className="
                            flex
                            w-[88px]
                            shrink-0
                            items-center
                            justify-start
                            sm:w-[125px]
                            lg:w-[145px]
                        "
                        aria-label="Sunil Medical Products Home"
                    >
                        <img
                            src="/images/TheMakeInIndiaLogo.png"
                            alt="Sunil Medical Products"
                            className="
                                block
                                h-auto
                                w-full
                                max-w-full
                                object-contain
                            "
                        />
                    </Link>


                    {/* =============================================
                        DESKTOP SEARCH
                    ============================================== */}

                    <div
                        className="
                            relative
                            hidden
                            min-w-0
                            flex-1
                            md:block
                        "
                    >
                        <div
                            className="
                                flex
                                h-11
                                w-full
                                items-center
                                rounded-full
                                border
                                border-slate-200
                                bg-slate-50
                                px-4
                                transition
                                focus-within:border-purple-400
                                focus-within:bg-white
                                focus-within:ring-2
                                focus-within:ring-purple-100
                            "
                        >
                            <Search
                                size={19}
                                className="
                                    shrink-0
                                    text-slate-400
                                "
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Search products, brands..."
                                className="
                                    min-w-0
                                    flex-1
                                    bg-transparent
                                    px-3
                                    text-sm
                                    text-slate-800
                                    outline-none
                                    placeholder:text-slate-400
                                "
                            />

                            <button
                                type="button"
                                onClick={handleSearch}
                                className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-slate-500
                                    transition
                                    hover:bg-purple-50
                                    hover:text-purple-600
                                "
                                aria-label="Search"
                            >
                                <Search size={18} />
                            </button>
                        </div>


                        {/* SEARCH SUGGESTIONS */}

                        {suggestions.length > 0 && (
                            <div
                                className="
                                    absolute
                                    left-0
                                    right-0
                                    top-[48px]
                                    z-[100]
                                    max-h-[420px]
                                    overflow-y-auto
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    shadow-xl
                                "
                            >
                                {suggestions.map(
                                    (item) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            onClick={() => {
                                                setSearch("");
                                                setSuggestions(
                                                    []
                                                );

                                                navigate(
                                                    `/product/${item.id}`
                                                );
                                            }}
                                            className="
                                                flex
                                                w-full
                                                items-center
                                                gap-3
                                                border-b
                                                border-slate-100
                                                p-3
                                                text-left
                                                last:border-0
                                                hover:bg-slate-50
                                            "
                                        >
                                            <img
                                                src={
                                                    item.imageUrl ||
                                                    "/images/no-image.png"
                                                }
                                                alt={
                                                    item.name
                                                }
                                                className="
                                                    h-11
                                                    w-11
                                                    shrink-0
                                                    rounded-lg
                                                    border
                                                    border-slate-100
                                                    object-contain
                                                "
                                            />

                                            <div className="min-w-0">
                                                <p
                                                    className="
                                                        truncate
                                                        text-sm
                                                        font-semibold
                                                        text-slate-900
                                                    "
                                                >
                                                    {
                                                        item.name
                                                    }
                                                </p>

                                                {item.brand && (
                                                    <p
                                                        className="
                                                            mt-0.5
                                                            truncate
                                                            text-xs
                                                            text-slate-500
                                                        "
                                                    >
                                                        {
                                                            item.brand
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>


                    {/* =============================================
                        DESKTOP NAV
                    ============================================== */}

                    <nav
                        className="
                            hidden
                            shrink-0
                            items-center
                            gap-4
                            lg:flex
                        "
                    >

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/")
                            }
                            className="
                                flex
                                items-center
                                gap-1
                                text-sm
                                font-semibold
                                text-slate-700
                                transition
                                hover:text-purple-600
                            "
                        >
                            <Home size={16} />
                            Home
                        </button>


                        {/* WISHLIST */}

                        <Link
                            to="/wishlist"
                            className="
                                relative
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-full
                                text-slate-600
                                transition
                                hover:bg-pink-50
                                hover:text-pink-500
                            "
                            aria-label="Wishlist"
                        >
                            <Heart
                                size={21}
                                strokeWidth={2}
                            />

                            {wishlistCount > 0 && (
                                <span
                                    className="
                                        absolute
                                        -right-0.5
                                        -top-0.5
                                        flex
                                        min-w-[18px]
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-pink-500
                                        px-1
                                        py-0.5
                                        text-[10px]
                                        font-bold
                                        text-white
                                    "
                                >
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>


                        {/* CART */}

                        <Link
                            to="/cart"
                            className="
                                relative
                                flex
                                items-center
                                gap-1.5
                                text-slate-700
                                transition
                                hover:text-purple-600
                            "
                            aria-label="Cart"
                        >
                            <ShoppingCart
                                size={22}
                            />

                            <span className="text-sm font-semibold">
                                {cartCount}
                            </span>
                        </Link>


                        {/* PROFILE / LOGIN */}

                        {user ? (
                            <div className="relative">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMenuOpen(
                                            (prev) =>
                                                !prev
                                        )
                                    }
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        rounded-full
                                        border
                                        border-slate-200
                                        bg-white
                                        py-1
                                        pl-1
                                        pr-3
                                        transition
                                        hover:border-purple-300
                                        hover:bg-purple-50
                                    "
                                >
                                    <span
                                        className="
                                            flex
                                            h-8
                                            w-8
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-gradient-to-r
                                            from-pink-500
                                            to-purple-600
                                            text-sm
                                            font-bold
                                            text-white
                                        "
                                    >
                                        {user.name
                                            ?.charAt(
                                                0
                                            )
                                            ?.toUpperCase() ||
                                            "U"}
                                    </span>

                                    <span
                                        className="
                                            hidden
                                            max-w-[90px]
                                            truncate
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                            xl:block
                                        "
                                    >
                                        {user.name}
                                    </span>

                                    <ChevronDown
                                        size={15}
                                        className="
                                            text-slate-400
                                        "
                                    />
                                </button>


                                {menuOpen && (
                                    <div
                                        className="
                                            absolute
                                            right-0
                                            top-[46px]
                                            z-[100]
                                            w-60
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            shadow-xl
                                        "
                                    >

                                        <button
                                            type="button"
                                            onClick={() =>
                                                goTo(
                                                    "/profile"
                                                )
                                            }
                                            className="menu-item"
                                        >
                                            <UserRound
                                                size={17}
                                            />
                                            Profile
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                goTo(
                                                    "/my-orders"
                                                )
                                            }
                                            className="menu-item"
                                        >
                                            <Package
                                                size={17}
                                            />
                                            My Orders
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                goTo(
                                                    "/kyc/register"
                                                )
                                            }
                                            className="menu-item"
                                        >
                                            <FileText
                                                size={17}
                                            />
                                            KYC
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                goTo(
                                                    "/seller-home"
                                                )
                                            }
                                            className="menu-item"
                                        >
                                            <Store
                                                size={17}
                                            />
                                            Become a Seller
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleChat
                                            }
                                            className="
                                                flex
                                                w-full
                                                items-center
                                                gap-3
                                                px-4
                                                py-3
                                                text-left
                                                text-sm
                                                font-medium
                                                text-emerald-600
                                                hover:bg-emerald-50
                                            "
                                        >
                                            <MessageCircle
                                                size={17}
                                            />
                                            Chat on WhatsApp
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleLogout
                                            }
                                            className="
                                                flex
                                                w-full
                                                items-center
                                                gap-3
                                                border-t
                                                border-slate-100
                                                px-4
                                                py-3
                                                text-left
                                                text-sm
                                                font-medium
                                                text-red-500
                                                hover:bg-red-50
                                            "
                                        >
                                            <LogOut
                                                size={17}
                                            />
                                            Logout
                                        </button>

                                    </div>
                                )}

                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/login")
                                }
                                className="
                                    rounded-lg
                                    bg-gradient-to-r
                                    from-pink-500
                                    to-purple-600
                                    px-5
                                    py-2
                                    text-sm
                                    font-semibold
                                    text-white
                                    shadow-sm
                                    transition
                                    hover:shadow-md
                                "
                            >
                                Login
                            </button>
                        )}

                    </nav>


                    {/* =============================================
                        MOBILE ACTIONS
                    ============================================== */}

                    <div
                        className="
                            ml-auto
                            flex
                            shrink-0
                            items-center
                            gap-1
                            md:hidden
                        "
                    >

                        {/* Wishlist */}

                        <Link
                            to="/wishlist"
                            className="
                                relative
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                text-pink-500
                            "
                        >
                            <Heart
                                size={21}
                                fill="currentColor"
                            />

                            {wishlistCount > 0 && (
                                <span
                                    className="
                                        absolute
                                        right-0
                                        top-0
                                        flex
                                        min-w-[16px]
                                        justify-center
                                        rounded-full
                                        bg-pink-500
                                        px-1
                                        text-[9px]
                                        font-bold
                                        text-white
                                    "
                                >
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>


                        {/* Cart */}

                        <Link
                            to="/cart"
                            className="
                                relative
                                flex
                                h-9
                                min-w-[42px]
                                items-center
                                justify-center
                                gap-0.5
                                rounded-full
                                text-slate-700
                            "
                        >
                            <ShoppingCart
                                size={21}
                            />

                            <span
                                className="
                                    text-xs
                                    font-bold
                                "
                            >
                                {cartCount}
                            </span>
                        </Link>


                        {/* Login / Profile */}

                        {user ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setMenuOpen(
                                        (prev) =>
                                            !prev
                                    )
                                }
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gradient-to-r
                                    from-pink-500
                                    to-purple-600
                                    text-sm
                                    font-bold
                                    text-white
                                "
                            >
                                {user.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "U"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/login")
                                }
                                className="
                                    rounded-lg
                                    bg-gradient-to-r
                                    from-pink-500
                                    to-purple-600
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-semibold
                                    text-white
                                "
                            >
                                Login
                            </button>
                        )}

                        {/* Menu */}

                        <button
                            type="button"
                            onClick={() =>
                                setMobileMenuOpen(
                                    (prev) =>
                                        !prev
                                )
                            }
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                text-slate-700
                            "
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? (
                                <X size={22} />
                            ) : (
                                <Menu size={22} />
                            )}
                        </button>

                    </div>

                </div>


                {/* =================================================
                    MOBILE SEARCH
                ================================================== */}

                <div
                    className="
                        relative
                        pb-3
                        md:hidden
                    "
                >
                    <div
                        className="
                            flex
                            h-11
                            items-center
                            rounded-full
                            border
                            border-slate-200
                            bg-slate-50
                            px-3
                            focus-within:border-purple-400
                            focus-within:bg-white
                            focus-within:ring-2
                            focus-within:ring-purple-100
                        "
                    >
                        <Search
                            size={18}
                            className="
                                shrink-0
                                text-slate-400
                            "
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    handleSearch();
                                }
                            }}
                            placeholder="Search products, brands..."
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                px-2.5
                                text-sm
                                outline-none
                                placeholder:text-slate-400
                            "
                        />

                        <button
                            type="button"
                            onClick={
                                handleSearch
                            }
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-purple-600
                            "
                        >
                            <Search size={18} />
                        </button>
                    </div>


                    {/* MOBILE SEARCH SUGGESTIONS */}

                    {suggestions.length > 0 && (
                        <div
                            className="
                                absolute
                                left-0
                                right-0
                                top-[47px]
                                z-[100]
                                max-h-[360px]
                                overflow-y-auto
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                shadow-xl
                            "
                        >
                            {suggestions.map(
                                (item) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => {
                                            setSearch("");
                                            setSuggestions(
                                                []
                                            );

                                            navigate(
                                                `/product/${item.id}`
                                            );
                                        }}
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-3
                                            border-b
                                            border-slate-100
                                            p-3
                                            text-left
                                            last:border-0
                                            hover:bg-slate-50
                                        "
                                    >
                                        <img
                                            src={
                                                item.imageUrl ||
                                                "/images/no-image.png"
                                            }
                                            alt={
                                                item.name
                                            }
                                            className="
                                                h-10
                                                w-10
                                                shrink-0
                                                rounded-lg
                                                object-contain
                                            "
                                        />

                                        <div className="min-w-0">
                                            <p
                                                className="
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                "
                                            >
                                                {
                                                    item.name
                                                }
                                            </p>

                                            {item.brand && (
                                                <p
                                                    className="
                                                        truncate
                                                        text-xs
                                                        text-slate-500
                                                    "
                                                >
                                                    {
                                                        item.brand
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>


                {/* =================================================
                    MOBILE MENU
                ================================================== */}

                {mobileMenuOpen && (
                    <div
                        className="
                            border-t
                            border-slate-100
                            py-2
                            md:hidden
                        "
                    >

                        <button
                            type="button"
                            onClick={() =>
                                goTo("/")
                            }
                            className="mobile-menu-item"
                        >
                            <Home size={18} />
                            Home
                        </button>

                        {user && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        goTo(
                                            "/profile"
                                        )
                                    }
                                    className="mobile-menu-item"
                                >
                                    <UserRound
                                        size={18}
                                    />
                                    My Profile
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goTo(
                                            "/my-orders"
                                        )
                                    }
                                    className="mobile-menu-item"
                                >
                                    <Package
                                        size={18}
                                    />
                                    My Orders
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goTo(
                                            "/kyc/register"
                                        )
                                    }
                                    className="mobile-menu-item"
                                >
                                    <FileText
                                        size={18}
                                    />
                                    KYC
                                    <span
                                        className={`
                                            ml-auto
                                            rounded-full
                                            px-2
                                            py-0.5
                                            text-[10px]
                                            font-semibold
                                            ${isKycDone
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-orange-50 text-orange-600"
                                            }
                                        `}
                                    >
                                        {isKycDone
                                            ? "Completed"
                                            : "Pending"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goTo(
                                            "/seller-home"
                                        )
                                    }
                                    className="mobile-menu-item"
                                >
                                    <Store
                                        size={18}
                                    />
                                    Become a Seller
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleChat
                                    }
                                    className="
                                        mobile-menu-item
                                        text-emerald-600
                                    "
                                >
                                    <MessageCircle
                                        size={18}
                                    />
                                    Chat on WhatsApp
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleLogout
                                    }
                                    className="
                                        mobile-menu-item
                                        text-red-500
                                    "
                                >
                                    <LogOut
                                        size={18}
                                    />
                                    Logout
                                </button>
                            </>
                        )}

                    </div>
                )}

            </div>


            {/* =====================================================
                HEADER STYLES
            ====================================================== */}

            <style>{`
                .menu-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 500;
                    color: #334155;
                    transition: background-color 0.15s ease;
                }

                .menu-item:hover {
                    background: #f8fafc;
                }

                .mobile-menu-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 8px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 600;
                    color: #334155;
                    border-radius: 10px;
                    transition: background-color 0.15s ease;
                }

                .mobile-menu-item:hover {
                    background: #f8fafc;
                }
            `}</style>

        </header>
    );
}