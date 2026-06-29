/*import {
    Building2,
    Boxes,
    BadgeIndianRupee,
    Weight,
    Package,
    Hash,
    Percent,
    Layers,
    Ruler,
    ShieldCheck,
    Activity
} from "lucide-react";

export default function ProductHighlights({

    product,

    selectedVariant

}) {

    if (!product || !selectedVariant)
        return null;

    const highlights = [

        {
            icon: <Building2 size={22} />,
            title: "Brand",
            value: product.brand || "-"
        },

        {
            icon: <Boxes size={22} />,
            title: "Category",
            value: product.category || "-"
        },

        {
            icon: <Activity size={22} />,
            title: "Model",
            value: selectedVariant.model || "-"
        },

        {
            icon: <BadgeIndianRupee size={22} />,
            title: "Price",
            value: `₹${Number(selectedVariant.price ?? 0).toLocaleString()}`
        },

        {
            icon: <Package size={22} />,
            title: "Stock",
            value: `${selectedVariant.stockQuantity ?? 0} Units`
        },

        {
            icon: <Hash size={22} />,
            title: "HSN Code",
            value: product.hsnCode || "-"
        },

        {
            icon: <Percent size={22} />,
            title: "GST",
            value: `${product.gstPercentage}%`
        },

        {
            icon: <Weight size={22} />,
            title: "Weight",
            value: product.weight
                ? `${product.weight} Kg`
                : "-"
        },

        {
            icon: <Layers size={22} />,
            title: "Pack Size",
            value: selectedVariant.packSize || "-"
        },

        {
            icon: <Ruler size={22} />,
            title: "Size",
            value: selectedVariant.size || "-"
        },

        {
            icon: <ShieldCheck size={22} />,
            title: "Status",
            value: product.status
        }

    ];

    return (

        <section className="mt-10">

            <div className="flex justify-between items-center mb-6">

                <div>

                    <h2 className="text-2xl font-bold">

                        Product Highlights

                    </h2>

                    <p className="text-gray-500 mt-1">

                        Important product information at a glance.

                    </p>

                </div>

            </div>

            <div
                className="
                    grid
                    grid-cols-2
                    md:grid-cols-3
                    xl:grid-cols-4
                    gap-5
                "
            >

                {

                    highlights.map((item, index) => (

                        <HighlightCard

                            key={index}

                            {...item}

                        />

                    ))

                }

            </div>

        </section>

    );

}

function HighlightCard({

    icon,

    title,

    value

}) {

    return (

        <div
            className="
                rounded-3xl
                border
                bg-white
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
                duration-300
                p-5
            "
        >

            <div
                className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-blue-50
                    text-blue-600
                    flex
                    items-center
                    justify-center
                    mb-4
                "
            >

                {icon}

            </div>

            <div
                className="
                    text-sm
                    text-gray-500
                "
            >

                {title}

            </div>

            <div
                className="
                    mt-2
                    font-semibold
                    text-gray-900
                    break-words
                "
            >

                {value}

            </div>

        </div>

    );

}*/