import {
    ChevronLeft,
    ChevronRight,
    Heart,
    ShoppingCart,
    Eye
} from "lucide-react";

import { useRef } from "react";
import { Link } from "react-router-dom";

export default function RelatedProducts({

    products = [],

    addToCart,

    toggleWishlist

}) {

    const slider = useRef(null);

    if (!products.length)
        return null;

    const scrollLeft = () => {

        slider.current.scrollBy({

            left: -350,

            behavior: "smooth"

        });

    };

    const scrollRight = () => {

        slider.current.scrollBy({

            left: 350,

            behavior: "smooth"

        });

    };

    return (

        <section className="mt-20">

            <div className="flex justify-between items-center mb-8">

                <div>

                    <h2 className="text-3xl font-bold">

                        Customers Also Viewed

                    </h2>

                    <p className="text-gray-500 mt-2">

                        Explore similar medical products

                    </p>

                </div>

                <div className="flex gap-3">

                    <button

                        onClick={scrollLeft}

                        className="w-12 h-12 rounded-full border bg-white shadow hover:bg-blue-50"

                    >

                        <ChevronLeft />

                    </button>

                    <button

                        onClick={scrollRight}

                        className="w-12 h-12 rounded-full border bg-white shadow hover:bg-blue-50"

                    >

                        <ChevronRight />

                    </button>

                </div>

            </div>

            <div

                ref={slider}

                className="
                    flex
                    gap-6
                    overflow-x-auto
                    scroll-smooth
                    pb-2
                    no-scrollbar
                "

            >

                {

                    products.map(product => (

                        <RelatedCard

                            key={product.id}

                            product={product}

                            addToCart={addToCart}

                            toggleWishlist={toggleWishlist}

                        />

                    ))

                }

            </div>

        </section>

    );

}

function RelatedCard({

    product,

    addToCart,

    toggleWishlist

}) {

    const price =

        product.variants?.[0]?.price ||

        0;

    return (

        <div

            className="
                min-w-[290px]
                bg-white
                rounded-3xl
                shadow-lg
                border
                overflow-hidden
                hover:shadow-2xl
                transition
                flex
                flex-col
            "

        >

            <div className="relative">

                <Link

                    to={`/products/${product.id}`}

                >

                    <img

                        src={

                            product.imageUrl ||

                            product.variants?.[0]?.images?.[0]?.imageUrl

                        }

                        className="
                            h-60
                            w-full
                            object-contain
                            bg-gray-50
                            p-6
                        "

                    />

                </Link>

                {

                    product.isHotDeal &&

                    <div

                        className="
                            absolute
                            top-4
                            left-4
                            bg-red-600
                            text-white
                            text-xs
                            px-3
                            py-1
                            rounded-full
                        "

                    >

                        HOT DEAL

                    </div>

                }

                <button

                    onClick={() =>

                        toggleWishlist(product)

                    }

                    className="
                        absolute
                        top-4
                        right-4
                        bg-white
                        rounded-full
                        p-3
                        shadow
                    "

                >

                    <Heart size={20} />

                </button>

            </div>

            <div className="p-5 flex-1">

                <div className="text-sm text-blue-600 font-semibold">

                    {product.brand}

                </div>

                <h3

                    className="
                        font-bold
                        mt-2
                        line-clamp-2
                        h-14
                    "

                >

                    {product.name}

                </h3>

                <div

                    className="
                        text-green-600
                        text-2xl
                        font-bold
                        mt-4
                    "

                >

                    ₹

                    {Number(price).toLocaleString()}

                </div>

            </div>

            <div

                className="
                    p-5
                    border-t
                    grid
                    grid-cols-2
                    gap-3
                "

            >

                <button

                    onClick={() =>

                        addToCart(

                            product.id,

                            product.variants?.[0]?.productVariantId,

                            1

                        )

                    }

                    className="
                        h-11
                        rounded-xl
                        bg-blue-600
                        text-white
                        flex
                        justify-center
                        items-center
                        gap-2
                    "

                >

                    <ShoppingCart size={18} />

                </button>

                <Link

                    to={`/products/${product.id}`}

                    className="
                        h-11
                        rounded-xl
                        border
                        flex
                        justify-center
                        items-center
                        gap-2
                    "

                >

                    <Eye size={18} />

                </Link>

            </div>

        </div>

    );

}