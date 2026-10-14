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
    CircleCheckBig,
    Phone,
    ChevronDown,
    ChevronUp,
    ArrowUp,
    PackageCheck,
    ClipboardList,
} from "lucide-react";

export default function SellerLogin() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [openFooterSection, setOpenFooterSection] = useState(null);
    const [loginData, setLoginData] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        setLoginData((current) => ({ ...current, [e.target.name]: e.target.value }));
        if (message) setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setSuccess(false);

        try {
            const response = await API.post("/api/Seller/login", {
                email: loginData.email.trim(),
                password: loginData.password,
            });

            if (response.data?.success) {
                localStorage.setItem("seller", JSON.stringify(response.data.seller));
                setSuccess(true);
                setMessage(response.data.message || "Login successful. Redirecting to your dashboard...");
                window.setTimeout(() => navigate("/seller/dashboard"), 800);
            } else {
                setMessage(response.data?.message || "Unable to sign in. Please check your details.");
            }
        } catch (err) {
            setMessage(
                err.response?.data?.message ||
                "Login failed. Please check your email and password, then try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const footerSections = [
        {
            key: "shop",
            title: "Shop",
            links: [
                { label: "Products", to: "/" },
                { label: "Wishlist", to: "/wishlist" },
                { label: "Cart", to: "/cart" },
            ],
        },
        {
            key: "orders",
            title: "Orders",
            links: [{ label: "My Orders", to: "/my-orders" }],
        },
        {
            key: "sellers",
            title: "For Sellers",
            links: [
                { label: "Seller Home", to: "/seller-home" },
                { label: "Become a Seller", to: "/seller-register" },
                { label: "Seller Login", to: "/seller-login" },
            ],
        },
    ];

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <main>
                <section className="relative isolate overflow-hidden bg-slate-950">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900" />
                    <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl sm:h-96 sm:w-96" />
                    <div className="absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl sm:h-[28rem] sm:w-[28rem]" />

                    <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-2xl"
                        >
                            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300">
                                    <Building2 size={21} />
                                </span>
                                <span>
                                    <span className="block text-base sm:text-lg">JEDE MEDTECH</span>
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.19em] text-cyan-300 sm:text-[11px]">
                                        India Private Limited
                                    </span>
                                </span>
                            </Link>

                            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-100 sm:text-sm">
                                <ShieldCheck size={15} /> Seller partner portal
                            </p>
                            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Welcome back.
                                <span className="mt-1 block text-cyan-300">Let’s grow your business.</span>
                            </h1>
                            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                                Sign in to manage your medical products, track orders and keep your seller account up to date.
                            </p>

                            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    { icon: CircleCheckBig, title: "Seller account", detail: "Manage your profile" },
                                    { icon: PackageCheck, title: "Product catalogue", detail: "Maintain listings" },
                                    { icon: ClipboardList, title: "Order updates", detail: "Track fulfilment" },
                                ].map(({ icon: Icon, title, detail }) => (
                                    <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                                            <Icon size={18} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{title}</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 }}
                            className="mx-auto w-full max-w-xl"
                        >
                            <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-2xl shadow-slate-950/25 sm:p-8 lg:p-9">
                                <div className="mb-7">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Seller account</p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Sign in to your account</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Enter your registered email address and password to continue.
                                    </p>
                                </div>

                                {message && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-6 ${success
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                : "border-rose-200 bg-rose-50 text-rose-700"
                                            }`}
                                    >
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="seller-email" className="mb-2 block text-sm font-semibold text-slate-700">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="seller-email"
                                                type="email"
                                                name="email"
                                                autoComplete="username"
                                                value={loginData.email}
                                                onChange={handleChange}
                                                placeholder="you@company.com"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <label htmlFor="seller-password" className="block text-sm font-semibold text-slate-700">
                                                Password
                                            </label>
                                            <Link to="/seller-forgot-password" className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline sm:text-sm">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="seller-password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                autoComplete="current-password"
                                                value={loginData.password}
                                                onChange={handleChange}
                                                placeholder="Enter your password"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/30"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/15 transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                Signing in…
                                            </>
                                        ) : (
                                            <>Sign in securely <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">New to JEDE MEDTECH?</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <Link
                                    to="/seller-register"
                                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
                                >
                                    Register as a seller <ArrowRight size={17} className="ml-2" />
                                </Link>

                                <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                                    <ShieldCheck size={15} className="text-emerald-600" />
                                    Keep your account credentials private.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <footer className="mt-0 bg-[#131a22] text-slate-300">
                <button
                    type="button"
                    onClick={scrollToTop}
                    className="flex w-full items-center justify-center gap-2 bg-[#232f3e] px-4 py-3.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#2d3d50]"
                    aria-label="Back to top"
                >
                    <ArrowUp size={15} /> Back to top
                </button>

                <div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                    <div className="hidden gap-10 lg:grid lg:grid-cols-[1.5fr_1fr_1.2fr_1fr_1.15fr] xl:gap-14">
                        <FooterBrand />
                        <FooterColumn title="Shop" links={footerSections[0].links} />
                        <FooterColumn title="Orders" links={footerSections[1].links} />
                        <FooterColumn title="For Sellers" links={footerSections[2].links} />
                        <FooterContact />
                    </div>

                    <div className="lg:hidden">
                        <FooterBrand />
                        <div className="mt-6 divide-y divide-slate-800 border-y border-slate-800">
                            {footerSections.map((section) => {
                                const isOpen = openFooterSection === section.key;
                                return (
                                    <div key={section.key}>
                                        <button
                                            type="button"
                                            onClick={() => setOpenFooterSection(isOpen ? null : section.key)}
                                            aria-expanded={isOpen}
                                            className="flex w-full items-center justify-between py-4 text-left"
                                        >
                                            <span className="text-sm font-semibold text-white">{section.title}</span>
                                            {isOpen ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
                                        </button>
                                        {isOpen && (
                                            <div className="space-y-3 pb-5">
                                                {section.links.map((link) => (
                                                    <Link key={link.label} to={link.to} className="block text-sm text-slate-400 transition-colors hover:text-white">
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-7">
                            <FooterContact />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 bg-[#0f151c]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
                        <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                            © {new Date().getFullYear()} JEDE MEDTECH INDIA PRIVATE LIMITED. All rights reserved.
                        </p>
                        <p className="text-[11px] text-slate-600 sm:text-xs">
                            Medical Equipment • Consumables • Disposables
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FooterBrand() {
    return (
        <div className="pb-1">
            <Link to="/" className="inline-block text-xl font-bold tracking-tight text-white">
                JEDE MEDTECH
            </Link>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400 sm:text-[11px]">
                India Private Limited
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
                Medical equipment, consumables and disposables for healthcare professionals, institutions and customers across India.
            </p>
        </div>
    );
}

function FooterContact() {
    return (
        <div>
            <h3 className="text-sm font-bold text-white">Contact Us</h3>
            <p className="mt-3 text-xs leading-5 text-slate-400">
                For product, order and customer service enquiries.
            </p>
            <div className="mt-4 space-y-3">
                <FooterPhone number="+91 93848 04209" href="tel:+919384804209" />
                <FooterPhone number="+91 93906 30297" href="tel:+919390630297" />
            </div>
        </div>
    );
}

function FooterPhone({ number, href }) {
    return (
        <a href={href} className="group flex items-center gap-3 text-sm text-slate-300 transition-colors hover:text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-400 transition-colors group-hover:bg-white/10">
                <Phone size={15} />
            </span>
            <span>{number}</span>
        </a>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link
                            to={link.to}
                            className="inline-block text-sm text-slate-400 transition-colors hover:text-white hover:underline hover:underline-offset-4"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
