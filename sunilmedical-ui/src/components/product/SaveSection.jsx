import React from "react";

export default function SaveSection({
    loading,
    mode
}) {

    return (

        <div
            className="
                sticky
                bottom-0
                bg-white
                rounded-3xl
                shadow-2xl
                p-6
                mt-10
                border
            "
        >

            <div
                className="
                    flex
                    flex-col
                    md:flex-row
                    justify-between
                    items-center
                    gap-5
                "
            >

                <div>

                    <h3
                        className="
                            text-xl
                            font-bold
                            text-gray-800
                        "
                    >

                        Ready to Save?

                    </h3>

                    <p
                        className="
                            text-gray-500
                            mt-1
                        "
                    >

                        Review all information before
                        submitting.

                    </p>

                </div>

                <button

                    type="submit"

                    disabled={loading}

                    className={`
                        px-12
                        py-4
                        rounded-2xl
                        font-bold
                        text-lg
                        text-white
                        transition-all
                        duration-300
                        shadow-xl

                        ${loading

                            ? "bg-gray-400 cursor-not-allowed"

                            : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-105 hover:shadow-2xl"

                        }
                    `}

                >

                    {

                        loading ?

                            (

                                <div className="flex items-center gap-3">

                                    <div
                                        className="
                                            h-6
                                            w-6
                                            rounded-full
                                            border-4
                                            border-white
                                            border-t-transparent
                                            animate-spin
                                        "
                                    />

                                    Saving...

                                </div>

                            )

                            :

                            (

                                mode === "edit"

                                    ?

                                    "💾 Update Product"

                                    :

                                    "🚀 Add Product"

                            )

                    }

                </button>

            </div>

        </div>

    );

}