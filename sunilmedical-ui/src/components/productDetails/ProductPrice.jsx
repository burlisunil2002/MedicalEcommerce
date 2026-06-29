import {
    BadgeIndianRupee,
    Package,
    Truck,
    ShieldCheck,
    TrendingDown
} from "lucide-react";

export default function ProductPrice({

    product,

    selectedVariant

}) {

    const price =
        Number(selectedVariant?.price ?? 0);

    const discount =
        Number(product?.discountPercentage ?? 0);

    const finalPrice =
        discount > 0
            ? price - (price * discount / 100)
            : price;

    const saving =
        price - finalPrice;

    const stock =
        selectedVariant?.stockQuantity ?? 0;

    const isRFQ =
        product?.priceType !== "Normal";

    return (

        <div
            className="
                mt-6
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
            "
        >

            {/* PRICE */}

            {

                isRFQ ?

                    (

                        <div>

                            <div
                                className="
                                    text-2xl
                                    font-bold
                                    text-orange-600
                                "
                            >

                                Price on Request

                            </div>

                            <p
                                className="
                                    text-sm
                                    text-gray-500
                                    mt-2
                                "
                            >

                                Contact us to receive
                                the latest quotation.

                            </p>

                        </div>

                    )

                    :

                    (

                        <>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <BadgeIndianRupee
                                    className="text-green-600"
                                />

                                <span
                                    className="
                                        text-4xl
                                        font-bold
                                    "
                                >

                                    ₹{finalPrice.toLocaleString()}

                                </span>

                            </div>

                            {

                                discount > 0 &&

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-4
                                        mt-3
                                    "
                                >

                                    <span
                                        className="
                                            line-through
                                            text-gray-400
                                        "
                                    >

                                        ₹{price.toLocaleString()}

                                    </span>

                                    <span
                                        className="
                                            bg-red-100
                                            text-red-600
                                            px-3
                                            py-1
                                            rounded-full
                                            text-sm
                                            font-semibold
                                        "
                                    >

                                        {discount}% OFF

                                    </span>

                                    <span
                                        className="
                                            text-green-700
                                            text-sm
                                        "
                                    >

                                        Save ₹{saving.toLocaleString()}

                                    </span>

                                </div>

                            }

                        </>

                    )

            }

            {/* GST */}

            <div
                className="
                    mt-4
                    text-sm
                    text-green-600
                "
            >

                Inclusive of GST ({product.gstPercentage}%)

            </div>

            {/* INFO GRID */}

            <div
                className="
                    mt-8
                    grid
                    md:grid-cols-2
                    gap-4
                "
            >

                <Info

                    icon={<Truck size={18} />}

                    title="Dispatch"

                    value="Within 2 Working Days"

                />

                <Info

                    icon={<TrendingDown size={18} />}

                    title="Minimum Order"

                    value={
                        selectedVariant?.minQuantity ??
                        1
                    }

                />

                <Info

                    icon={<ShieldCheck size={18} />}

                    title="GST Invoice"

                    value="Available"

                />

            </div>

        </div>

    );

}

function Info({

    icon,

    title,

    value

}) {

    return (

        <div
            className="
                rounded-xl
                bg-gray-50
                border
                p-4
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-2
                    text-blue-600
                "
            >

                {icon}

                <span
                    className="
                        text-xs
                        font-medium
                    "
                >

                    {title}

                </span>

            </div>

            <div
                className="
                    mt-2
                    font-semibold
                "
            >

                {value}

            </div>

        </div>

    );

}