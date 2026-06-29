import { Minus, Plus, AlertCircle } from "lucide-react";

export default function ProductQuantitySelector({

    quantity,

    setQuantity,

    selectedVariant

}) {

    if (!selectedVariant)
        return null;

    const minQty =
        Number(selectedVariant.minQuantity ?? 1);

    const maxQty =
        Number(selectedVariant.maxQuantity ?? 999999);

    const stepQty =
        Number(selectedVariant.stepQuantity ?? 1);

    const stock =
        Number(selectedVariant.stockQuantity ?? 0);

    const decrease = () => {

        if (quantity - stepQty >= minQty) {

            setQuantity(quantity - stepQty);

        }

    };

    const increase = () => {

        if (

            quantity + stepQty <= maxQty &&

            quantity + stepQty <= stock

        ) {

            setQuantity(quantity + stepQty);

        }

    };

    const onInput = (e) => {

        let value =
            Number(e.target.value);

        if (isNaN(value))
            return;

        if (value < minQty)
            value = minQty;

        if (value > maxQty)
            value = maxQty;

        if (value > stock)
            value = stock;

        setQuantity(value);

    };

    return (

        <div
            className="
                mt-8
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
            "
        >

            <div
                className="
                    flex
                    justify-between
                    items-center
                    mb-5
                "
            >

                <div>

                    <h2
                        className="
                            text-lg
                            font-bold
                        "
                    >

                        Quantity

                    </h2>

                    <p
                        className="
                            text-sm
                            text-gray-500
                        "
                    >

                        Select required quantity

                    </p>

                </div>

                {

                    stock <= 0 &&

                    <span
                        className="
                            flex
                            items-center
                            gap-2
                            text-red-600
                            text-sm
                        "
                    >

                        <AlertCircle size={18} />

                        Out of Stock

                    </span>

                }

            </div>

            <div
                className="
                    flex
                    items-center
                    gap-4
                    flex-wrap
                "
            >

                <div
                    className="
                        flex
                        items-center
                        border
                        rounded-2xl
                        overflow-hidden
                    "
                >

                    <button

                        type="button"

                        onClick={decrease}

                        disabled={
                            quantity <= minQty
                        }

                        className="
                            w-12
                            h-12
                            flex
                            items-center
                            justify-center
                            hover:bg-gray-100
                            disabled:opacity-30
                        "

                    >

                        <Minus size={18} />

                    </button>

                    <input

                        type="number"

                        value={quantity}

                        onChange={onInput}

                        className="
                            w-20
                            text-center
                            outline-none
                            font-bold
                        "

                    />

                    <button

                        type="button"

                        onClick={increase}

                        disabled={

                            quantity >= maxQty ||

                            quantity >= stock

                        }

                        className="
                            w-12
                            h-12
                            flex
                            items-center
                            justify-center
                            hover:bg-gray-100
                            disabled:opacity-30
                        "

                    >

                        <Plus size={18} />

                    </button>

                </div>

                <div
                    className="
                        grid
                        grid-cols-3
                        gap-3
                        text-sm
                    "
                >

                    <Info
                        title="Min"
                        value={minQty}
                    />

                    <Info
                        title="Step"
                        value={stepQty}
                    />

                    <Info
                        title="Max"
                        value={maxQty}
                    />

                </div>

            </div>

            {

                quantity > stock &&

                <div
                    className="
                        mt-4
                        text-red-600
                        text-sm
                    "
                >

                    Only {stock} items available.

                </div>

            }

        </div>

    );

}

function Info({

    title,

    value

}) {

    return (

        <div
            className="
                rounded-xl
                border
                bg-gray-50
                px-4
                py-3
                text-center
            "
        >

            <div
                className="
                    text-xs
                    text-gray-500
                "
            >

                {title}

            </div>

            <div
                className="
                    font-bold
                    mt-1
                "
            >

                {value}

            </div>

        </div>

    );

}