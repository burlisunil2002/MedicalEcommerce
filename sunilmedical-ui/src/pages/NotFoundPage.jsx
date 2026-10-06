import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/";
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50">
            {/* Background animation */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl animate-pulse" />
                <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-6">
                <section className="w-full max-w-2xl text-center">

                    {/* Animated 404 */}
                    <div className="relative mx-auto w-fit select-none">
                        <div
                            className="
                                text-[96px]
                                font-black
                                leading-none
                                tracking-[-0.08em]
                                text-slate-200
                                animate-pulse
                                sm:text-[140px]
                                md:text-[180px]
                            "
                        >
                            404
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="
                                rounded-full
                                border border-cyan-100
                                bg-white/90
                                px-4 py-2
                                text-xs font-bold
                                uppercase tracking-[0.25em]
                                text-cyan-600
                                shadow-sm
                                backdrop-blur-sm
                                sm:text-sm
                            ">
                                Oops!
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="
                        mt-2
                        text-2xl
                        font-bold
                        tracking-tight
                        text-slate-800
                        sm:text-3xl
                        md:text-4xl
                    ">
                        Page Not Found
                    </h1>

                    <p className="
                        mx-auto
                        mt-4
                        max-w-md
                        text-sm
                        leading-6
                        text-slate-500
                        sm:text-base
                    ">
                        The page you are looking for does not exist,
                        may have moved, or the address may be incorrect.
                    </p>

                    {/* Buttons */}
                    <div className="
                        mt-8
                        flex
                        flex-col
                        items-stretch
                        justify-center
                        gap-3
                        sm:flex-row
                        sm:items-center
                    ">
                        <Link
                            to="/"
                            className="
                                inline-flex
                                min-h-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-cyan-600
                                px-6
                                py-3
                                text-sm
                                font-semibold
                                text-white
                                shadow-lg
                                shadow-cyan-600/20
                                transition-all
                                duration-200
                                hover:-translate-y-0.5
                                hover:bg-cyan-700
                                hover:shadow-xl
                                active:translate-y-0
                            "
                        >
                            Back to Home
                        </Link>

                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="
                                inline-flex
                                min-h-11
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-6
                                py-3
                                text-sm
                                font-semibold
                                text-slate-700
                                shadow-sm
                                transition-all
                                duration-200
                                hover:-translate-y-0.5
                                hover:border-slate-300
                                hover:bg-slate-50
                                hover:shadow-md
                                active:translate-y-0
                            "
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Brand */}
                    <p className="
                        mt-10
                        text-xs
                        text-slate-400
                    ">
                        <span className="font-semibold text-slate-500">
                            JEDE MEDTECH
                        </span>
                        {" • "}
                        Medical Equipment, Consumables & Disposables
                    </p>
                </section>
            </div>
        </main>
    );
}
