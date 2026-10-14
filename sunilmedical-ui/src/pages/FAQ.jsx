import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronDown,
    ChevronUp,
    ShoppingBag,
    UserRound,
    PackageCheck,
    Truck,
    CreditCard,
    RotateCcw,
    ShieldCheck,
    Store,
    FileText,
    Headphones,
    ArrowRight,
    Phone,
    Mail,
    ArrowUp,
    HelpCircle,
    Stethoscope,
} from "lucide-react";

const FAQ_GROUPS = [
    {
        id: "orders",
        title: "Orders & shopping",
        icon: ShoppingBag,
        description: "Finding products, placing orders and tracking purchases.",
        questions: [
            {
                q: "How do I find medical products on JEDE MEDTECH?",
                a: "Use the search bar or browse product categories to find medical equipment, consumables and disposables. Review the product description, specifications, seller information, price and availability before ordering.",
            },
            {
                q: "Do I need an account to browse products?",
                a: "You can browse the marketplace without signing in. You may need to sign in or register before using account-specific features such as checkout, order history or other protected services.",
            },
            {
                q: "How do I place an order?",
                a: "Choose a product, review its specifications and quantity, add it to your cart, and follow the checkout steps shown on the website. Confirm your delivery details and the final order total before submitting your order.",
            },
            {
                q: "Where can I view my orders?",
                a: "Sign in to your customer account and open My Orders to view available order information. If an order is missing or its details look incorrect, contact customer support with your order reference.",
            },
            {
                q: "Can I change or cancel an order after placing it?",
                a: "Order changes and cancellations depend on the order status and the seller's fulfilment process. Contact support as soon as possible with your order reference. A cancellation or change is not confirmed until you receive confirmation.",
            },
        ],
    },
    {
        id: "payments",
        title: "Payments & pricing",
        icon: CreditCard,
        description: "Payment methods, charges and payment confirmation.",
        questions: [
            {
                q: "Which payment methods are available?",
                a: "The payment options available to you are displayed during checkout. Please use only the payment methods shown on the official JEDE MEDTECH website.",
            },
            {
                q: "What should I do if payment succeeds but my order is not confirmed?",
                a: "Keep your payment reference or transaction ID and check your order history first. If the order is still not confirmed, contact support with the transaction details. Do not share your password, OTP or full card credentials.",
            },
            {
                q: "Why can a product's final price differ from the displayed price?",
                a: "The final amount may depend on the selected quantity, product variants, applicable taxes, shipping charges or other charges shown at checkout. Review the order summary before payment.",
            },
            {
                q: "Will I receive a payment confirmation?",
                a: "Check the confirmation displayed on the website and any order or payment notifications sent to your registered contact details. If you do not receive confirmation, contact support with your transaction reference.",
            },
        ],
    },
    {
        id: "shipping",
        title: "Shipping & delivery",
        icon: Truck,
        description: "Delivery availability, dispatch and shipment updates.",
        questions: [
            {
                q: "How can I check delivery availability for my location?",
                a: "Enter your delivery pincode wherever the website provides a delivery check. Availability and estimated delivery information may vary by product, seller and destination.",
            },
            {
                q: "How do I track a shipment?",
                a: "Open My Orders and check the available order or shipment status. If tracking information is not available or has not updated, contact support or the seller using your order reference.",
            },
            {
                q: "When will my order arrive?",
                a: "Delivery timing depends on product availability, seller dispatch, destination and the shipping service. Use the estimate shown during checkout or in your order details when available.",
            },
            {
                q: "What if my package arrives damaged or an item is missing?",
                a: "Keep the packaging and take clear photos of the package and item. Contact support promptly with your order reference, a description of the issue and the available photos so the case can be reviewed.",
            },
        ],
    },
    {
        id: "returns",
        title: "Returns, refunds & replacements",
        icon: RotateCcw,
        description: "How to raise a return or report a product issue.",
        questions: [
            {
                q: "Can I return or replace a product?",
                a: "Return and replacement eligibility depends on the product, its condition, the seller's terms and the applicable policy. Review the return information on the product or order page before requesting a return.",
            },
            {
                q: "How do I request a return or report a defective product?",
                a: "Contact support with your order reference, the product name and a clear explanation of the issue. Include photographs or other evidence where relevant. Wait for return instructions before shipping an item back.",
            },
            {
                q: "How long does a refund take?",
                a: "Refund timing can vary based on approval, the original payment method and the payment provider. Support can help you check the status of an approved refund.",
            },
            {
                q: "Are opened or sterile medical products returnable?",
                a: "Some products may have special restrictions for safety, hygiene, sterility or regulatory reasons. Check the product's return terms and contact support before opening or shipping a product back.",
            },
        ],
    },
    {
        id: "sellers",
        title: "Seller registration & portal",
        icon: Store,
        description: "Joining the marketplace and managing your seller account.",
        questions: [
            {
                q: "How do I register as a seller?",
                a: "Open Become a Seller, complete the registration form and provide the requested business, contact, GST, PAN, bank and document details. Submit the form for review. Registration and account access are subject to the marketplace's review process.",
            },
            {
                q: "What documents may be required for seller registration?",
                a: "The registration form may request GST details, PAN details, bank information, a GST certificate and relevant product or licence documents. Submit accurate information and only documents requested for your business and product category.",
            },
            {
                q: "How do I log in to the seller portal?",
                a: "Use the Seller Login page with the email address and password associated with your seller account. If you cannot sign in, use the available password recovery option or contact support.",
            },
            {
                q: "Why is my seller account pending approval?",
                a: "A new seller profile may remain pending while the submitted details and documents are reviewed. Check your registered contact details for updates. Contact support if you need help with the status of your application.",
            },
            {
                q: "How do I manage products and orders?",
                a: "After your seller account has the required access, sign in to the seller dashboard. Use the available dashboard sections to manage product listings and review orders. Features shown depend on your account permissions and the current platform setup.",
            },
            {
                q: "Where can I check seller subscription details?",
                a: "Check the subscription information displayed in your seller portal or the current seller registration information. If your plan, fees or renewal details are unclear, contact the JEDE MEDTECH team before making a payment.",
            },
        ],
    },
    {
        id: "account",
        title: "Account, privacy & support",
        icon: ShieldCheck,
        description: "Login help, account information and contacting the team.",
        questions: [
            {
                q: "I forgot my password. What should I do?",
                a: "Use the Forgot Password link on the relevant login page if available, then follow the instructions. If you cannot access your registered email or the reset process fails, contact support for assistance.",
            },
            {
                q: "How should I protect my account?",
                a: "Use a strong, unique password, sign out on shared devices and never share your password or one-time verification codes. Contact support if you notice activity you do not recognize.",
            },
            {
                q: "How do I contact JEDE MEDTECH?",
                a: "Use the contact details published in the website footer or the support information provided with your order. Include the order reference or seller application details needed to understand your request, but never send passwords or payment credentials.",
            },
            {
                q: "Does JEDE MEDTECH provide medical advice?",
                a: "The marketplace helps customers discover and purchase products. Product selection and use should follow the manufacturer's instructions and the guidance of a qualified healthcare professional. Contact the seller for product specifications when needed.",
            },
        ],
    },
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [openItems, setOpenItems] = useState(["orders-0"]);

    const filteredGroups = useMemo(
        () => FAQ_GROUPS.filter((group) => activeCategory === "all" || group.id === activeCategory),
        [activeCategory]
    );

    const toggleItem = (key) => {
        setOpenItems((current) =>
            current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
        );
    };

    const totalVisible = filteredGroups.reduce((sum, group) => sum + group.questions.length, 0);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <section className="relative isolate overflow-hidden bg-slate-950">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900" />
                <div className="absolute -left-20 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20">
                    <Link to="/" className="inline-flex items-center gap-3 text-white">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300">
                            <Stethoscope size={22} />
                        </span>
                        <span>
                            <span className="block text-base font-extrabold tracking-tight sm:text-lg">JEDE MEDTECH</span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">India Private Limited</span>
                        </span>
                    </Link>

                    <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-14">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-100 sm:text-sm">
                            <HelpCircle size={15} /> Help centre
                        </span>
                        <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                            How can we help you?
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                            Find answers about shopping for medical products, orders, delivery, payments, returns and seller accounts.
                        </p>

                        <div className="mx-auto mt-7 max-w-2xl">
                            <p className="text-sm font-medium text-slate-300 sm:text-base">
                                Browse the topics below to find answers about shopping, delivery, payments and seller services.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
                    <aside>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6">
                            <p className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Browse topics</p>
                            <button
                                type="button"
                                onClick={() => setActiveCategory("all")}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeCategory === "all" ? "bg-cyan-50 text-cyan-800" : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <span>All questions</span>
                                <span className="text-xs">{FAQ_GROUPS.reduce((n, g) => n + g.questions.length, 0)}</span>
                            </button>
                            {FAQ_GROUPS.map((group) => {
                                const Icon = group.icon;
                                const active = activeCategory === group.id;
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveCategory(group.id)}
                                        className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active ? "bg-cyan-50 font-semibold text-cyan-800" : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Icon size={17} className={active ? "text-cyan-700" : "text-slate-400"} />
                                        <span className="min-w-0 flex-1">{group.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {activeCategory === "all" ? "Frequently asked questions" : FAQ_GROUPS.find((g) => g.id === activeCategory)?.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {totalVisible} {totalVisible === 1 ? "answer" : "answers"} to help you get started
                                </p>
                            </div>
                        </div>

                        <div className="space-y-7">
                            {filteredGroups.map((group) => {
                                const Icon = group.icon;
                                return (
                                    <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6 sm:py-5">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                                                <Icon size={19} />
                                            </span>
                                            <div>
                                                <h3 className="font-bold text-slate-900 sm:text-lg">{group.title}</h3>
                                                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{group.description}</p>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100 px-4 sm:px-6">
                                            {group.questions.map((item) => {
                                                const originalIndex = FAQ_GROUPS.find((g) => g.id === group.id).questions.findIndex((q) => q.q === item.q);
                                                const key = `${group.id}-${originalIndex}`;
                                                const isOpen = openItems.includes(key);
                                                return (
                                                    <div key={key}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleItem(key)}
                                                            aria-expanded={isOpen}
                                                            className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5"
                                                        >
                                                            <span className="text-sm font-semibold leading-6 text-slate-800 sm:text-base">{item.q}</span>
                                                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${isOpen ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </span>
                                                        </button>
                                                        {isOpen && (
                                                            <div className="max-w-3xl pb-5 pr-2 text-sm leading-7 text-slate-600 sm:pr-12">
                                                                {item.a}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <section className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-800 to-blue-900 px-5 py-8 text-white sm:mt-14 sm:px-8 sm:py-10 lg:px-10">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">
                                <Headphones size={15} /> Still need help?
                            </span>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">We’re here to help.</h2>
                            <p className="mt-2 text-sm leading-6 text-blue-100 sm:text-base">
                                Contact our team with your order reference or seller registration details so we can guide you.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-3 sm:min-w-48">
                            <a href="tel:+919390630297" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 transition hover:bg-cyan-50">
                                <Phone size={17} /> Call support
                            </a>
                            <Link to="/seller-register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                Seller registration <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-4 bg-[#131a22] text-slate-300">
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex w-full items-center justify-center gap-2 bg-[#232f3e] px-4 py-3.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#2d3d50]">
                    <ArrowUp size={15} /> Back to top
                </button>
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-11">
                    <div>
                        <Link to="/" className="text-xl font-bold tracking-tight text-white">JEDE MEDTECH</Link>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">India Private Limited</p>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                            Medical equipment, consumables and disposables for healthcare professionals, institutions and customers across India.
                        </p>
                    </div>
                    <FooterLinks title="Shop" links={[["Products", "/"], ["Wishlist", "/wishlist"], ["Cart", "/cart"]]} />
                    <FooterLinks title="For Sellers" links={[["Seller Home", "/seller-home"], ["Become a Seller", "/seller-register"], ["Seller Login", "/seller-login"]]} />
                    <div>
                        <h3 className="text-sm font-bold text-white">Contact Us</h3>
                        <p className="mt-3 text-xs leading-5 text-slate-400">For product, order and customer service enquiries.</p>
                        <a href="tel:+919384804209" className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"><Phone size={15} className="text-cyan-400" /> +91 93848 04209</a>
                        <a href="tel:+919390630297" className="mt-3 flex items-center gap-2 text-sm text-slate-300 hover:text-white"><Phone size={15} className="text-cyan-400" /> +91 93906 30297</a>
                    </div>
                </div>
                <div className="border-t border-slate-800 bg-[#0f151c]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
                        <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">© {new Date().getFullYear()} JEDE MEDTECH INDIA PRIVATE LIMITED. All rights reserved.</p>
                        <p className="text-[11px] text-slate-600 sm:text-xs">Medical Equipment • Consumables • Disposables</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FooterLinks({ title, links }) {
    return (
        <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <ul className="mt-4 space-y-3">
                {links.map(([label, to]) => (
                    <li key={label}>
                        <Link to={to} className="text-sm text-slate-400 transition hover:text-white hover:underline hover:underline-offset-4">{label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
