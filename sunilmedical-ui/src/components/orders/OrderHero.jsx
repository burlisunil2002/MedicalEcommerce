import { Package, Search } from "lucide-react";

export default function OrderHero({
    search,
    setSearch,
    totalOrders
}) {

    return (

        <div className="relative overflow-hidden rounded-[35px] bg-gradient-to-r from-blue-50 via-white to-cyan-50 border shadow-sm p-8 lg:p-10 mb-8">

            <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row justify-between gap-8 items-center">

                <div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-5">

                        <Package size={18} />

                        My Orders

                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold">

                        Track Your Orders

                    </h1>

                    <p className="mt-4 text-gray-600 max-w-xl text-lg">

                        View all your purchases,

                        download invoices,

                        monitor delivery,

                        request returns,

                        and manage orders from one place.

                    </p>

                    <div className="mt-6 flex gap-6">

                        <div>

                            <div className="text-3xl font-bold text-blue-700">

                                {totalOrders}

                            </div>

                            <div className="text-gray-500 text-sm">

                                Total Orders

                            </div>

                        </div>

                    </div>

                </div>

                <div className="w-full lg:w-96">

                    <div className="relative">

                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input

                            value={search}

                            onChange={(e) => setSearch(e.target.value)}

                            placeholder="Search orders, products..."

                            className="w-full h-14 rounded-2xl border pl-12 pr-5 bg-white outline-none focus:ring-2 focus:ring-blue-500"

                        />

                    </div>

                </div>

            </div>

        </div>

    );

}