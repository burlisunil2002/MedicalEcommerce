import { useState } from "react";

import ProductDescription from "./ProductDescription";
import ProductSpecification from "./ProductSpecification";
import ProductDownload from "./ProductDownload";

export default function ProductTabs({

    product,

    selectedVariant

}) {

    const [activeTab, setActiveTab] =
        useState("description");

    const tabs = [

        {
            id: "description",
            label: "Description"
        },

        {
            id: "specifications",
            label: "Specifications"
        },

        {
            id: "downloads",
            label: "Downloads"
        }

    ];

    return (

        <section
            className="
                mt-12
            "
        >

            {/* Tabs */}

            <div
                className="
                    sticky
                    top-16
                    z-20
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    p-2
                    flex
                    overflow-x-auto
                    gap-2
                "
            >

                {

                    tabs.map(tab => (

                        <button

                            key={tab.id}

                            onClick={() =>
                                setActiveTab(tab.id)
                            }

                            className={`

                                px-6

                                py-3

                                rounded-xl

                                whitespace-nowrap

                                font-semibold

                                transition

                                ${activeTab === tab.id

                                    ?

                                    "bg-blue-600 text-white shadow-lg"

                                    :

                                    "text-gray-600 hover:bg-gray-100"

                                }

                            `}

                        >

                            {tab.label}

                        </button>

                    ))

                }

            </div>

            {/* Content */}

            <div
                className="
                    mt-8
                "
            >

                {

                    activeTab ===
                    "description"

                    &&

                    <ProductDescription

                        product={product}

                    />

                }

                {

                    activeTab ===
                    "specifications"

                    &&

                    <ProductSpecification

                        selectedVariant={
                            selectedVariant
                        }

                    />

                }

                {

                    activeTab ===
                    "downloads"

                    &&

                    <ProductDownload

                        product={product}

                    />

                }

            </div>

        </section>

    );

}