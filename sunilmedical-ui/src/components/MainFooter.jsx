import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowUp, ChevronDown, MapPin, Mail, Phone,
    HeartPulse, ShoppingBag, UserRound, Store, FileText, MessageCircle
} from "lucide-react";

const sections = [
    {
        id: "shop", title: "Shop", icon: ShoppingBag, links: [
            { label: "All Products", to: "/" }, { label: "Wishlist", to: "/wishlist" },
            { label: "Shopping Cart", to: "/cart" }, { label: "FAQ", to: "/faq" }
        ]
    },
    {
        id: "account", title: "Orders & Account", icon: UserRound, links: [
            { label: "My Profile", to: "/profile" }, { label: "My Orders", to: "/my-orders" }
        ]
    },
    {
        id: "seller", title: "For Sellers", icon: Store, links: [
            { label: "Seller Home", to: "/seller-home" }, { label: "Become a Seller", to: "/seller-register" },
            { label: "Seller Login", to: "/seller-login" }
        ]
    },
    {
        id: "company", title: "Company", icon: HeartPulse, links: [
            { label: "About Us", to: "/about-us" }, { label: "Contact Us", to: "/contact-us" }
        ]
    },
    {
        id: "legal", title: "Policies & Legal", icon: FileText, links: [
            { label: "Terms & Conditions", to: "/terms-and-conditions" },
            { label: "Privacy Policy", to: "/privacy-policy" },
            { label: "Refund & Cancellation", to: "/refund-cancellation" }
        ]
    }
];

const email = "aasraj2026@gmail.com";
const phones = [
    { number: "+91 63014 27306", href: "tel:+916301427306" },
    { number: "+91 93906 30297", href: "tel:+919390630297" }
];
const address = "AMTZ Campus, Pragati Maidan, VM Steel Project S.O, Siddeswaram / Nadupuru, Visakhapatnam, Andhra Pradesh – 530031, India";

export default function MainFooter() {
    const [openSection, setOpenSection] = useState(null);
    const year = new Date().getFullYear();

    const toggleSection = (id) =>
        setOpenSection(current => current === id ? null : id);

    return (
        <footer className="mt-12 w-full bg-[#111923] text-slate-300">
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="group flex w-full items-center justify-center gap-2 bg-[#202d3b] px-4 py-3 text-xs font-semibold tracking-wide text-slate-200 transition hover:bg-[#2b3b4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Back to top"
            >
                <ArrowUp size={15} className="transition-transform group-hover:-translate-y-0.5" />
                Back to top
            </button>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
                <div className="grid gap-9 lg:grid-cols-[1.3fr_3fr] lg:gap-12">
                    {/* Company identity and contact */}
                    <div className="max-w-md">
                        <Link to="/" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-white hover:text-cyan-300">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                                <HeartPulse size={23} />
                            </span>
                            JEDE MEDTECH
                        </Link>
                        <p className="mt-2 pl-12 text-[10px] font-bold uppercase tracking-[0.19em] text-cyan-400 sm:text-[11px]">
                            India Private Limited
                        </p>
                        <p className="mt-5 text-sm leading-7 text-slate-400">
                            Medical equipment, healthcare products, consumables and disposables for healthcare professionals, institutions and customers across India.
                        </p>

                        <div className="mt-6 space-y-4">
                            <a href={`mailto:${email}`} className="group flex items-start gap-3 text-sm text-slate-300 transition hover:text-cyan-300">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-300"><Mail size={16} /></span>
                                <span className="break-all pt-1">{email}</span>
                            </a>
                            {phones.map(phone => (
                                <a key={phone.href} href={phone.href} className="group flex items-center gap-3 text-sm text-slate-300 transition hover:text-cyan-300">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-300"><Phone size={16} /></span>
                                    {phone.number}
                                </a>
                            ))}
                            <div className="flex items-start gap-3 text-xs leading-6 text-slate-400">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-300"><MapPin size={16} /></span>
                                <span>{address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop: five columns */}
                    <div className="hidden grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 md:grid-cols-5 lg:grid">
                        {sections.map(section => <FooterColumn key={section.id} section={section} />)}
                    </div>
                </div>

                {/* Tablet and mobile: interactive accordion */}
                <div className="mt-9 border-y border-slate-700/70 lg:hidden">
                    {sections.map(section => {
                        const Icon = section.icon;
                        const isOpen = openSection === section.id;
                        return (
                            <div key={section.id} className="border-b border-slate-700/70 last:border-0">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={`footer-${section.id}`}
                                    className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                                >
                                    <span className="flex items-center gap-3 text-sm font-semibold text-white">
                                        <Icon size={17} className="text-cyan-400" />{section.title}
                                    </span>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-300" : ""}`} />
                                </button>
                                <div id={`footer-${section.id}`} hidden={!isOpen} className="pb-4 pl-8">
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {section.links.map(link => (
                                            <li key={link.to + link.label}>
                                                <Link to={link.to} onClick={() => setOpenSection(null)} className="inline-block text-sm text-slate-400 transition hover:translate-x-1 hover:text-cyan-300">
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile/tablet quick contact */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:hidden">
                    <a href={`mailto:${email}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-700 bg-white/[0.03] p-3 hover:bg-white/[0.07]">
                        <Mail size={18} className="shrink-0 text-cyan-300" />
                        <span className="min-w-0">
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">Email support</span>
                            <span className="block break-all text-sm font-semibold text-white">{email}</span>
                        </span>
                    </a>
                    <a href="https://wa.me/919390630297" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-700 bg-white/[0.03] p-3 hover:bg-white/[0.07]">
                        <MessageCircle size={18} className="text-emerald-400" />
                        <span>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">Quick assistance</span>
                            <span className="block text-sm font-semibold text-white">Chat on WhatsApp</span>
                        </span>
                    </a>
                </div>
            </div>

            <div className="border-t border-slate-800 bg-[#0c121a]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
                    <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                        © {year} JEDE MEDTECH INDIA PRIVATE LIMITED. All rights reserved.
                    </p>
                    <p className="text-[10px] leading-5 text-slate-600 sm:text-xs">
                        Medical Equipment <span className="px-1">•</span> Consumables <span className="px-1">•</span> Disposables
                    </p>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ section }) {
    return (
        <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">{section.title}</h3>
            <ul className="mt-5 space-y-3">
                {section.links.map(link => (
                    <li key={link.to + link.label}>
                        <Link to={link.to} className="inline-block text-sm leading-5 text-slate-400 transition hover:translate-x-1 hover:text-cyan-300">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
