import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Crown,
    CheckCircle,
    Sparkles,
    ShieldCheck,
    Package,
    CreditCard,
    Loader2
} from "lucide-react";

import Swal from "sweetalert2";
import API from "../../services/api";

export default function Subscription() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [subscription, setSubscription] = useState(null);

    const [selectedRange, setSelectedRange] =
        useState("1-5");

    const [selectedPlan, setSelectedPlan] =
        useState("basic");

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

            color:
                "from-blue-500 to-cyan-500",

            icon:
                <Package size={34} />
        },

        {
            id: "pro",

            title: "Startup",

            years: 2,

            popular: true,

            color:
                "from-purple-500 to-pink-500",

            icon:
                <Sparkles size={34} />
        },

        {
            id: "ent",

            title: "Enterprise",

            years: 3,

            color:
                "from-emerald-500 to-green-600",

            icon:
                <Crown size={34} />
        }

    ];
    useEffect(() => {

        loadPage();

    }, []);
    const loadPage = async () => {

        try {

            setLoading(true);

            const [status, config] =
                await Promise.all([

                    API.get("/api/subscription/status"),

                    API.get("/api/subscription/config")

                ]);

            if (status.data.subscribed) {

                setSubscription(
                    status.data.subscription
                );

            }

            setRazorpayKey(
                config.data.razorpayKey
            );

        }

        catch {

            Swal.fire(
                "Error",
                "Unable to load subscription.",
                "error"
            );

        }

        finally {

            setLoading(false);

        }

    };

    if (processing) return;

    const payNow = async (plan) => {

        try {

            setProcessing(true);

            // Create Subscription
            const { data } = await API.post(
                "api/subscription/create",
                {
                    plan,
                    productRange: selectedRange
                }
            );

            if (!data.success) {

                Swal.fire(
                    "Error",
                    data.message,
                    "error"
                );

                setProcessing(false);

                return;
            }

            const options = {

                key: razorpayKey,

                amount: data.amount,

                currency: "INR",

                order_id: data.razorpayOrderId,

                name: "MedMarket",

                description: "Seller Subscription",

                theme: {
                    color: "#2563eb"
                },

                handler: async function (response) {

                    await verifyPayment(
                        response,
                        data.subscriptionId
                    );

                },

                modal: {

                    ondismiss: async () => {

                        try {

                            await API.post(
                                "/api/subscription/payment-failed",
                                data.subscriptionId
                            );

                        } catch (e) {

                            console.error(e);

                        } finally {

                            setProcessing(false);

                        }

                    }

                }

            };

            const razor = new window.Razorpay(options);

            razor.on("payment.failed", async function (response) {

                console.log(response.error);

                try {

                    await API.post(
                        "/subscription/payment-failed",
                        data.subscriptionId
                    );

                } catch (e) {

                    console.error("Payment Failed API Error:", e);

                } finally {

                    setProcessing(false);

                    Swal.fire(
                        "Payment Failed",
                        response.error.description || "Payment could not be completed.",
                        "error"
                    );

                }

            });

            try {

                razor.open();

            } catch (e) {

                setProcessing(false);

                Swal.fire(
                    "Error",
                    "Unable to open Razorpay.",
                    "error"
                );

            }
        }

        catch (err) {

            console.log(err);

            Swal.fire(
                "Error",
                "Unable to create subscription.",
                "error"
            );

            setProcessing(false);

        }

    };

    const verifyPayment = async (
        response,
        subscriptionId
    ) => {

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

            pollStatus(subscriptionId);

        }

        catch {

            Swal.fire(
                "Error",
                "Payment verification failed.",
                "error"
            );

            setProcessing(false);

        }

    };

    const pollStatus = (subscriptionId) => {

        let attempts = 0;

        const timer = setInterval(async () => {

            attempts++;

            const { data } =
                await API.get(
                    `/api/subscription/payment-status?subscriptionId=${subscriptionId}`
                );

            if (data.isActive) {

                clearInterval(timer);

                Swal.fire({

                    icon: "success",

                    title: "Subscription Activated",

                    text:
                        "Welcome to Premium Seller.",

                    confirmButtonColor:
                        "#2563eb"

                }).then(() => {

                    navigate(
                        "/seller/dashboard"
                    );

                });

            }

            if (attempts >= 30) {

                clearInterval(timer);

                Swal.fire(
                    "Info",
                    "Payment is processing. Please refresh later.",
                    "info"
                );

            }

        }, 3000);

    };

    if (loading) {
        return (

            <div className="h-screen flex justify-center items-center bg-slate-50">

                <Loader2
                    className="w-12 h-12 animate-spin text-blue-600"
                />

            </div>

        );
    }
    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-white">

            <div className="max-w-7xl mx-auto px-6 py-10">

                <div className="text-center mb-12">

                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold">

                        <Crown size={20} />

                        Seller Subscription

                    </div>

                    <h1 className="text-5xl font-extrabold mt-6 text-slate-800">

                        Grow Your Medical Business

                    </h1>

                    <p className="text-gray-500 mt-4 text-lg">

                        Choose a subscription plan that matches your business and
                        unlock product management, order management and premium seller
                        features.

                    </p>

                </div>
                {
                    subscription && (

                        <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-8 mb-12">

                            <div className="flex justify-between items-center">

                                <div>

                                    <div className="flex items-center gap-2 text-green-600 font-semibold">

                                        <ShieldCheck size={20} />

                                        Current Subscription

                                    </div>

                                    <h2 className="text-3xl font-bold mt-3">

                                        {subscription.years} Year Plan

                                    </h2>

                                    <p className="text-gray-500 mt-2">

                                        Product Range :

                                        <strong>

                                            {subscription.productRange}

                                        </strong>

                                    </p>

                                </div>

                                <div className="text-right">

                                    <div className="text-green-600 text-sm">

                                        Active Until

                                    </div>

                                    <div className="text-2xl font-bold">

                                        {

                                            new Date(

                                                subscription.endDate

                                            ).toLocaleDateString()

                                        }

                                    </div>

                                </div>

                            </div>

                        </div>

                    )

                }
                <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">

                    <h2 className="text-2xl font-bold mb-5">

                        Select Product Capacity

                    </h2>

                    <select

                        value={selectedRange}

                        onChange={(e) =>

                            setSelectedRange(

                                e.target.value

                            )

                        }

                        className="w-full md:w-80 border rounded-xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-100"

                    >

                        <option value="1-5">

                            1-5 Products

                        </option>

                        <option value="6-10">

                            6-10 Products

                        </option>

                        <option value="11-15">

                            11-15 Products

                        </option>

                        <option value="16-20">

                            16-20 Products

                        </option>

                        <option value="20+">

                            20+ Products

                        </option>

                    </select>

                </div>
                <div className="grid lg:grid-cols-3 gap-8">

                    {

                        plans.map(plan => (

                            <div

                                key={plan.id}

                                onClick={() => setSelectedPlan(plan.id)}

                                className={`

relative

rounded-3xl

overflow-hidden

cursor-pointer

transition-all

duration-300

hover:-translate-y-3

hover:shadow-2xl

border-4

${selectedPlan === plan.id

                                        ?

                                        "border-blue-600"

                                        :

                                        "border-transparent"

                                    }

bg-white

`}

                            >

                                {

                                    plan.popular && (

                                        <div className="absolute top-5 right-5 bg-pink-500 text-white text-xs px-3 py-1 rounded-full">

                                            Most Popular

                                        </div>

                                    )

                                }

                                <div className={`

bg-gradient-to-r

${plan.color}

text-white

p-8

`}>

                                    <div className="flex justify-between">

                                        {plan.icon}

                                        <div>

                                            <h2 className="text-3xl font-bold">

                                                ₹{

                                                    pricing[selectedRange][plan.id]

                                                }

                                            </h2>

                                            <p>

                                                {plan.years} Year

                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <div className="p-8">

                                    <h3 className="text-2xl font-bold">

                                        {plan.title}

                                    </h3>

                                    <ul className="mt-6 space-y-3">

                                        {

                                            [

                                                "Unlimited Orders",

                                                "Seller Dashboard",

                                                "Product Management",

                                                "Order Management",

                                                "Secure Payments"

                                            ]

                                                .map(feature => (

                                                    <li

                                                        key={feature}

                                                        className="flex items-center gap-3"

                                                    >

                                                        <CheckCircle

                                                            size={18}

                                                            className="text-green-500"

                                                        />

                                                        {feature}

                                                    </li>

                                                ))

                                        }

                                    </ul>

                                    <button

                                        onClick={() => payNow(plan.id)}

                                        disabled={processing}

                                        className={`

mt-8

w-full

rounded-xl

py-3

font-bold

text-white

bg-gradient-to-r

${plan.color}

hover:scale-105

transition

`}

                                    >

                                        {

                                            processing

                                                ?

                                                "Processing..."

                                                :

                                                "Subscribe Now"

                                        }

                                    </button>

                                </div>

                            </div>

                        ))

                    }

                </div>
            </div>
        </div>
    );

}

