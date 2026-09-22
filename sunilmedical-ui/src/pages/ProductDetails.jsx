import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import API from "../services/api";
import { useCart } from "../context/CartContext";

import ProductGallery from "../components/productDetails/ProductGallery";
import ImageZoomModal from "../components/productDetails/ImageZoomModal";
import ProductVariantSelector from "../components/productDetails/ProductVariantSelector";
import ProductTabs from "../components/productDetails/ProductTabs";
import ProductPurchaseSection from "../components/productDetails/ProductPurchaseSection";
import CompareSimilarProducts from "../components/productDetails/CompareSimilarProducts";
import RecommendedProducts from "../components/RecommendedProducts";
import LoadingSkeleton from "../components/productDetails/LoadingSkeleton";

export default function ProductDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        addToCart,
        loadCart
    } = useCart();

    const [product, setProduct] = useState(null);
    const [allProducts, setAllProducts] = useState([]);

    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedImage, setSelectedImage] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [zoomOpen, setZoomOpen] = useState(false);
    const [message, setMessage] = useState("");

    const messageTimerRef = useRef(null);


    /* =========================================================
       FAST TOAST
    ========================================================= */

    const showMessage = useCallback((text) => {

        setMessage(text || "");

        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }

        if (text) {

            messageTimerRef.current = setTimeout(() => {

                setMessage("");

                messageTimerRef.current = null;

            }, 1800);

        }

    }, []);


    useEffect(() => {

        return () => {

            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }

        };

    }, []);


    /* =========================================================
       LOAD PRODUCT + CATALOGUE
    ========================================================= */

    const loadProduct = useCallback(async () => {

        if (!id) {

            setError("Product ID is missing.");
            setLoading(false);

            return;
        }

        try {

            setLoading(true);
            setError("");

            const [
                productResponse,
                catalogueResponse
            ] = await Promise.allSettled([

                API.get(`/api/products/${id}`),

                API.get("/api/products")

            ]);


            if (
                productResponse.status !==
                "fulfilled"
            ) {

                throw productResponse.reason;

            }


            const loadedProduct =
                productResponse.value?.data?.product ??
                productResponse.value?.data;


            if (!loadedProduct) {

                throw new Error(
                    "Product not found."
                );

            }


            setProduct(loadedProduct);


            if (
                catalogueResponse.status ===
                "fulfilled"
            ) {

                const data =
                    catalogueResponse.value?.data;


                const list =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.products)
                            ? data.products
                            : [];


                setAllProducts(list);

            } else {

                setAllProducts([]);

            }

        } catch (err) {

            console.error(
                "Product Details Error:",
                err
            );

            setProduct(null);

            setSelectedVariant(null);

            setError(
                err?.response?.status === 404
                    ? "Product not found."
                    : err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load product."
            );

        } finally {

            setLoading(false);

        }

    }, [id]);


    useEffect(() => {

        loadProduct();

    }, [loadProduct]);


    /* =========================================================
       VARIANTS
    ========================================================= */

    const variants = useMemo(() => {

        return Array.isArray(product?.variants)
            ? product.variants
            : [];

    }, [product]);


    useEffect(() => {

        if (!product) return;


        if (!variants.length) {

            setSelectedVariant(null);

            return;
        }


        const requestedVariantId =
            Number(
                new URLSearchParams(
                    location.search
                ).get("variant")
            );


        const variant =
            variants.find(
                item =>
                    Number(
                        item?.productVariantId ??
                        item?.id
                    ) ===
                    requestedVariantId
            ) ??
            variants[0];


        setSelectedVariant(variant);

    }, [
        product,
        variants,
        location.search
    ]);


    /* =========================================================
       GALLERY
    ========================================================= */

    const galleryImages = useMemo(() => {

        const images = [];


        if (
            Array.isArray(
                selectedVariant?.images
            )
        ) {

            selectedVariant.images.forEach(
                image => {

                    if (image?.imageUrl) {

                        images.push(
                            image.imageUrl
                        );

                    }

                }
            );

        }


        [
            product?.imageUrl,
            product?.imageUrl2,
            product?.imageUrl3,
            product?.imageUrl4
        ].forEach(image => {

            if (image) {
                images.push(image);
            }

        });


        return [
            ...new Set(
                images.filter(Boolean)
            )
        ];

    }, [
        product,
        selectedVariant
    ]);


    useEffect(() => {

        if (!galleryImages.length) {

            setSelectedImage("");

            return;
        }


        setSelectedImage(current => {

            if (
                current &&
                galleryImages.includes(current)
            ) {

                return current;

            }

            return galleryImages[0];

        });

    }, [galleryImages]);


    const currentImageIndex =
        Math.max(
            0,
            galleryImages.indexOf(
                selectedImage
            )
        );


    const nextImage = useCallback(() => {

        if (galleryImages.length <= 1)
            return;


        setSelectedImage(
            galleryImages[
            (
                currentImageIndex + 1
            ) %
            galleryImages.length
            ]
        );

    }, [
        galleryImages,
        currentImageIndex
    ]);


    const previousImage =
        useCallback(() => {

            if (galleryImages.length <= 1)
                return;


            setSelectedImage(
                galleryImages[
                (
                    currentImageIndex -
                    1 +
                    galleryImages.length
                ) %
                galleryImages.length
                ]
            );

        }, [
            galleryImages,
            currentImageIndex
        ]);


    /* =========================================================
       VARIANT CHANGE
    ========================================================= */

    const changeVariant =
        useCallback(
            variant => {

                if (!variant || !product)
                    return;


                setSelectedVariant(
                    variant
                );


                const image =
                    variant?.images?.find(
                        item =>
                            item?.imageUrl
                    )?.imageUrl;


                if (image) {

                    setSelectedImage(
                        image
                    );

                }


                const variantId =
                    variant?.productVariantId ??
                    variant?.id;


                if (variantId) {

                    navigate(
                        `/product/${product.id}?variant=${variantId}`,
                        {
                            replace: true,
                            preventScrollReset: true
                        }
                    );

                }

            },
            [
                product,
                navigate
            ]
        );


    /* =========================================================
       BUY NOW
    ========================================================= */

    // ============================================================
    // BUY NOW
    // IMPORTANT:
    // Buy Now ALWAYS starts with exactly 1 unit.
    // It must NOT use the current cart quantity or minQuantity.
    // ============================================================
    const handleBuyNow = useCallback(async () => {
        if (!product) {
            showMessage("Product information is unavailable.");
            return;
        }

        const variants = Array.isArray(product.variants)
            ? product.variants
            : [];

        const hasVariants = variants.length > 0;

        if (hasVariants && !selectedVariant) {
            showMessage("Please select a variant.");
            return;
        }

        const variantId =
            selectedVariant?.productVariantId ??
            selectedVariant?.id ??
            null;

        if (hasVariants && !variantId) {
            showMessage("Please select a valid variant.");
            return;
        }

        const stockValue =
            selectedVariant?.stockQuantity ??
            product?.stockQuantity;

        if (
            stockValue !== null &&
            stockValue !== undefined &&
            stockValue !== ""
        ) {
            const stock = Number(stockValue);

            if (!Number.isNaN(stock) && stock <= 0) {
                showMessage("This product is currently out of stock.");
                return;
            }
        }

        // ========================================================
        // CRITICAL:
        // Buy Now ALWAYS uses exactly ONE item.
        // Do NOT use:
        // - cart quantity
        // - selectedVariant.minQuantity
        // - existing cart quantity
        // ========================================================
        const buyNowQuantity = 1;

        try {
            showMessage("");

            const result = await addToCart(
                product.id,
                variantId,
                buyNowQuantity
            );

            if (result === false) {
                showMessage("Unable to proceed with Buy Now.");
                return;
            }

            await loadCart();

            navigate("/cart");
        } catch (err) {
            console.error("Buy Now error:", err);

            showMessage(
                err?.response?.data?.message ||
                "Unable to proceed. Please try again."
            );
        }
    }, [
        product,
        selectedVariant,
        addToCart,
        loadCart,
        navigate,
        showMessage,
    ]);


    /* =========================================================
       SHARE
    ========================================================= */

    const handleShare =
        useCallback(async () => {

            if (!product)
                return;


            const variantId =
                selectedVariant?.productVariantId ??
                selectedVariant?.id;


            const url =
                variantId
                    ? `${window.location.origin}/product/${product.id}?variant=${variantId}`
                    : `${window.location.origin}/product/${product.id}`;


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            product.name ||
                            "Medical Product",

                        text:
                            selectedVariant?.model
                                ? `${product.brand || ""} - ${selectedVariant.model}`
                                : product.name,

                        url

                    });

                    return;
                }


                await navigator.clipboard?.writeText(
                    url
                );


                showMessage(
                    "Product link copied."
                );

            } catch (err) {

                if (
                    err?.name !==
                    "AbortError"
                ) {

                    console.error(
                        "Share error:",
                        err
                    );

                }

            }

        }, [
            product,
            selectedVariant,
            showMessage
        ]);


    /* =========================================================
       RECENTLY VIEWED
    ========================================================= */

    useEffect(() => {

        if (!product?.id)
            return;


        try {

            const old =
                JSON.parse(
                    localStorage.getItem(
                        "recentProducts"
                    ) || "[]"
                );


            const items =
                Array.isArray(old)
                    ? old
                    : [];


            const next = [

                {
                    id: product.id,

                    name: product.name,

                    imageUrl:
                        selectedVariant
                            ?.images?.[0]
                            ?.imageUrl ||
                        product.imageUrl ||
                        ""
                },

                ...items.filter(
                    item =>
                        Number(item?.id) !==
                        Number(product.id)
                )

            ].slice(0, 10);


            localStorage.setItem(
                "recentProducts",
                JSON.stringify(next)
            );

        } catch {

            // non-critical

        }

    }, [
        product,
        selectedVariant
    ]);


    /* =========================================================
       SCROLL
    ========================================================= */

    useEffect(() => {

        window.scrollTo({
            top: 0,
            behavior: "auto"
        });

    }, [id]);


    /* =========================================================
       PRODUCT SEO
    ========================================================= */

    const productSchema =
        useMemo(() => {

            if (!product)
                return null;


            const price =
                Number(
                    selectedVariant?.price ??
                    product?.price ??
                    0
                );


            const schema = {

                "@context":
                    "https://schema.org",

                "@type":
                    "Product",

                name:
                    product.name || "",

                description:
                    product.description || "",

                image:
                    galleryImages,

                brand: {

                    "@type":
                        "Brand",

                    name:
                        product.brand || ""

                }

            };


            if (price > 0) {

                schema.offers = {

                    "@type":
                        "Offer",

                    price:
                        price.toFixed(2),

                    priceCurrency:
                        "INR",

                    url:
                        window.location.href

                };

            }


            return schema;

        }, [
            product,
            selectedVariant,
            galleryImages
        ]);


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <main className="min-h-screen bg-[#f6f8fb]">

                <div className="mx-auto max-w-[1280px] px-3 py-5 sm:px-5 lg:px-6">

                    <LoadingSkeleton />

                </div>

            </main>

        );

    }


    /* =========================================================
       ERROR
    ========================================================= */

    if (error || !product) {

        return (

            <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fb] px-4">

                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                        📦
                    </div>

                    <h1 className="mt-5 text-xl font-extrabold text-slate-950">
                        Product unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error ||
                            "The requested product could not be loaded."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/products")
                        }
                        className="mt-6 h-11 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                        Browse Products
                    </button>

                </div>

            </main>

        );

    }


    return (

        <>

            {productSchema && (

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html:
                            JSON.stringify(
                                productSchema
                            )
                    }}
                />

            )}


            {/* =====================================================
                FAST TOAST
            ====================================================== */}

            {message && (

                <div className="fixed inset-x-3 top-4 z-[9999] flex justify-center">

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">

                        <span className="h-2 w-2 rounded-full bg-emerald-400" />

                        {message}

                        <button
                            type="button"
                            onClick={() =>
                                setMessage("")
                            }
                            className="ml-2 text-slate-400 hover:text-white"
                        >
                            ×
                        </button>

                    </div>

                </div>

            )}


            <ImageZoomModal

                open={zoomOpen}

                images={galleryImages}

                currentImage={selectedImage}

                setCurrentImage={
                    setSelectedImage
                }

                onClose={() =>
                    setZoomOpen(false)
                }

            />


            <main className="min-h-screen bg-[#f6f8fb]">

                <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6">

                    {/* =================================================
                        HERO
                    ================================================== */}

                    <div className="grid items-stretch gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">

                        <div className="min-w-0">

                            <ProductGallery

                                product={product}

                                selectedVariant={
                                    selectedVariant
                                }

                                selectedImage={
                                    selectedImage
                                }

                                setSelectedImage={
                                    setSelectedImage
                                }

                                openZoom={() =>
                                    setZoomOpen(true)
                                }

                                onNext={
                                    nextImage
                                }

                                onPrevious={
                                    previousImage
                                }

                            />

                        </div>


                        <div className="min-w-0">

                            <ProductPurchaseSection

                                product={product}

                                selectedVariant={
                                    selectedVariant
                                }

                                onBuyNow={
                                    handleBuyNow
                                }

                                setMessage={
                                    showMessage
                                }

                                shareProduct={
                                    handleShare
                                }

                            />

                        </div>

                    </div>


                    {/* =================================================
                        MODELS
                    ================================================== */}

                    {variants.length > 1 && (

                        <div className="mt-5">

                            <ProductVariantSelector

                                product={product}

                                variants={variants}

                                selectedVariant={
                                    selectedVariant
                                }

                                onVariantChange={
                                    changeVariant
                                }

                            />

                        </div>

                    )}


                    {/* =================================================
                        TABS
                    ================================================== */}

                    <div className="mt-7">

                        <ProductTabs

                            product={product}

                            selectedVariant={
                                selectedVariant
                            }

                        />

                    </div>


                    {/* =================================================
                        COMPARISON
                    ================================================== */}

                    <div className="mt-7">

                        <CompareSimilarProducts

                            currentProduct={
                                product
                            }

                            products={
                                allProducts
                            }

                        />

                    </div>


                    {/* =================================================
                        RECOMMENDATIONS
                    ================================================== */}

                    <div className="mt-7">

                        <RecommendedProducts

                            currentProduct={
                                product
                            }

                            products={
                                allProducts
                            }

                        />

                    </div>

                </div>

            </main>

        </>

    );

}