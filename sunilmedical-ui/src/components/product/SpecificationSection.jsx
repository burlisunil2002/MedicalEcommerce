import React from "react";

export default function SpecificationSection({
    variant,
    index,
    addSpecification,
    removeSpecification,
    updateSpecification
}) {

    return (

        <div
            className="
                mt-8
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
            "
        >

            {/* Header */}

            <div
                className="
                    flex
                    justify-between
                    items-center
                    mb-6
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

                        Specifications

                    </h3>

                    <p
                        className="
                            text-gray-500
                            text-sm
                        "
                    >

                        Technical details of this variant

                    </p>

                </div>

                <button

                    type="button"

                    onClick={() =>
                        addSpecification(index)
                    }

                    className="
                        px-4
                        py-2
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-semibold
                    "

                >

                    + Add Specification

                </button>

            </div>
            {

                variant.specifications.map(

                    (spec, specIndex) => (

                        <div

                            key={`${index}-${specIndex}`}

                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-5
                                gap-4
                                items-end
                                mb-4
                            "

                        >

                            {/* Key */}

                            <div
                                className="md:col-span-2"
                            >

                                <label
                                    className="
                                        block
                                        mb-2
                                        font-semibold
                                    "
                                >

                                    Specification

                                </label>

                                <input

                                    value={spec.key}

                                    onChange={(e) =>

                                        updateSpecification(

                                            index,

                                            specIndex,

                                            "key",

                                            e.target.value

                                        )

                                    }

                                    placeholder="Voltage"

                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-gray-300
                                        px-4
                                        py-3
                                        focus:ring-2
                                        focus:ring-blue-200
                                        outline-none
                                    "

                                />

                            </div>
                            <div
                                className="md:col-span-2"
                            >

                                <label
                                    className="
                                        block
                                        mb-2
                                        font-semibold
                                    "
                                >

                                    Value

                                </label>

                                <input

                                    value={spec.value}

                                    onChange={(e) =>

                                        updateSpecification(

                                            index,

                                            specIndex,

                                            "value",

                                            e.target.value

                                        )

                                    }

                                    placeholder="220V"

                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-gray-300
                                        px-4
                                        py-3
                                        focus:ring-2
                                        focus:ring-blue-200
                                        outline-none
                                    "

                                />

                            </div>
                            {/* Remove */}

                            <div>

                                <button

                                    type="button"

                                    onClick={() =>
                                        removeSpecification(
                                            index,
                                            specIndex
                                        )
                                    }

                                    className="
                                        w-full
                                        rounded-xl
                                        bg-red-500
                                        hover:bg-red-600
                                        text-white
                                        py-3
                                        font-semibold
                                        transition-all
                                    "

                                >

                                    Remove

                                </button>

                            </div>

                        </div>

                    )

                )

            }
            {

                variant.specifications.length === 0 && (

                    <div
                        className="
                            py-12
                            text-center
                            rounded-2xl
                            bg-gray-50
                            border
                            border-dashed
                            border-gray-300
                        "
                    >

                        <div className="text-5xl mb-3">

                            📋

                        </div>

                        <h4
                            className="
                                text-lg
                                font-bold
                                text-gray-700
                            "
                        >

                            No Specifications Added

                        </h4>

                        <p
                            className="
                                text-gray-500
                                mt-2
                            "
                        >

                            Click "Add Specification"
                            to add technical details.

                        </p>

                    </div>

                )

            }
            <div
                className="
                    mt-8
                    rounded-2xl
                    bg-gradient-to-r
                    from-indigo-500
                    to-blue-600
                    text-white
                    p-6
                "
            >

                <div
                    className="
                        flex
                        justify-between
                        items-center
                    "
                >

                    <div>

                        <h4
                            className="
                                text-xl
                                font-bold
                            "
                        >

                            Specification Summary

                        </h4>

                        <p
                            className="
                                text-blue-100
                                mt-1
                            "
                        >

                            Total specifications for this
                            variant.

                        </p>

                    </div>

                    <div
                        className="
                            text-5xl
                            font-bold
                        "
                    >

                        {variant.specifications.length}

                    </div>

                </div>

            </div>
        </div>

    );

}