import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronDown,
    ChevronUp,
    Phone,
    ArrowUp
} from "lucide-react";

export default function MainFooter() {
    const [openSection, setOpenSection] = useState(null);

    const currentYear = new Date().getFullYear();

    const sections = {
        shop: {
            title: "Shop",
            links: [
                { label: "Products", to: "/" },
                { label: "Wishlist", to: "/wishlist" },
                { label: "Cart", to: "/cart" },
                { label: "Checkout", to: "/checkout" }
            ]
        },

        account: {
            title: "Orders & Account",
            links: [
                { label: "My Orders", to: "/my-orders" },
                { label: "Profile", to: "/profile" },
                { label: "KYC Registration", to: "/kyc/register" }
            ]
        },

        seller: {
            title: "For Sellers",
            links: [
                { label: "Seller Home", to: "/seller-home" },
                { label: "Become a Seller", to: "/seller-register" },
                { label: "Seller Login", to: "/seller-login" }
            ]
        }
    };

    const toggleSection = (section) => {
        setOpenSection((current) =>
            current === section ? null : section
        );
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <footer className="mt-14 bg-[#131a22] text-slate-300">

            {/* Back to Top */}
            <button
                type="button"
                onClick={scrollToTop}
                className="
                    flex w-full items-center justify-center gap-2
                    bg-[#232f3e] px-4 py-3.5
                    text-xs font-semibold text-slate-200
                    transition-colors hover:bg-[#2d3d50]
                "
                aria-label="Back to top"
            >
                <ArrowUp size={15} />
                Back to top
            </button>

            {/* Main Footer */}
            <div className="
                mx-auto max-w-7xl px-5 py-10
                sm:px-6 lg:px-8 lg:py-12
            ">

                {/* Desktop */}
                <div className="
                    hidden lg:grid
                    lg:grid-cols-[1.5fr_1fr_1.2fr_1fr_1.15fr]
                    lg:gap-10 xl:gap-14
                ">

                    {/* Company */}
                    <div>
                        <Link
                            to="/"
                            className="
                                inline-block text-xl font-bold
                                tracking-tight text-white
                            "
                        >
                            JEDE MEDTECH
                        </Link>

                        <p className="
                            mt-1 text-[11px] font-semibold
                            uppercase tracking-[0.18em]
                            text-cyan-400
                        ">
                            India Private Limited
                        </p>

                        <p className="
                            mt-5 max-w-xs text-sm leading-6
                            text-slate-400
                        ">
                            Medical equipment, consumables and
                            disposables for healthcare professionals,
                            institutions and customers across India.
                        </p>
                    </div>

                    <FooterColumn
                        title={sections.shop.title}
                        links={sections.shop.links}
                    />

                    <FooterColumn
                        title={sections.account.title}
                        links={sections.account.links}
                    />

                    <FooterColumn
                        title={sections.seller.title}
                        links={sections.seller.links}
                    />

                    {/* Contact */}
                    <div>
                        <h3 className="
                            text-sm font-bold text-white
                        ">
                            Contact Us
                        </h3>

                        <p className="
                            mt-4 text-xs leading-5 text-slate-400
                        ">
                            For product, order and customer service
                            enquiries.
                        </p>

                        <div className="mt-5 space-y-3">

                            <PhoneLink
                                number="+91 93848 04209"
                                href="tel:+919384804209"
                            />

                            <PhoneLink
                                number="+91 90140 60858"
                                href="tel:+919014060858"
                            />

                        </div>
                    </div>
                </div>

                {/* Mobile */}
                <div className="lg:hidden">

                    {/* Brand */}
                    <div className="pb-7">
                        <Link
                            to="/"
                            className="
                                text-lg font-bold tracking-tight
                                text-white
                            "
                        >
                            JEDE MEDTECH
                        </Link>

                        <p className="
                            mt-1 text-[10px] font-semibold
                            uppercase tracking-[0.17em]
                            text-cyan-400
                        ">
                            India Private Limited
                        </p>

                        <p className="
                            mt-4 max-w-md text-sm leading-6
                            text-slate-400
                        ">
                            Medical equipment, consumables and
                            disposables for healthcare needs.
                        </p>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="
                        divide-y divide-slate-800
                        border-y border-slate-800
                    ">
                        {Object.entries(sections).map(
                            ([key, section]) => {
                                const isOpen = openSection === key;

                                return (
                                    <div key={key}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSection(key)
                                            }
                                            aria-expanded={isOpen}
                                            className="
                                                flex w-full
                                                items-center justify-between
                                                py-4 text-left
                                            "
                                        >
                                            <span className="
                                                text-sm font-semibold
                                                text-white
                                            ">
                                                {section.title}
                                            </span>

                                            {isOpen ? (
                                                <ChevronUp
                                                    size={17}
                                                    className="text-slate-400"
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={17}
                                                    className="text-slate-400"
                                                />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className="space-y-3 pb-5">
                                                {section.links.map((link) => (
                                                    <Link
                                                        key={link.label}
                                                        to={link.to}
                                                        className="
                                                            block text-sm
                                                            text-slate-400
                                                            transition-colors
                                                            hover:text-white
                                                        "
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>

                    {/* Mobile Contact */}
                    <div className="pt-7">
                        <h3 className="
                            text-sm font-semibold text-white
                        ">
                            Contact Us
                        </h3>

                        <p className="
                            mt-2 text-xs leading-5 text-slate-500
                        ">
                            For product, order and customer service
                            enquiries.
                        </p>

                        <div className="
                            mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2
                        ">
                            <PhoneCard
                                number="+91 93848 04209"
                                href="tel:+919384804209"
                            />

                            <PhoneCard
                                number="+91 90140 60858"
                                href="tel:+919014060858"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="
                border-t border-slate-800 bg-[#0f151c]
            ">
                <div className="
                    mx-auto flex max-w-7xl flex-col
                    items-center justify-between gap-2
                    px-5 py-5 text-center
                    sm:px-6 md:flex-row md:text-left lg:px-8
                ">
                    <p className="
                        text-[11px] leading-5 text-slate-500 sm:text-xs
                    ">
                        © {currentYear} JEDE MEDTECH INDIA PRIVATE LIMITED.
                        All rights reserved.
                    </p>

                    <p className="
                        text-[11px] text-slate-600 sm:text-xs
                    ">
                        Medical Equipment • Consumables • Disposables
                    </p>
                </div>
            </div>

        </footer>
    );
}

function PhoneLink({ number, href }) {
    return (
        <a
            href={href}
            className="
                group flex items-center gap-3
                text-sm text-slate-300
                transition-colors hover:text-white
            "
        >
            <span className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg bg-white/5 text-cyan-400
                transition-colors group-hover:bg-white/10
            ">
                <Phone size={15} />
            </span>

            <span>{number}</span>
        </a>
    );
}

function PhoneCard({ number, href }) {
    return (
        <a
            href={href}
            className="
                flex items-center gap-3 rounded-xl
                border border-slate-800 bg-white/[0.03]
                px-4 py-3.5 transition-colors
                hover:bg-white/[0.06]
            "
        >
            <Phone
                size={17}
                className="shrink-0 text-cyan-400"
            />

            <div>
                <p className="
                    text-[10px] uppercase tracking-wide
                    text-slate-500
                ">
                    Call
                </p>

                <p className="
                    mt-0.5 text-sm font-semibold text-white
                ">
                    {number}
                </p>
            </div>
        </a>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <h3 className="
                text-sm font-bold text-white
            ">
                {title}
            </h3>

            <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link
                            to={link.to}
                            className="
                                inline-block text-sm text-slate-400
                                transition-colors
                                hover:text-white
                                hover:underline
                                hover:underline-offset-4
                            "
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
