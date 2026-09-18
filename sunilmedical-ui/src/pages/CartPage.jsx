
import {
    useCallback,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    useCart
} from "../context/CartContext";

import CartItem from "../components/CartItem";
import SummaryCard from "../components/SummaryCard";
import SmallCubeLoader from "../components/loader/SmallCubeLoader";


// ============================================================
// CART SKELETON
// ============================================================

function CartSkeleton() {
    return (
        <div
            className="space-y-3"
            aria-label="Loading cart"
            aria-busy="true"
        >
            {[1, 2, 3].map(index => (
                <div
                    key={index}
                    className="
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        p-4
                        sm:p-5
                        animate-pulse
                    "
                >

                    <div className="flex gap-4">

                        {/* IMAGE */}

                        <div
                            className="
                                h-24
                                w-24
                                sm:h-32
                                sm:w-32
                                shrink-0
                                rounded-xl
                                bg-gray-100
                            "
                        />

                        {/* CONTENT */}

                        <div
                            className="
                                flex-1
                                space-y-3
                            "
                        >

                            <div
                                className="
                                    h-5
                                    w-3/4
                                    rounded
                                    bg-gray-100
                                "
                            />

                            <div
                                className="
                                    h-4
                                    w-1/3
                                    rounded
                                    bg-gray-100
                                "
                            />

                            <div
                                className="
                                    h-5
                                    w-24
                                    rounded
                                    bg-gray-100
                                "
                            />

                            <div
                                className="
                                    h-9
                                    w-32
                                    rounded-lg
                                    bg-gray-100
                                "
                            />

                        </div>

                    </div>

                </div>
            ))}
        </div>
    );
}


// ============================================================
// SUMMARY SKELETON
// ============================================================

function SummarySkeleton() {
    return (
        <div
            className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
                shadow-sm
                animate-pulse
            "
            aria-label="Loading order summary"
            aria-busy="true"
        >

            <div
                className="
                    h-6
                    w-36
                    rounded
                    bg-gray-100
                "
            />

            <div className="mt-6 space-y-4">

                <div
                    className="
                        h-4
                        rounded
                        bg-gray-100
                    "
                />

                <div
                    className="
                        h-4
                        rounded
                        bg-gray-100
                    "
                />

                <div
                    className="
                        h-4
                        w-2/3
                        rounded
                        bg-gray-100
                    "
                />

                <div
                    className="
                        mt-5
                        h-12
                        rounded-xl
                        bg-gray-100
                    "
                />

            </div>

        </div>
    );
}


// ============================================================
// EMPTY CART
// ============================================================

function EmptyCart({
    onContinueShopping
}) {
    return (
        <section
            className="
                flex
                min-h-[430px]
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-gray-200
                bg-white
                px-6
                py-12
                text-center
            "
        >

            {/* ICON */}

            <div
                className="
                    flex
                    h-20
                    w-20
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                    text-4xl
                "
                aria-hidden="true"
            >
                🛒
            </div>

            {/* TITLE */}

            <h2
                className="
                    mt-6
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-gray-900
                "
            >
                Your cart is empty
            </h2>

            {/* DESCRIPTION */}

            <p
                className="
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-gray-500
                "
            >
                You haven't added any products to your cart yet.
                Explore our products and find what you need.
            </p>

            {/* BUTTON */}

            <button
                type="button"
                onClick={onContinueShopping}
                className="
                    mt-6
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-600
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    hover:bg-emerald-700
                    hover:shadow-md
                    active:scale-[0.98]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-emerald-500
                    focus:ring-offset-2
                "
            >
                Continue Shopping
            </button>

        </section>
    );
}


// ============================================================
// MAIN CART PAGE
// ============================================================

