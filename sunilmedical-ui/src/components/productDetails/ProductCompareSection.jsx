import {
    CheckCircle,
    BadgeIndianRupee,
    Package,
    ArrowRightLeft
} from "lucide-react";

export default function ProductCompareSection({

    compareProducts = []

}) {

    if (!compareProducts.length)
        return null;

    return (

        <section className="mt-16">

            <div className="flex justify-between items-center mb-8">

                <div>

                    <h2 className="text-2xl font-bold">

                        Compare Similar Products

                    </h2>

                    <p className="text-gray-500 mt-2">

                        Compare different models before purchasing.

                    </p>

                </div>

            </div>

            <div
                className="
                    overflow-x-auto
                "
            >

                <table
                    className="
                        min-w-full
                        bg-white
                        rounded-3xl
                        shadow-lg
                        overflow-hidden
                    "
                >

                    <thead>

                        <tr>

                            <th className="p-6 text-left">

                                Specification

                            </th>

                            {

                                compareProducts.map(product => (

                                    <th
                                        key={product.id}
                                        className="p-6"
                                    >

                                        <img

                                            src={
                                                product.imageUrl
                                            }

                                            className="
                                                h-32
                                                mx-auto
                                                object-contain
                                            "

                                        />

                                        <div className="mt-4 font-bold">

                                            {product.name}

                                        </div>

                                    </th>

                                ))

                            }

                        </tr>

                    </thead>

                    <tbody>

                        <Row

                            title="Price"

                            products={compareProducts}

                            render={

                                p =>

                                    `₹${Number(

                                        p.variants?.[0]?.price ||

                                        0

                                    ).toLocaleString()}`

                            }

                        />

                        <Row

                            title="Model"

                            products={compareProducts}

                            render={

                                p =>

                                    p.variants?.[0]?.model

                            }

                        />

                        <Row

                            title="Stock"

                            products={compareProducts}

                            render={

                                p =>

                                    p.variants?.[0]?.stockQuantity

                            }

                        />

                        <Row

                            title="GST"

                            products={compareProducts}

                            render={

                                p =>

                                    `${p.gstPercentage}%`

                            }

                        />

                        <Row

                            title="Brand"

                            products={compareProducts}

                            render={

                                p =>

                                    p.brand

                            }

                        />

                    </tbody>

                </table>

            </div>

        </section>

    );

}

function Row({

    title,

    products,

    render

}) {

    return (

        <tr className="border-t">

            <td className="p-6 font-semibold">

                {title}

            </td>

            {

                products.map(product => (

                    <td
                        key={product.id}
                        className="p-6 text-center"
                    >

                        {

                            render(product)

                        }

                    </td>

                ))

            }

        </tr>

    );

}