export default function LoadingOrders() {

    return (

        <div className="min-h-screen bg-slate-50">

            <div className="max-w-7xl mx-auto px-5 py-8">

                {/* Hero Skeleton */}

                <div className="
                    h-60
                    rounded-[35px]
                    bg-gradient-to-r
                    from-gray-100
                    via-gray-50
                    to-gray-100
                    animate-pulse
                    mb-8
                " />

                {[1, 2, 3].map(item => (

                    <div
                        key={item}
                        className="
                            bg-white
                            rounded-[30px]
                            shadow-sm
                            border
                            mb-8
                            overflow-hidden
                        "
                    >

                        {/* Header */}

                        <div className="p-6 border-b">

                            <div className="flex justify-between">

                                <div>

                                    <div className="w-48 h-5 rounded bg-gray-200 animate-pulse mb-3" />

                                    <div className="w-32 h-4 rounded bg-gray-100 animate-pulse" />

                                </div>

                                <div>

                                    <div className="w-28 h-8 rounded bg-gray-200 animate-pulse" />

                                </div>

                            </div>

                        </div>

                        {/* Products */}

                        <div className="p-6">

                            {[1, 2].map(p => (

                                <div
                                    key={p}
                                    className="flex gap-5 mb-6"
                                >

                                    <div className="
                                        w-28
                                        h-28
                                        rounded-2xl
                                        bg-gray-200
                                        animate-pulse
                                    "/>

                                    <div className="flex-1">

                                        <div className="w-72 h-5 rounded bg-gray-200 animate-pulse mb-3" />

                                        <div className="w-44 h-4 rounded bg-gray-100 animate-pulse mb-3" />

                                        <div className="w-32 h-4 rounded bg-gray-100 animate-pulse" />

                                    </div>

                                </div>

                            ))}

                            {/* Footer */}

                            <div className="flex justify-between mt-8">

                                <div className="w-40 h-12 rounded-xl bg-gray-200 animate-pulse" />

                                <div className="w-36 h-12 rounded-xl bg-gray-200 animate-pulse" />

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}