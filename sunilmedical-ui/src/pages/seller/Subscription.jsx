import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
    Crown,
    CheckCircle,
    Sparkles,
    ShieldCheck,
    Package,
    CreditCard,
    Loader2,
    Star,
    BadgeCheck,
    Zap,
    Shield,
    Clock,
    ArrowRight
} from "lucide-react";

import Swal from "sweetalert2";

import API from "../../services/api";

export default function Subscription() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [processing, setProcessing] =
        useState(false);

    const [subscription, setSubscription] =
        useState(null);

    const [selectedRange, setSelectedRange] =
        useState("1-5");

    const [selectedPlan, setSelectedPlan] =
        useState("pro");

    const [razorpayKey, setRazorpayKey] =
        useState("");

    const pricing = {

        "1-5": {

            basic: 2999,

            pro: 3999,

            ent: 4999

        },

        "6-10": {

            basic: 3999,

            pro: 5499,

            ent: 6999

        },

        "11-15": {

            basic: 4999,

            pro: 7999,

            ent: 8999

        },

        "16-20": {

            basic: 5999,

            pro: 9499,

            ent: 10999

        },

        "20+": {

            basic: 6999,

            pro: 11999,

            ent: 12999

        }

    };

    const plans = [

        {

            id: "basic",

            title: "Basic",

            years: 1,

            subtitle: "Perfect for new sellers",

            color:

                "from-blue-500 to-cyan-500",

            icon:

                <Package size={32} />,

            badge: null

        },

        {

            id: "pro",

            title: "Startup",

            years: 2,

            subtitle:

                "Most popular choice",

            popular: true,

            color:

                "from-purple-600 to-pink-500",

            icon:

                <Sparkles size={32} />,

            badge: "BEST VALUE"

        },

        {

            id: "ent",

            title: "Enterprise",

            years: 3,

            subtitle:

                "Maximum business growth",

            color:

                "from-green-500 to-emerald-600",

            icon:

                <Crown size={32} />,

            badge: "SAVE MORE"

        }

    ];

    useEffect(() => {

        loadPage();

    }, []);

    async function loadPage() {

        try {

            setLoading(true);

            const [

                status,

                config

            ] = await Promise.all([

                API.get(
                    "/api/subscription/status"
                ),

                API.get(
                    "/api/subscription/config"
                )

            ]);

            if (
                status.data.subscribed
            ) {

                setSubscription(
                    status.data.subscription
                );

            }

            setRazorpayKey(
                config.data.razorpayKey
            );

        }

        catch {

            Swal.fire({

                icon: "error",

                title: "Error",

                text:
                    "Unable to load subscription."

            });

        }

        finally {

            setLoading(false);

        }

    }

    async function payNow(plan) {

        if (processing)
            return;

        try {

            setProcessing(true);

            const { data } =
                await API.post(

                    "/api/subscription/create",

                    {

                        plan,

                        productRange:
                            selectedRange

                    }

                );

            if (!data.success) {

                setProcessing(false);

                Swal.fire(

                    "Error",

                    data.message,

                    "error"

                );

                return;

            }

            if (!window.Razorpay) {

                setProcessing(false);

                Swal.fire(

                    "Error",

                    "Unable to load Razorpay.",

                    "error"

                );

                return;

            }

            const options = {

                key: razorpayKey,

                amount: data.amount,

                currency: "INR",

                order_id:
                    data.razorpayOrderId,

                name:
                    "SunilMedMarket",

                description:
                    "Seller Subscription",

                image: "/logo.png",

                theme: {

                    color: "#2563eb"

                },

                handler: async function (
                    response
                ) {

                    await verifyPayment(

                        response,

                        data.subscriptionId

                    );

                },

                modal: {

                    ondismiss:
                        async () => {

                            try {

                                await API.post(

                                    "/api/subscription/payment-failed",

                                    data.subscriptionId

                                );

                            }

                            finally {

                                setProcessing(false);

                            }

                        }

                }

            };

            const razor =
                new window.Razorpay(
                    options
                );

            razor.on(

                "payment.failed",

                async function (
                    response
                ) {

                    try {

                        await API.post(

                            "/api/subscription/payment-failed",

                            data.subscriptionId

                        );

                    }

                    finally {

                        setProcessing(false);

                        Swal.fire(

                            "Payment Failed",

                            response.error.description,

                            "error"

                        );

                    }

                }

            );

            razor.open();

        }

        catch (err) {

            console.log(err);

            setProcessing(false);

            Swal.fire(

                "Error",

                err?.response?.data?.message ||

                "Unable to create subscription.",

                "error"

            );

        }

    }

    async function verifyPayment(

        response,

        subscriptionId

    ) {

        try {

            await API.post(

                "/api/subscription/verify",

                {

                    razorpay_order_id:
                        response.razorpay_order_id,

                    razorpay_payment_id:
                        response.razorpay_payment_id,

                    razorpay_signature:
                        response.razorpay_signature

                }

            );

            pollStatus(
                subscriptionId
            );

        }

        catch {

            setProcessing(false);

            Swal.fire(

                "Verification Failed",

                "Please contact support.",

                "error"

            );

        }

    }

    function pollStatus(

        subscriptionId

    ) {

        let attempts = 0;

        const timer = setInterval(

            async () => {

                attempts++;

                const { data } =
                    await API.get(

                        `/api/subscription/payment-status?subscriptionId=${subscriptionId}`

                    );

                if (
                    data.isActive
                ) {

                    clearInterval(
                        timer
                    );

                    Swal.fire({

                        icon:
                            "success",

                        title:
                            "Subscription Activated",

                        text:
                            "Welcome to Premium Seller"

                    }).then(() => {

                        navigate(
                            "/seller/dashboard"
                        );

                    });

                }

                if (
                    attempts >= 30
                ) {

                    clearInterval(
                        timer
                    );

                    setProcessing(false);

                    Swal.fire(

                        "Processing",

                        "Payment is being verified.",

                        "info"

                    );

                }

            },

            3000

        );

    }

    if (loading) {

        return (

            <div className="min-h-[70vh] flex justify-center items-center">

                <Loader2
                    className="animate-spin text-blue-600"
                    size={50}
                />

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-white">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ================= HERO ================= */}

                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .4 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white p-6 md:p-10 shadow-2xl"
                >

                    <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-300/10 rounded-full blur-3xl"></div>

                    <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8">

                        <div>

                            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm">

                                <ShieldCheck size={16} />

                                Trusted by Medical Sellers

                            </span>

                            <h1 className="mt-6 text-3xl md:text-5xl font-black leading-tight">

                                Grow Your Medical Business

                            </h1>

                            <p className="mt-5 text-blue-100 text-base md:text-lg max-w-2xl">

                                Upgrade your seller account and unlock premium
                                features, unlimited orders, better visibility
                                and business growth.

                            </p>

                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 text-center">

                                <Star
                                    className="mx-auto mb-3"
                                    size={30}
                                />

                                <h3 className="text-3xl font-black">

                                    3

                                </h3>

                                <p className="text-sm">

                                    Plans

                                </p>

                            </div>

                            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 text-center">

                                <BadgeCheck
                                    className="mx-auto mb-3"
                                    size={30}
                                />

                                <h3 className="text-3xl font-black">

                                    100%

                                </h3>

                                <p className="text-sm">

                                    Secure

                                </p>

                            </div>

                        </div>

                    </div>

                </motion.div>

                {/* ================= CURRENT PLAN ================= */}

                {

                    subscription &&

                    <motion.div

                        initial={{ opacity: 0 }}

                        animate={{ opacity: 1 }}

                        className="mt-8 bg-white rounded-3xl shadow-xl p-6 md:p-8"

                    >

                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">

                            <div>

                                <div className="flex items-center gap-3">

                                    <CreditCard
                                        className="text-blue-600"
                                        size={28}
                                    />

                                    <h2 className="text-2xl font-bold">

                                        Current Subscription

                                    </h2>

                                </div>

                                <p className="text-gray-500 mt-4">

                                    Your seller account is currently subscribed.

                                </p>

                            </div>

                            <div className="lg:text-right">

                                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2 rounded-full font-semibold">

                                    <CheckCircle size={18} />

                                    Active

                                </span>

                                <p className="mt-4 text-gray-500">

                                    Valid Until

                                </p>

                                <h3 className="font-bold text-lg">

                                    {

                                        new Date(

                                            subscription.endDate

                                        ).toLocaleDateString()

                                    }

                                </h3>

                            </div>

                        </div>

                    </motion.div>

                }

                {/* ================= PRODUCT RANGE ================= */}

                <div className="mt-10">

                    <h2 className="text-2xl font-bold mb-5">

                        Select Product Capacity

                    </h2>

                    <div className="bg-white rounded-3xl shadow-lg p-6">

                        <div className="grid md:grid-cols-2 gap-6 items-center">

                            <div>

                                <p className="text-gray-500 mb-4">

                                    Choose how many products you want to manage.

                                </p>

                                <select

                                    value={selectedRange}

                                    onChange={(e) =>
                                        setSelectedRange(
                                            e.target.value
                                        )
                                    }

                                    className="w-full md:w-80 rounded-xl border border-gray-300 px-5 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100"

                                >

                                    <option value="1-5">

                                        1 - 5 Products

                                    </option>

                                    <option value="6-10">

                                        6 - 10 Products

                                    </option>

                                    <option value="11-15">

                                        11 - 15 Products

                                    </option>

                                    <option value="16-20">

                                        16 - 20 Products

                                    </option>

                                    <option value="20+">

                                        20+ Products

                                    </option>

                                </select>

                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                <div className="bg-blue-50 rounded-2xl p-4 text-center">

                                    <Package
                                        className="mx-auto text-blue-600"
                                        size={28}
                                    />

                                    <h4 className="mt-3 font-bold">

                                        Products

                                    </h4>

                                </div>

                                <div className="bg-green-50 rounded-2xl p-4 text-center">

                                    <Shield
                                        className="mx-auto text-green-600"
                                        size={28}
                                    />

                                    <h4 className="mt-3 font-bold">

                                        Secure

                                    </h4>

                                </div>

                                <div className="bg-purple-50 rounded-2xl p-4 text-center">

                                    <Zap
                                        className="mx-auto text-purple-600"
                                        size={28}
                                    />

                                    <h4 className="mt-3 font-bold">

                                        Fast

                                    </h4>

                                </div>

                                <div className="bg-orange-50 rounded-2xl p-4 text-center">

                                    <Clock
                                        className="mx-auto text-orange-600"
                                        size={28}
                                    />

                                    <h4 className="mt-3 font-bold">

                                        24×7

                                    </h4>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================= PRICING CARDS START ================= */}

                <div className="mt-12">

                    <h2 className="text-3xl font-black text-center">

                        Choose Your Subscription Plan

                    </h2>

                    <p className="text-center text-gray-500 mt-3">

                        Flexible pricing for every medical business.

                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
                        {

                            plans.map((plan) => {

                                const price =
                                    pricing[selectedRange][plan.id];

                                return (

                                    <motion.div

                                        key={plan.id}

                                        whileHover={{

                                            y: -8,

                                            scale: 1.02

                                        }}

                                        transition={{

                                            duration: .25

                                        }}

                                        className={`

relative

rounded-3xl

overflow-hidden

shadow-xl

bg-white

border-2

transition-all

${selectedPlan === plan.id

                                                ? "border-blue-600"

                                                : "border-transparent"

                                            }

`}

                                    >

                                        {

                                            plan.badge &&

                                            <div

                                                className="absolute top-5 right-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow"

                                            >

                                                {plan.badge}

                                            </div>

                                        }

                                        <div

                                            className={`

bg-gradient-to-r

${plan.color}

text-white

p-8

text-center

`}

                                        >

                                            <div className="flex justify-center">

                                                {plan.icon}

                                            </div>

                                            <h2 className="text-3xl font-black mt-5">

                                                {plan.title}

                                            </h2>

                                            <p className="mt-2 opacity-90">

                                                {plan.subtitle}

                                            </p>

                                        </div>

                                        <div className="p-8">

                                            <div className="text-center">

                                                <span className="text-gray-400">

                                                    Starting From

                                                </span>

                                                <h1 className="text-5xl font-black mt-3 text-slate-800">

                                                    ₹{price.toLocaleString()}

                                                </h1>

                                                <p className="text-gray-500 mt-3">

                                                    {plan.years} Year Subscription

                                                </p>

                                            </div>

                                            <div className="my-8 border-t"></div>

                                            <div className="space-y-4">

                                                {[

                                                    "Unlimited Orders",

                                                    "Seller Dashboard",

                                                    "Product Management",

                                                    "Inventory Management",

                                                    "Order Tracking",

                                                    "Secure Razorpay Payments",

                                                    "Email Notifications",

                                                    "Priority Support",

                                                    "Automatic Updates"

                                                ].map(feature => (

                                                    <div

                                                        key={feature}

                                                        className="flex items-start gap-3"

                                                    >

                                                        <CheckCircle

                                                            className="text-green-500 mt-1"

                                                            size={18}

                                                        />

                                                        <span className="text-gray-700">

                                                            {feature}

                                                        </span>

                                                    </div>

                                                ))
                                                }

                                        </div>


                                            <button

                                                onClick={() => {

                                                    setSelectedPlan(plan.id);

                                                    payNow(plan.id);

                                                }}

                                                disabled={processing}

                                                className={`

mt-10

w-full

rounded-2xl

py-4

font-bold

text-white

transition-all

duration-300

shadow-lg

hover:shadow-xl

flex

justify-center

items-center

gap-3

${plan.id === "basic"

                                                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"

                                                        : plan.id === "pro"

                                                            ? "bg-gradient-to-r from-purple-600 to-pink-500"

                                                            : "bg-gradient-to-r from-green-500 to-emerald-600"

                                                    }

disabled:opacity-60

disabled:cursor-not-allowed

`}

                                            >

                                                {

                                                    processing &&

                                                    selectedPlan === plan.id &&

                                                    <Loader2

                                                        className="animate-spin"

                                                        size={18}

                                                    />

                                                }

                                                {

                                                    processing &&

                                                        selectedPlan === plan.id

                                                        ? "Processing..."

                                                        : "Subscribe Now"

                                                }

                                                {

                                                    !processing &&

                                                    <ArrowRight size={18} />

                                                }

                                            </button>

                                        </div>

                                    </motion.div>

                                );

                            })

                        }

                    </div>

                </div>


                {/* =======================================================
                            WHY CHOOSE MEDMARKET
            ======================================================== */}

                <section className="mt-20">

                    <div className="text-center">

                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-blue-700 font-semibold">

                            <Sparkles size={18} />

                            Premium Seller Benefits

                        </span>

                        <h2 className="mt-6 text-3xl md:text-5xl font-black text-slate-800">

                            Why Choose MedMarket?

                        </h2>

                        <p className="mt-5 max-w-3xl mx-auto text-gray-500 leading-8">

                            Build your medical business on a secure,
                            scalable and powerful marketplace.
                            Enjoy premium seller tools,
                            secure payments,
                            priority support
                            and unlimited business opportunities.

                        </p>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-14">

                        {/* CARD 1 */}

                        <motion.div

                            whileHover={{
                                y: -8,
                                scale: 1.02
                            }}

                            transition={{
                                duration: .25
                            }}

                            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8"

                        >

                            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

                                <ShieldCheck
                                    size={34}
                                    className="text-blue-600"
                                />

                            </div>

                            <h3 className="mt-6 text-xl font-bold">

                                Secure Payments

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Powered by Razorpay with
                                enterprise-grade encryption,
                                ensuring every payment is
                                completely secure.

                            </p>

                        </motion.div>

                        {/* CARD 2 */}

                        <motion.div

                            whileHover={{
                                y: -8,
                                scale: 1.02
                            }}

                            transition={{
                                duration: .25
                            }}

                            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8"

                        >

                            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">

                                <BadgeCheck
                                    size={34}
                                    className="text-green-600"
                                />

                            </div>

                            <h3 className="mt-6 text-xl font-bold">

                                Verified Seller

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Become a trusted seller
                                and increase customer confidence
                                with verified business status.

                            </p>

                        </motion.div>

                        {/* CARD 3 */}

                        <motion.div

                            whileHover={{
                                y: -8,
                                scale: 1.02
                            }}

                            transition={{
                                duration: .25
                            }}

                            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8"

                        >

                            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">

                                <Zap
                                    size={34}
                                    className="text-orange-600"
                                />

                            </div>

                            <h3 className="mt-6 text-xl font-bold">

                                Faster Business Growth

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Sell more products,
                                reach more buyers
                                and grow your revenue
                                with premium seller tools.

                            </p>

                        </motion.div>

                        {/* CARD 4 */}

                        <motion.div

                            whileHover={{
                                y: -8,
                                scale: 1.02
                            }}

                            transition={{
                                duration: .25
                            }}

                            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8"

                        >

                            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">

                                <Package
                                    size={34}
                                    className="text-purple-600"
                                />

                            </div>

                            <h3 className="mt-6 text-xl font-bold">

                                Unlimited Products

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Easily manage products,
                                variants,
                                specifications
                                and inventory
                                from one dashboard.

                            </p>

                        </motion.div>

                    </div>

                </section>

                {/* =======================================================
                                FAQ SECTION
            ======================================================== */}

                <section className="mt-24">

                    <div className="text-center">

                        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 px-5 py-2 font-semibold">

                            <BadgeCheck size={18} />

                            Frequently Asked Questions

                        </span>

                        <h2 className="mt-6 text-3xl md:text-5xl font-black text-slate-800">

                            Have Questions?

                        </h2>

                        <p className="mt-5 max-w-2xl mx-auto text-gray-500 leading-8">

                            Everything you need to know before purchasing
                            your seller subscription.

                        </p>

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-14">

                        <motion.div

                            whileHover={{ y: -5 }}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <h3 className="text-xl font-bold text-slate-800">

                                How long is my subscription valid?

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Depending on your selected plan,
                                your subscription remains active for
                                1 Year, 2 Years or 3 Years.

                            </p>

                        </motion.div>

                        <motion.div

                            whileHover={{ y: -5 }}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <h3 className="text-xl font-bold text-slate-800">

                                Can I upgrade my plan later?

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Yes.
                                You can upgrade your subscription
                                at any time from the Seller Dashboard.

                            </p>

                        </motion.div>

                        <motion.div

                            whileHover={{ y: -5 }}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <h3 className="text-xl font-bold text-slate-800">

                                Which payment methods are accepted?

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                We support UPI,
                                Debit Cards,
                                Credit Cards,
                                Net Banking
                                and Wallets through Razorpay.

                            </p>

                        </motion.div>

                        <motion.div

                            whileHover={{ y: -5 }}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <h3 className="text-xl font-bold text-slate-800">

                                What happens after payment?

                            </h3>

                            <p className="mt-4 text-gray-500 leading-7">

                                Your subscription gets activated
                                automatically after payment verification
                                and you'll immediately gain access
                                to premium seller features.

                            </p>

                        </motion.div>

                    </div>

                </section>

                {/* =======================================================
                                SUPPORT SECTION
            ======================================================== */}

                <section className="mt-24">

                    <motion.div

                        initial={{ opacity: 0, y: 30 }}

                        whileInView={{ opacity: 1, y: 0 }}

                        viewport={{ once: true }}

                        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white shadow-2xl"

                    >

                        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-300/10 rounded-full blur-3xl"></div>

                        <div className="relative px-8 py-12 lg:px-16 lg:py-16 flex flex-col lg:flex-row justify-between items-center gap-10">

                            <div>

                                <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">

                                    <ShieldCheck size={18} />

                                    Dedicated Seller Support

                                </span>

                                <h2 className="mt-6 text-3xl lg:text-5xl font-black">

                                    Need Help Choosing a Plan?

                                </h2>

                                <p className="mt-5 max-w-xl text-blue-100 leading-8">

                                    Our team is available to help you
                                    choose the best subscription,
                                    resolve payment issues,
                                    manage products
                                    and grow your medical business.

                                </p>

                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">

                                <button

                                    onClick={() =>
                                        navigate("/seller/dashboard")
                                    }

                                    className="rounded-2xl bg-white text-blue-700 font-bold px-8 py-4 hover:shadow-xl transition"

                                >

                                    Seller Dashboard

                                </button>

                                <button

                                    onClick={() =>
                                        window.location.href =
                                        "mailto:support@sunilmedicalproducts.online"
                                    }

                                    className="rounded-2xl border border-white px-8 py-4 font-bold hover:bg-white hover:text-blue-700 transition"

                                >

                                    Contact Support

                                </button>

                            </div>

                        </div>

                    </motion.div>

                </section>
                {/* ================= SUPPORT CTA ================= */}

                <motion.section

                    initial={{ opacity: 0, y: 20 }}

                    whileInView={{ opacity: 1, y: 0 }}

                    viewport={{ once: true }}

                    className="mt-20"

                >

                    <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white shadow-2xl">

                        <div className="px-8 py-12 lg:px-16 lg:py-16 flex flex-col lg:flex-row justify-between items-center gap-10">

                            <div>

                                <h2 className="text-3xl lg:text-5xl font-black">

                                    Need Assistance?

                                </h2>

                                <p className="mt-5 text-blue-100 max-w-xl leading-7">

                                    Our dedicated seller support team is available to
                                    assist you with subscriptions, payments, product
                                    listings and business growth.

                                </p>

                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">

                                <button

                                    onClick={() => navigate("/seller/dashboard")}

                                    className="px-8 py-4 rounded-2xl bg-white text-blue-700 font-bold hover:shadow-xl transition"

                                >

                                    Dashboard

                                </button>

                                <button

                                    onClick={() => window.location.href = "mailto:support@sunilmedicalproducts.online"}

                                    className="px-8 py-4 rounded-2xl border border-white hover:bg-white hover:text-blue-700 transition font-bold"

                                >

                                    Contact Support

                                </button>

                            </div>

                        </div>

                    </div>

                </motion.section>

                {/* ================= TRUST BADGES ================= */}

                <section className="mt-20">

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">

                            <ShieldCheck

                                size={40}

                                className="mx-auto text-green-600"

                            />

                            <h3 className="font-bold mt-5">

                                100% Secure

                            </h3>

                            <p className="text-sm text-gray-500 mt-2">

                                SSL Protected

                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">

                            <CreditCard

                                size={40}

                                className="mx-auto text-blue-600"

                            />

                            <h3 className="font-bold mt-5">

                                Razorpay

                            </h3>

                            <p className="text-sm text-gray-500 mt-2">

                                Trusted Payments

                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">

                            <BadgeCheck

                                size={40}

                                className="mx-auto text-indigo-600"

                            />

                            <h3 className="font-bold mt-5">

                                Verified

                            </h3>

                            <p className="text-sm text-gray-500 mt-2">

                                Seller Program

                            </p>

                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">

                            <Zap

                                size={40}

                                className="mx-auto text-orange-500"

                            />

                            <h3 className="font-bold mt-5">

                                Fast Setup

                            </h3>

                            <p className="text-sm text-gray-500 mt-2">

                                Instant Activation

                            </p>

                        </div>

                    </div>

                </section>

                {/* ================= FOOTER ================= */}

                <footer className="mt-20 border-t border-slate-200 py-10">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                        <div>

                            <h3 className="text-2xl font-black text-slate-800">

                                SunilMedMarket

                            </h3>

                            <p className="text-gray-500 mt-2">

                                Seller Subscription Portal

                            </p>

                        </div>

                        <div className="flex flex-wrap justify-center gap-8 text-gray-500">

                            <button

                                onClick={() => navigate("/seller/dashboard")}

                                className="hover:text-blue-600"

                            >

                                Dashboard

                            </button>

                            <button

                                onClick={() => navigate("/seller/products")}

                                className="hover:text-blue-600"

                            >

                                Products

                            </button>

                            <button

                                onClick={() => navigate("/seller/orders")}

                                className="hover:text-blue-600"

                            >

                                Orders

                            </button>

                            <button

                                onClick={() => navigate("/seller/subscription")}

                                className="hover:text-blue-600"

                            >

                                Subscription

                            </button>

                        </div>

                    </div>

                    <div className="mt-10 text-center text-gray-400 text-sm">

                        © {new Date().getFullYear()} SunilMedMarket.

                        All Rights Reserved.

                    </div>

                </footer>

            </div>

        </div>
        

    );
  }
