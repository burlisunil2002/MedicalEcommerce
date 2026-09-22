import {
    useEffect,
    useState
} from "react";

import {
    Heart,
    Share2,
    ShoppingCart,
    Zap,
    Plus,
    Minus,
    Loader2,
    ShieldCheck,
    Truck,
    ReceiptText,
    PackageCheck
} from "lucide-react";

import {
    useWishlist
} from "../../context/WishlistContext";

import {
    useCart
} from "../../context/CartContext";


const money = value =>
    Number(value || 0).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );


export default function ProductPurchaseSection({

    product,

    selectedVariant,

    onBuyNow,

    setMessage,

    shareProduct

}) {


    const {
        toggleWishlist,
        isWishlisted
    } = useWishlist();


    const {
        addToCart,
        updateCart,
        getQty
    } = useCart();


    if (!product)
        return null;


    const variantId =
        selectedVariant?.productVariantId ??
        selectedVariant?.id ??
        null;


    const price =
        Number(
            selectedVariant?.price ??
            product?.price ??
            0
        );


    const discount =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    product?.discountPercentage ??
                    0
                )
            )
        );


    const finalPrice =
        discount > 0
            ? price -
            (
                price *
                discount
            ) /
            100
            : price;


    /*
     * IMPORTANT
     *
     * CartContext signature:
     *
     * getQty(productId, variantId)
     *
     */

    const cartQty =
        variantId
            ? Number(
                getQty?.(
                    product.id,
                    variantId
                ) || 0
            )
            : 0;


    const [
        localQty,
        setLocalQty
    ] = useState(cartQty);


    const [
        busy,
        setBusy
    ] = useState(false);


    useEffect(() => {

        setLocalQty(cartQty);

    }, [
        cartQty,
        variantId,
        product.id
    ]);


    const quantity =
        localQty;


    const inCart =
        quantity > 0;


    const minQty =
        Number(
            selectedVariant?.minQuantity
        ) > 0
            ? Number(
                selectedVariant.minQuantity
            )
            : 1;


    const stockValue =
        selectedVariant?.stockQuantity ??
        product?.stockQuantity;


    const hasStock =
        stockValue !== null &&
        stockValue !== undefined &&
        stockValue !== "";


    const stock =
        hasStock
            ? Number(stockValue)
            : null;


    const outOfStock =
        stock !== null &&
        !Number.isNaN(stock) &&
        stock <= 0;


    const wishlistActive =
        variantId
            ? isWishlisted(
                product.id,
                variantId
            )
            : false;


    /* =========================================================
       WISHLIST
    ========================================================= */

    const handleWishlist =
        async () => {

            if (!variantId) {

                setMessage?.(
                    "Please select a model first."
                );

                return;
            }


            try {

                await toggleWishlist({

                    id:
                        product.id,

                    variantId,

                    name:
                        product.name,

                    brand:
                        product.brand,

                    imageUrl:
                        selectedVariant
                            ?.images?.[0]
                            ?.imageUrl ??
                        product.imageUrl,

                    price,

                    discountPercentage:
                        discount,

                    category:
                        product.category,

                    gstPercentage:
                        product.gstPercentage,

                    selectedVariant

                });


                setMessage?.(
                    wishlistActive
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                );

            } catch (error) {

                console.error(
                    "Wishlist error:",
                    error
                );

                setMessage?.(
                    "Unable to update wishlist."
                );

            }

        };


    /* =========================================================
       ADD TO CART
    ========================================================= */

    const handleAddToCart =
        async () => {

            if (busy)
                return;


            if (
                Array.isArray(
                    product.variants
                ) &&
                product.variants.length > 0 &&
                !variantId
            ) {

                setMessage?.(
                    "Please select a model first."
                );

                return;
            }


            if (outOfStock) {

                setMessage?.(
                    "This product is currently unavailable."
                );

                return;
            }


            setBusy(true);


            /*
             * OPTIMISTIC UI
             *
             * Button changes immediately.
             */

            const optimisticQty =
                Math.max(
                    quantity,
                    cartQty,
                    0
                ) +
                minQty;


            setLocalQty(
                optimisticQty
            );


            try {

                const result =
                    await addToCart(
                        product.id,
                        variantId,
                        minQty
                    );


                if (result === false) {

                    setLocalQty(
                        cartQty
                    );

                    setMessage?.(
                        "Unable to add product to cart."
                    );

                    return;
                }


                setMessage?.(
                    `Added to cart • ${optimisticQty} item${optimisticQty === 1
                        ? ""
                        : "s"
                    }`
                );

            } catch (error) {

                console.error(
                    "Add to cart error:",
                    error
                );

                setLocalQty(
                    cartQty
                );

                setMessage?.(
                    error?.response
                        ?.data
                        ?.message ||
                    "Unable to add product to cart."
                );

            } finally {

                setBusy(false);

            }

        };


    /* =========================================================
       QUANTITY
    ========================================================= */

    const changeQuantity =
        async nextQty => {

            if (
                busy ||
                !variantId
            )
                return;


            /*
             * CartContext updateCart requires
             * quantity >= 1.
             *
             * Therefore quantity stops at 1.
             */

            const safeQty =
                Math.max(
                    1,
                    Number(nextQty)
                );


            if (
                stock !== null &&
                !Number.isNaN(stock) &&
                safeQty > stock
            ) {

                setMessage?.(
                    `Only ${stock} items are available.`
                );

                return;
            }


            setLocalQty(
                safeQty
            );


            setBusy(true);


            try {

                const result =
                    await updateCart(
                        product.id,
                        variantId,
                        safeQty
                    );


                if (result === false) {

                    setLocalQty(
                        cartQty
                    );

                    setMessage?.(
                        "Unable to update quantity."
                    );

                }

            } catch (error) {

                console.error(
                    "Quantity update error:",
                    error
                );

                setLocalQty(
                    cartQty
                );

                setMessage?.(
                    "Unable to update quantity."
                );

            } finally {

                setBusy(false);

            }

        };


    return (

        <article className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">


            {/* =====================================================
                PRODUCT INFORMATION
            ====================================================== */}

            <div className="flex-1 px-5 py-5 sm:px-6 sm:py-6">


                <div className="flex items-start justify-between gap-4">


                    <div className="min-w-0">


                        {product.brand && (

                            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-indigo-600 sm:text-[11px]">

                                {product.brand}

                            </p>

                        )}


                        <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight text-slate-950 sm:text-[28px]">

                            {product.name}

                        </h1>


                        {selectedVariant?.model && (

                            <p className="mt-2 text-sm text-slate-500">

                                Model:

                                <span className="ml-1 font-bold text-slate-800">

                                    {selectedVariant.model}

                                </span>

                            </p>

                        )}

                    </div>


                    <div className="flex shrink-0 gap-2">


                        <button

                            type="button"

                            onClick={
                                handleWishlist
                            }

                            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${wishlistActive

                                    ? "border-pink-200 bg-pink-50 text-pink-500"

                                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                                }`}

                            aria-label="Wishlist"

                        >

                            <Heart

                                size={18}

                                fill={
                                    wishlistActive
                                        ? "currentColor"
                                        : "none"
                                }

                            />

                        </button>


                        <button

                            type="button"

                            onClick={
                                shareProduct
                            }

                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"

                            aria-label="Share"

                        >

                            <Share2 size={17} />

                        </button>

                    </div>

                </div>


                {/* =================================================
                    PRICE
                ================================================== */}

                <div className="my-5 border-y border-slate-100 py-4">


                    <div className="flex flex-wrap items-end gap-3">


                        <span className="text-[30px] font-black tracking-tight text-slate-950 sm:text-[36px]">

                            {money(
                                finalPrice
                            )}

                        </span>


                        {discount > 0 && (

                            <>

                                <span className="pb-1 text-xs text-slate-400 line-through">

                                    {money(price)}

                                </span>


                                <span className="mb-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">

                                    {discount}% OFF

                                </span>

                            </>

                        )}

                    </div>


                    {discount > 0 && (

                        <p className="mt-1 text-xs font-semibold text-emerald-700">

                            You save{" "}

                            {money(
                                price -
                                finalPrice
                            )}

                        </p>

                    )}


                    <p className="mt-1.5 text-[11px] text-slate-400">

                        Inclusive of applicable taxes

                    </p>

                </div>


                {/* =================================================
                    PURCHASE ACTION
                ================================================== */}

                <div className="mt-4">


                    <div className="mb-2 flex items-center justify-between">

                        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">

                            Purchase

                        </span>


                        {inCart && (

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">

                                ✓ In Cart

                            </span>

                        )}

                    </div>


                    <div className="grid grid-cols-2 gap-3">


                        {/* =================================================
                            ADD TO CART → QUANTITY
                        ================================================== */}

                        {!inCart ? (

                            <button

                                type="button"

                                onClick={
                                    handleAddToCart
                                }

                                disabled={
                                    busy ||
                                    outOfStock
                                }

                                className="col-span-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-extrabold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.99] disabled:opacity-60"

                            >

                                {busy ? (

                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />

                                ) : (

                                    <ShoppingCart
                                        size={17}
                                    />

                                )}

                                <span className="hidden sm:inline">

                                    {busy
                                        ? "Adding..."
                                        : "Add to Cart"}

                                </span>

                                <span className="sm:hidden">

                                    {busy
                                        ? "Adding"
                                        : "Add"}

                                </span>

                            </button>

                        ) : (

                            <div className="col-span-1 flex h-12 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50">


                                <button

                                    type="button"

                                    onClick={() =>
                                        changeQuantity(
                                            quantity - 1
                                        )
                                    }

                                    disabled={
                                        busy ||
                                        quantity <= 1
                                    }

                                    className="flex w-11 shrink-0 items-center justify-center text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"

                                    aria-label="Decrease quantity"

                                >

                                    <Minus
                                        size={16}
                                    />

                                </button>


                                <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 border-x border-indigo-200 text-sm font-extrabold text-slate-900">

                                    {busy ? (

                                        <Loader2
                                            size={16}
                                            className="animate-spin text-indigo-600"
                                        />

                                    ) : (

                                        <>

                                            <ShoppingCart
                                                size={15}
                                                className="text-indigo-600"
                                            />

                                            <span>

                                                {quantity}

                                            </span>

                                            <span className="hidden text-[10px] font-semibold text-slate-500 sm:inline">

                                                in cart

                                            </span>

                                        </>

                                    )}

                                </div>


                                <button

                                    type="button"

                                    onClick={() =>
                                        changeQuantity(
                                            quantity + 1
                                        )
                                    }

                                    disabled={
                                        busy ||
                                        (
                                            stock !== null &&
                                            quantity >= stock
                                        )
                                    }

                                    className="flex w-11 shrink-0 items-center justify-center text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"

                                    aria-label="Increase quantity"

                                >

                                    <Plus
                                        size={16}
                                    />

                                </button>

                            </div>

                        )}


                        {/* =================================================
                            BUY NOW
                        ================================================== */}

                        <button
                            type="button"
                            onClick={onBuyNow}
                            disabled={busy || outOfStock}
                            className="
        col-span-1
        inline-flex
        h-12
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-slate-950
        px-3
        text-sm
        font-extrabold
        text-white
        shadow-lg
        shadow-slate-900/10
        transition
        hover:bg-indigo-700
        active:scale-[0.99]
        disabled:cursor-not-allowed
        disabled:opacity-60
    "
                        >
                            <Zap size={17} />
                            <span>Buy Now</span>
                        </button>

                    </div>


                    {inCart && (

                        <p className="mt-2 text-[10px] text-slate-400">

                            Quantity is synchronized with your cart automatically.

                        </p>

                    )}

                </div>

            </div>


            {/* =====================================================
                TRUST BAR
            ====================================================== */}

            <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/80 sm:grid-cols-4">


                <TrustItem
                    icon={ShieldCheck}
                    title="Secure Purchase"
                    text="Protected checkout"
                />


                <TrustItem
                    icon={Truck}
                    title="Reliable Delivery"
                    text="Trackable orders"
                />


                <TrustItem
                    icon={ReceiptText}
                    title="GST Invoice"
                    text="Clear billing"
                />


                <TrustItem
                    icon={PackageCheck}
                    title="Medical Products"
                    text="Quality-focused supply"
                />

            </div>

        </article>

    );

}


function TrustItem({
    icon: Icon,
    title,
    text
}) {

    return (

        <div className="flex min-h-[58px] items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">

                <Icon size={15} />

            </div>

            <div className="min-w-0">

                <p className="truncate text-[10px] font-extrabold text-slate-800">

                    {title}

                </p>

                <p className="truncate text-[9px] text-slate-500">

                    {text}

                </p>

            </div>

        </div>

    );

}