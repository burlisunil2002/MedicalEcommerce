import {
    Package,
    Search,
    ShoppingBag,
    LifeBuoy
} from "lucide-react";

export default function OrderHero({

    search,

    setSearch,

    totalOrders

}) {

    return (

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white shadow-xl">

            {/* Background */}

            <div className="absolute inset-0 opacity-10">

                <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-white"></div>

                <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-white"></div>

            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-10 p-8 lg:p-12">

                {/* LEFT */}

                <div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">

                        <Package size={18} />

                        <span className="font-medium">

                            Customer Dashboard

                        </span>

                    </div>

                    <h1 className="mt-6 text-4xl lg:text-5xl font-bold">

                        My Orders

                    </h1>

                    <p className="mt-4 text-blue-100 max-w-xl leading-7">

                        View every purchase, track deliveries,
                        download invoices, request returns,
                        reorder products and manage all your
                        medical equipment purchases from one place.

                    </p>

                    {/* Stats */}

                    <div className="mt-8 flex flex-wrap gap-4">

                        <div className="rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">

                            <p className="text-sm text-blue-100">

                                Total Orders

                            </p>

                            <h2 className="text-3xl font-bold">

                                {totalOrders}

                            </h2>

                        </div>

                        <div className="rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">

                            <p className="text-sm text-blue-100">

                                Secure Shopping

                            </p>

                            <h2 className="text-xl font-semibold">

                                100%

                            </h2>

                        </div>

                    </div>

                </div>

                {/* RIGHT */}

                <div className="flex flex-col justify-center">

                    {/* Search */}

                    <div className="rounded-2xl bg-white p-3 shadow-xl">

                        <div className="flex items-center">

                            <Search
                                className="ml-3 text-slate-400"
                                size={22}
                            />

                            <input

                                value={search}

                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }

                                placeholder="Search by Order Number, Product or Status"

                                className="w-full px-4 py-3 outline-none text-slate-700"

                            />

                        </div>

                    </div>

                    {/* Buttons */}

                    <div className="mt-6 flex flex-wrap gap-4">

                        <button

                            className="flex items-center gap-2 rounded-xl bg-white text-blue-700 px-6 py-3 font-semibold transition hover:scale-105"

                        >

                            <ShoppingBag size={20} />

                            Continue Shopping

                        </button>

                        <button

                            onClick={() =>
                                window.open(
                                    "https://wa.me/919014060858",
                                    "_blank"
                                )
                            }

                            className="flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-semibold backdrop-blur hover:bg-white/20"

                        >

                            <LifeBuoy size={20} />

                            Need Help

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}