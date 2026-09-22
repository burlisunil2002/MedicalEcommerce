import {
    ArrowRight,
    CheckCircle2,
    GitCompareArrows,
    ShieldCheck,
    ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ============================================================
   HELPERS
============================================================ */

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const getProductId = (product) =>
    product?.id ??
    product?.Id ??
    product?.productId ??
    product?.ProductId;

const getProductName = (product) =>
    product?.name ??
    product?.Name ??
    product?.productName ??
    product?.ProductName ??
    product?.productTitle ??
    product?.ProductTitle ??
    product?.title ??
    product?.Title ??
    "";

const getVendor = (product) =>
    product?.vendorName ??
    product?.VendorName ??
    product?.vendor ??
    product?.Vendor ??
    product?.sellerName ??
    product?.SellerName ??
    product?.seller ??
    product?.Seller ??
    product?.brand ??
    product?.Brand ??
    product?.manufacturer ??
    product?.Manufacturer ??
    "Vendor";

const getModel = (product) =>
    product?.model ??
    product?.Model ??
    product?.modelName ??
    product?.ModelName ??
    product?.variants?.[0]?.model ??
    product?.variants?.[0]?.Model ??
    product?.variants?.[0]?.modelName ??
    product?.variants?.[0]?.ModelName ??
    "Model not specified";

const getPrice = (product) =>
    product?.finalPrice ??
    product?.FinalPrice ??
    product?.sellingPrice ??
    product?.SellingPrice ??
    product?.price ??
    product?.Price ??
    product?.variants?.[0]?.finalPrice ??
    product?.variants?.[0]?.FinalPrice ??
    product?.variants?.[0]?.sellingPrice ??
    product?.variants?.[0]?.SellingPrice ??
    product?.variants?.[0]?.price ??
    product?.variants?.[0]?.Price;

const getImage = (product) =>
    product?.imageUrl ??
    product?.ImageUrl ??
    product?.image ??
    product?.Image ??
    product?.primaryImage ??
    product?.PrimaryImage ??
    product?.variants?.[0]?.images?.[0]?.imageUrl ??
    product?.variants?.[0]?.images?.[0]?.ImageUrl ??
    "/images/no-image.png";

const getVariantId = (product) =>
    product?.variants?.[0]?.productVariantId ??
    product?.variants?.[0]?.ProductVariantId ??
    product?.variants?.[0]?.id ??
    product?.variants?.[0]?.Id ??
    null;

const money = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return number.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    });
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function CompareSimilarProducts({
    currentProduct,
    products = [],
}) {
    const navigate = useNavigate();

    /* ----------------------------------------------------------
       Safety checks
    ---------------------------------------------------------- */

    if (
        !currentProduct ||
        !Array.isArray(products)
    ) {
        return null;
    }

    /* ----------------------------------------------------------
       Current product
    ---------------------------------------------------------- */

    const currentId =
        getProductId(currentProduct);

    const currentName =
        normalize(
            getProductName(
                currentProduct
            )
        );

    /*
     * Without a valid product name there is no reliable
     * same-product comparison.
     */
    if (!currentName) {
        return null;
    }

    /* ==========================================================
       FIND SAME-NAME PRODUCTS

       IMPORTANT:
       We intentionally DO NOT compare:
       - category
       - brand
       - vendor

       The user's requirement is:
       SAME PRODUCT NAME = COMPARISON
    ========================================================== */

    const alternatives = products.filter(
        (item) => {
            if (!item) {
                return false;
            }

            const itemId =
                getProductId(item);

            const itemName =
                normalize(
                    getProductName(item)
                );

            /*
             * Exclude the exact product currently being viewed.
             */
            const isCurrentProduct =
                currentId !== undefined &&
                currentId !== null &&
                String(itemId) ===
                String(currentId);

            /*
             * Match ONLY by product name.
             */
            const isSameProductName =
                itemName.length > 0 &&
                itemName === currentName;

            return (
                !isCurrentProduct &&
                isSameProductName
            );
        }
    );

    /* ----------------------------------------------------------
       No same-name products
       -> Do not render anything.
    ---------------------------------------------------------- */

    if (alternatives.length === 0) {
        return null;
    }

    /* ----------------------------------------------------------
       Remove accidental duplicate IDs.
    ---------------------------------------------------------- */

    const uniqueAlternatives = [];

    const seenIds = new Set();

    alternatives.forEach((item) => {
        const itemId =
            getProductId(item);

        const key =
            itemId !== undefined &&
                itemId !== null
                ? String(itemId)
                : `${getProductName(item)}-${uniqueAlternatives.length}`;

        if (!seenIds.has(key)) {
            seenIds.add(key);
            uniqueAlternatives.push(item);
        }
    });

    /* ----------------------------------------------------------
       Current product + maximum 4 alternatives
    ---------------------------------------------------------- */

    const comparisonProducts = [
        currentProduct,
        ...uniqueAlternatives.slice(0, 4),
    ];

    /* ==========================================================
       RENDER
    ========================================================== */

    return (
        <section
            aria-label="Compare same products"
            className="
                mt-8
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
                sm:mt-10
            "
        >
            {/* ====================================================
                HEADER
            ===================================================== */}

            <header
                className="
                    border-b
                    border-slate-200
                    bg-gradient-to-r
                    from-indigo-50
                    via-white
                    to-white
                    px-4
                    py-4
                    sm:px-6
                    sm:py-5
                "
            >
                <div className="flex items-start gap-3">

                    {/* Icon */}

                    <div
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-indigo-600
                            text-white
                            shadow-sm
                            sm:h-11
                            sm:w-11
                        "
                    >
                        <GitCompareArrows
                            size={20}
                            strokeWidth={2.2}
                        />
                    </div>

                    {/* Heading */}

                    <div className="min-w-0">

                        <p
                            className="
                                text-[10px]
                                font-extrabold
                                uppercase
                                tracking-[0.16em]
                                text-indigo-600
                            "
                        >
                            Compare products
                        </p>

                        <h2
                            className="
                                mt-1
                                text-base
                                font-extrabold
                                tracking-tight
                                text-slate-950
                                sm:text-lg
                            "
                        >
                            Compare the same product
                        </h2>

                        <p
                            className="
                                mt-1
                                max-w-2xl
                                text-xs
                                leading-5
                                text-slate-500
                                sm:text-sm
                            "
                        >
                            Compare this product with
                            other available vendors
                            offering the same product.
                        </p>

                    </div>

                </div>
            </header>

            {/* ====================================================
                PRODUCT NAME STRIP
            ===================================================== */}

            <div
                className="
                    border-b
                    border-slate-100
                    bg-slate-50/70
                    px-4
                    py-3
                    sm:px-6
                "
            >
                <div className="flex items-center gap-2">

                    <CheckCircle2
                        size={15}
                        className="shrink-0 text-indigo-600"
                    />

                    <p
                        className="
                            line-clamp-2
                            text-xs
                            font-semibold
                            leading-5
                            text-slate-700
                            sm:text-sm
                        "
                    >
                        {getProductName(
                            currentProduct
                        )}
                    </p>

                </div>
            </div>

            {/* ====================================================
                HORIZONTAL COMPARISON
            ===================================================== */}

            <div
                className="
                    overflow-x-auto
                    overscroll-x-contain
                    [scrollbar-width:thin]
                "
            >
                <div
                    className="
                        flex
                        min-w-max
                        divide-x
                        divide-slate-200
                    "
                >

                    {/* =================================================
                        DESKTOP LABEL COLUMN
                    ================================================== */}

                    <div
                        className="
                            sticky
                            left-0
                            z-20
                            hidden
                            w-28
                            shrink-0
                            bg-white
                            md:block
                        "
                    >
                        {/* Header alignment */}

                        <div className="h-[286px]" />

                        <CompareLabel>
                            Vendor
                        </CompareLabel>

                        <CompareLabel>
                            Model
                        </CompareLabel>

                        <CompareLabel>
                            Price
                        </CompareLabel>

                        <CompareLabel>
                            Product
                        </CompareLabel>
                    </div>

                    {/* =================================================
                        PRODUCT COLUMNS
                    ================================================== */}

                    {comparisonProducts.map(
                        (item, index) => {
                            const itemId =
                                getProductId(
                                    item
                                );

                            const name =
                                getProductName(
                                    item
                                ) ||
                                currentName;

                            const vendor =
                                getVendor(item);

                            const model =
                                getModel(item);

                            const price =
                                getPrice(item);

                            const image =
                                getImage(item);

                            const variantId =
                                getVariantId(
                                    item
                                );

                            const isCurrent =
                                index === 0;

                            /*
                             * Build product URL.
                             * If the alternative has a variant,
                             * preserve that variant.
                             */
                            const productUrl =
                                itemId !==
                                    undefined &&
                                    itemId !== null
                                    ? variantId
                                        ? `/product/${itemId}?variant=${variantId}`
                                        : `/product/${itemId}`
                                    : null;

                            return (
                                <article
                                    key={
                                        itemId ??
                                        `${name}-${index}`
                                    }
                                    className={`
                                        w-[218px]
                                        shrink-0
                                        bg-white
                                        sm:w-[238px]
                                        lg:w-[250px]
                                        xl:w-[260px]

                                        ${isCurrent
                                            ? "bg-indigo-50/30"
                                            : ""
                                        }
                                    `}
                                >

                                    {/* =================================
                                        PRODUCT CARD HEADER
                                    ================================== */}

                                    <div
                                        className="
                                            flex
                                            h-[286px]
                                            flex-col
                                            px-3
                                            py-3
                                            sm:px-4
                                            sm:py-4
                                        "
                                    >

                                        {/* Badge */}

                                        <div className="mb-2 min-h-[22px]">

                                            {isCurrent ? (
                                                <span
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        rounded-full
                                                        bg-indigo-100
                                                        px-2.5
                                                        py-1
                                                        text-[9px]
                                                        font-extrabold
                                                        uppercase
                                                        tracking-wide
                                                        text-indigo-700
                                                    "
                                                >
                                                    Current product
                                                </span>
                                            ) : (
                                                <span
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        rounded-full
                                                        bg-slate-100
                                                        px-2.5
                                                        py-1
                                                        text-[9px]
                                                        font-bold
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-500
                                                    "
                                                >
                                                    Compare
                                                </span>
                                            )}

                                        </div>

                                        {/* Image */}

                                        <div
                                            className="
                                                flex
                                                h-[150px]
                                                items-center
                                                justify-center
                                                overflow-hidden
                                                rounded-xl
                                                border
                                                border-slate-100
                                                bg-white
                                                p-3
                                            "
                                        >
                                            <img
                                                src={image}
                                                alt={name}
                                                loading="lazy"
                                                className="
                                                    h-full
                                                    w-full
                                                    object-contain
                                                    transition
                                                    duration-300
                                                    hover:scale-105
                                                "
                                                onError={(
                                                    event
                                                ) => {
                                                    if (
                                                        event
                                                            .currentTarget
                                                            .src
                                                            .includes(
                                                                "/images/no-image.png"
                                                            )
                                                    ) {
                                                        return;
                                                    }

                                                    event
                                                        .currentTarget
                                                        .src =
                                                        "/images/no-image.png";
                                                }}
                                            />
                                        </div>

                                        {/* Product name */}

                                        <h3
                                            className="
                                                mt-3
                                                line-clamp-2
                                                min-h-[40px]
                                                text-xs
                                                font-bold
                                                leading-5
                                                text-slate-900
                                                sm:text-sm
                                            "
                                            title={name}
                                        >
                                            {name}
                                        </h3>

                                    </div>

                                    {/* =================================
                                        VENDOR
                                    ================================== */}

                                    <CompareValue>

                                        <div
                                            className="
                                                flex
                                                min-w-0
                                                items-center
                                                gap-2
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-7
                                                    w-7
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-indigo-50
                                                    text-indigo-600
                                                "
                                            >
                                                <ShieldCheck
                                                    size={14}
                                                />
                                            </div>

                                            <div className="min-w-0">

                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-400
                                                    "
                                                >
                                                    Vendor
                                                </p>

                                                <p
                                                    className="
                                                        truncate
                                                        text-xs
                                                        font-bold
                                                        text-slate-800
                                                    "
                                                    title={
                                                        vendor
                                                    }
                                                >
                                                    {
                                                        vendor
                                                    }
                                                </p>

                                            </div>
                                        </div>

                                    </CompareValue>

                                    {/* =================================
                                        MODEL
                                    ================================== */}

                                    <CompareValue>

                                        <div className="min-w-0">

                                            <p
                                                className="
                                                    text-[9px]
                                                    font-semibold
                                                    uppercase
                                                    tracking-wider
                                                    text-slate-400
                                                "
                                            >
                                                Model
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    truncate
                                                    text-xs
                                                    font-semibold
                                                    text-slate-700
                                                "
                                                title={
                                                    model
                                                }
                                            >
                                                {
                                                    model
                                                }
                                            </p>

                                        </div>

                                    </CompareValue>

                                    {/* =================================
                                        PRICE
                                    ================================== */}

                                    <CompareValue>

                                        <div>

                                            <p
                                                className="
                                                    text-[9px]
                                                    font-semibold
                                                    uppercase
                                                    tracking-wider
                                                    text-slate-400
                                                "
                                            >
                                                Price
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    text-base
                                                    font-black
                                                    tracking-tight
                                                    text-slate-950
                                                "
                                            >
                                                {money(
                                                    price
                                                )}
                                            </p>

                                        </div>

                                    </CompareValue>

                                    {/* =================================
                                        VIEW PRODUCT
                                    ================================== */}

                                    <div
                                        className="
                                            flex
                                            min-h-[72px]
                                            items-center
                                            px-3
                                            py-3
                                            sm:px-4
                                        "
                                    >

                                        {isCurrent ? (
                                            <div
                                                className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    border
                                                    border-indigo-100
                                                    bg-indigo-50
                                                    px-3
                                                    py-2.5
                                                    text-center
                                                "
                                            >
                                                <span
                                                    className="
                                                        text-[10px]
                                                        font-bold
                                                        text-indigo-600
                                                    "
                                                >
                                                    Currently viewing
                                                </span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={
                                                    !productUrl
                                                }
                                                onClick={() => {
                                                    if (
                                                        productUrl
                                                    ) {
                                                        navigate(
                                                            productUrl
                                                        );
                                                    }
                                                }}
                                                className="
                                                    inline-flex
                                                    min-h-10
                                                    w-full
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    rounded-xl
                                                    bg-slate-950
                                                    px-3
                                                    py-2.5
                                                    text-xs
                                                    font-extrabold
                                                    text-white
                                                    shadow-sm
                                                    transition
                                                    hover:bg-indigo-600
                                                    active:scale-[0.98]
                                                    disabled:cursor-not-allowed
                                                    disabled:opacity-50
                                                "
                                            >
                                                <ShoppingCart
                                                    size={14}
                                                    strokeWidth={
                                                        2.2
                                                    }
                                                />

                                                <span>
                                                    View Product
                                                </span>

                                                <ArrowRight
                                                    size={13}
                                                />
                                            </button>
                                        )}

                                    </div>

                                </article>
                            );
                        }
                    )}

                </div>
            </div>

            {/* ====================================================
                MOBILE SCROLL HINT
            ===================================================== */}

            <div
                className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    border-t
                    border-slate-100
                    bg-slate-50
                    px-4
                    py-2.5
                    text-[10px]
                    font-semibold
                    text-slate-400
                    md:hidden
                "
            >
                <ArrowRight
                    size={12}
                />

                <span>
                    Swipe horizontally to compare
                </span>
            </div>
        </section>
    );
}

/* =============================================================
   DESKTOP COMPARISON LABEL
============================================================= */

function CompareLabel({
    children,
}) {
    return (
        <div
            className="
                flex
                min-h-[58px]
                items-center
                border-b
                border-slate-100
                px-3
                text-[9px]
                font-extrabold
                uppercase
                tracking-wider
                text-slate-400
            "
        >
            {children}
        </div>
    );
}

/* =============================================================
   DESKTOP / MOBILE COMPARISON VALUE
============================================================= */

function CompareValue({
    children,
}) {
    return (
        <div
            className="
                flex
                min-h-[58px]
                items-center
                border-b
                border-slate-100
                px-3
                sm:px-4
            "
        >
            {children}
        </div>
    );
}