import {
    Plus,
    ShoppingCart,
    BadgeIndianRupee
} from "lucide-react";

export default function FrequentlyBoughtTogether({

    product,

    relatedProducts = [],

    addBundleToCart

}) {

    if (!relatedProducts.length)
        return null;

    const products = [

        product,

        ...relatedProducts.slice(0, 3)

    ];

    const total =

        products.reduce(

            (sum, p) =>

                sum +

                Number(

                    p.price ||

                    p.variants?.[0]?.price ||

                    0

                ),

            0

        );

    return (

        <section
            className="
                mt-16
                bg-white
                rounded-3xl
                shadow-lg
                border
                p-8
            "
        >

            <h2
                className="
                    text-2xl
                    font-bold
                    mb-8
                "
            >

                Frequently Bought Together

            </h2>

            <div
                className="
                    flex
                    flex-wrap
                    items-center
                    gap-6
                "
            >

                {

                    products.map((p, index) => (

                        <>

                            <ProductCard

                                key={index}

                                product={p}

                            />

                            {

                                index < products.length - 1 &&

                                <Plus
                                    className="
                                    text-blue-600
                                "
                                />

                            }

                        </>

                    ))

                }

            </div>

            <div
                className="
                    mt-10
                    border-t
                    pt-8
                    flex
                    flex-wrap
                    justify-between
                    items-center
                    gap-5
                "
            >

                <div>

                    <div
                        className="
                            text-gray-500
                        "
                    >

                        Bundle Total

                    </div>

                    <div
                        className="
                            text-3xl
                            font-bold
                            text-green-600
                        "
                    >

                        ₹

                        {total.toLocaleString()}

                    </div>

                </div>

                <button

                    onClick={() =>

                        addBundleToCart(products)

                    }

                    className="
                        px-8
                        h-14
                        rounded-2xl
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-semibold
                        flex
                        items-center
                        gap-3
                    "

                >

                    <ShoppingCart />

                    Add Bundle To Cart

                </button>

            </div>

        </section>

    );

}

function ProductCard({

    product

}) {

    return (

        <div
            className="
                w-48
            "
        >

            <div
                className="
                    h-40
                    rounded-2xl
                    border
                    bg-gray-50
                    flex
                    items-center
                    justify-center
                    p-4
                "
            >

                <img

                    src={

                        product.imageUrl ||

                        product.variants?.[0]?.images?.[0]?.imageUrl

                    }

                    className="
                        max-h-full
                        object-contain
                    "

                />

            </div>

            <div
                className="
                    mt-4
                    font-semibold
                    line-clamp-2
                "
            >

                {product.name}

            </div>

            <div
                className="
                    mt-2
                    text-green-600
                    font-bold
                "
            >

                ₹

                {

                    Number(

                        product.price ||

                        product.variants?.[0]?.price ||

                        0

                    ).toLocaleString()

                }

            </div>

        </div>

    );

}