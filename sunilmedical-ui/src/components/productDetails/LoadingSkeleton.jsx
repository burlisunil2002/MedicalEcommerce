import React from "react";

export default function LoadingSkeleton() {

    return (

        <div className="min-h-screen bg-slate-50">

            <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 animate-pulse">

                {/* Breadcrumb */}

                <div className="h-5 w-60 bg-gray-200 rounded mb-8"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Gallery */}

                    <div className="lg:col-span-4">

                        <div className="bg-white rounded-3xl shadow p-6">

                            <div className="h-[430px] bg-gray-200 rounded-2xl"></div>

                            <div className="flex gap-3 mt-5">

                                {[1, 2, 3, 4].map(i => (

                                    <div

                                        key={i}

                                        className="w-20 h-20 rounded-xl bg-gray-200"

                                    />

                                ))}

                            </div>

                        </div>

                    </div>

                    {/* Details */}

                    <div className="lg:col-span-5 space-y-5">

                        <div className="h-10 w-3/4 bg-gray-200 rounded"></div>

                        <div className="h-6 w-40 bg-gray-200 rounded"></div>

                        <div className="h-12 w-48 bg-gray-200 rounded"></div>

                        <div className="h-32 bg-gray-200 rounded-2xl"></div>

                        <div className="h-14 bg-gray-200 rounded-xl"></div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="h-14 bg-gray-200 rounded-xl"></div>

                            <div className="h-14 bg-gray-200 rounded-xl"></div>

                        </div>

                    </div>

                    {/* Sticky Purchase */}

                    <div className="lg:col-span-3">

                        <div className="bg-white rounded-3xl shadow p-6">

                            <div className="h-8 w-32 bg-gray-200 rounded"></div>

                            <div className="h-14 bg-gray-200 rounded mt-6"></div>

                            <div className="h-14 bg-gray-200 rounded mt-4"></div>

                            <div className="h-32 bg-gray-200 rounded mt-6"></div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}