import {
    BadgeCheck
} from "lucide-react";

export default function ProductSpecification({

    selectedVariant

}) {

    const specifications =
        selectedVariant?.specifications ?? [];

    return (

        <div
            className="
                bg-white
                rounded-3xl
                border
                shadow-sm
                overflow-hidden
            "
        >

            <div
                className="
                    p-8
                    border-b
                "
            >

                <h2
                    className="
                        text-2xl
                        font-bold
                    "
                >

                    Technical Specifications

                </h2>

            </div>

            {

                specifications.length === 0 &&

                <div
                    className="
                        p-8
                        text-center
                        text-gray-500
                    "
                >

                    No Specifications Available

                </div>

            }

            {

                specifications.map(

                    (spec, index) => (

                        <div

                            key={index}

                            className={`

                                grid

                                md:grid-cols-3

                                gap-4

                                px-8

                                py-5

                                border-b

                                ${index % 2 === 0

                                    ?

                                    "bg-gray-50"

                                    :

                                    "bg-white"

                                }

                            `}

                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    font-semibold
                                "
                            >

                                <BadgeCheck
                                    size={18}
                                    className="text-blue-600"
                                />

                                {spec.key}

                            </div>

                            <div
                                className="
                                    md:col-span-2
                                    text-gray-600
                                "
                            >

                                {spec.value}

                            </div>

                        </div>

                    )

                )

            }

        </div>

    );

}