export default function CartPage() {

    const navigate =
        useNavigate();

    const [
        coupon,
        setCoupon
    ] = useState("");


    // =========================================================
    // CART CONTEXT
    // =========================================================

    const {
        items,
        summary,

        initialLoading,

        couponLoading,

        error,

        applyCoupon
    } = useCart();


    // =========================================================
    // CART STATE
    // =========================================================

    const hasItems =
        useMemo(
            () =>
                Array.isArray(items) &&
                items.length > 0,
            [items]
        );


    // =========================================================
    // NAVIGATION
    // =========================================================

    const handleCheckout =
        useCallback(() => {

            /*
             * Navigation remains synchronous.
             *
             * Backend checkout should validate:
             * - stock
             * - current price
             * - GST
             * - coupon
             * - seller
             * - quantity
             * - final payable amount
             */

            navigate(
                "/checkout"
            );

        }, [navigate]);


    const handleContinueShopping =
        useCallback(() => {

            navigate("/");

        }, [navigate]);


    const handleBack =
        useCallback(() => {

            navigate(-1);

        }, [navigate]);


    // =========================================================
    // INITIAL LOADING
    // =========================================================

    /*
     * IMPORTANT:
     *
     * Only initialLoading controls the full-page skeleton.
     *
     * Quantity changes / add / remove operations should
     * NEVER make the entire cart disappear.
     */

    if (
        initialLoading &&
        !Array.isArray(items)
    ) {
        return (
            <SmallCubeLoader
                title="Preparing Cart"
                subtitle="Loading your cart items..."
            />
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div
            className="
                min-h-screen
                bg-gray-50
            "
        >

            <div
                className="
                    mx-auto
                    w-full
                    max-w-7xl
                    px-4
                    py-5
                    sm:px-6
                    sm:py-7
                    lg:px-8
                "
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    className="
                        mb-5
                        sm:mb-7
                    "
                >

                    {/* BACK */}

                    <button
                        type="button"
                        onClick={handleBack}
                        className="
                            inline-flex
                            min-h-10
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            px-3.5
                            py-2
                            text-sm
                            font-medium
                            text-gray-700
                            shadow-sm
                            transition
                            hover:border-gray-300
                            hover:bg-gray-50
                            focus:outline-none
                            focus:ring-2
                            focus:ring-emerald-500
                            focus:ring-offset-2
                        "
                    >
                        <span
                            aria-hidden="true"
                            className="text-base"
                        >
                            ←
                        </span>

                        Back
                    </button>


                    {/* TITLE */}

                    <div className="mt-5">

                        <div
                            className="
                                flex
                                flex-wrap
                                items-end
                                gap-2
                            "
                        >

                            <h1
                                className="
                                    text-2xl
                                    sm:text-3xl
                                    font-bold
                                    tracking-tight
                                    text-gray-900
                                "
                            >
                                Shopping Cart
                            </h1>

                            {hasItems && (
                                <span
                                    className="
                                        mb-0.5
                                        rounded-full
                                        bg-gray-100
                                        px-2.5
                                        py-1
                                        text-xs
                                        font-semibold
                                        text-gray-600
                                    "
                                >
                                    {items.length}{" "}
                                    {items.length === 1
                                        ? "item"
                                        : "items"}
                                </span>
                            )}

                        </div>

                        <p
                            className="
                                mt-1.5
                                text-sm
                                leading-6
                                text-gray-500
                            "
                        >
                            Review your items before proceeding to checkout.
                        </p>

                    </div>

                </header>


                {/* =================================================
                    BACKEND SYNC MESSAGE
                ================================================= */}

                {error && hasItems && (
                    <div
                        role="status"
                        className="
                            mb-4
                            rounded-xl
                            border
                            border-amber-200
                            bg-amber-50
                            px-4
                            py-3
                            text-sm
                            text-amber-700
                        "
                    >
                        Your cart is currently shown from the latest
                        available data. We'll synchronize it automatically.
                    </div>
                )}


                {/* =================================================
                    CART CONTENT
                ================================================= */}

                <div
                    className="
                        grid
                        grid-cols-1
                        items-start
                        gap-5
                        lg:grid-cols-3
                        lg:gap-7
                    "
                >

                    {/* =================================================
                        CART ITEMS
                    ================================================= */}

                    <main
                        className="
                            min-w-0
                            lg:col-span-2
                        "
                    >

                        {!hasItems ? (

                            <EmptyCart
                                onContinueShopping={
                                    handleContinueShopping
                                }
                            />

                        ) : (

                            <section
                                aria-label="Cart items"
                            >

                                {/* ITEM COUNT */}

                                <div
                                    className="
                                        mb-3
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <p
                                        className="
                                            text-sm
                                            font-semibold
                                            text-gray-800
                                        "
                                    >
                                        Your Items
                                    </p>

                                    <p
                                        className="
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        Changes save automatically
                                    </p>

                                </div>


                                {/* ITEMS */}

                                <div
                                    className="
                                        space-y-3
                                    "
                                >

                                    {items.map(
                                        item => (
                                            <CartItem
                                                key={`
                                                    ${ item?.productId }
-
    ${ item?.variantId ?? 0 }
`}
                                                item={item}
                                            />
                                        )
                                    )}

                                </div>

                            </section>

                        )}

                    </main>


                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    {hasItems && (
                        <aside
                            className="
                                h-fit
                                lg:col-span-1
                            "
                        >

                            {/*
                             * IMPORTANT:
                             *
                             * SummaryCard is rendered continuously.
                             *
                             * Do NOT replace it with a skeleton when
                             * quantity is being updated.
                             *
                             * The optimistic CartContext state updates
                             * the summary instantly.
                             */}

                            <SummaryCard
                                summary={summary}
                                coupon={coupon}
                                setCoupon={setCoupon}
                                applyCoupon={applyCoupon}
                                couponLoading={
                                    couponLoading
                                }
                                buttonText="Proceed to Checkout"
                                onButtonClick={
                                    handleCheckout
                                }
                            />

                        </aside>
                    )}

                </div>


                {/* =================================================
                    MOBILE CHECKOUT BAR
                ================================================= */}

                {hasItems && (
                    <>

                        {/* Prevent content from hiding behind bar */}

                        <div
                            className="
                                h-20
                                lg:hidden
                            "
                        />


                        <div
                            className="
                                fixed
                                inset-x-0
                                bottom-0
                                z-40
                                border-t
                                border-gray-200
                                bg-white/95
                                px-4
                                py-3
                                shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
                                backdrop-blur
                                lg:hidden
                            "
                        >

                            <div
                                className="
                                    mx-auto
                                    flex
                                    max-w-7xl
                                    items-center
                                    gap-3
                                "
                            >

                                {/* TOTAL */}

                                <div
                                    className="
                                        min-w-0
                                        flex-1
                                    "
                                >

                                    <p
                                        className="
                                            text-[11px]
                                            text-gray-500
                                        "
                                    >
                                        Total
                                    </p>

                                    <p
                                        className="
                                            truncate
                                            text-base
                                            font-bold
                                            text-gray-900
                                            tabular-nums
                                        "
                                    >
                                        ₹
                                        {Number(
                                            summary?.total ??
                                            summary?.grandTotal ??
                                            summary?.finalTotal ??
                                            0
                                        ).toFixed(2)}
                                    </p>

                                </div>


                                {/* CHECKOUT */}

                                <button
                                    type="button"
                                    onClick={
                                        handleCheckout
                                    }
                                    className="
                                        min-h-11
                                        flex-[1.5]
                                        rounded-xl
                                        bg-emerald-600
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        shadow-sm
                                        transition
                                        hover:bg-emerald-700
                                        active:scale-[0.99]
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-emerald-500
                                        focus:ring-offset-2
                                    "
                                >
                                    Proceed to Checkout
                                </button>

                            </div>

                        </div>

                    </>
                )}


                {/* =================================================
                    SECURITY / TRUST
                ================================================= */}

                {hasItems && (
                    <div
                        className="
                            mt-8
                            hidden
                            items-center
                            justify-center
                            gap-8
                            border-t
                            border-gray-200
                            pt-6
                            text-xs
                            text-gray-500
                            sm:flex
                        "
                    >

                        <span>
                            🔒 Secure checkout
                        </span>

                        <span>
                            ✓ Trusted payment processing
                        </span>

                        <span>
                            ✓ Your cart is saved automatically
                        </span>

                    </div>
                )}

            </div>

        </div>
    );
}
