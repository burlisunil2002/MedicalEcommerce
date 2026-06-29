import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
//import { toast } from "react-toastify";

// Components
//import ProductBreadcrumb from "../components/productDetails/ProductBreadcrumb";
import ProductGallery from "../components/productDetails/ProductGallery";
import ImageZoomModal from "../components/productDetails/ImageZoomModal";
import ProductHeader from "../components/productDetails/ProductHeader";
//import ProductPrice from "../components/productDetails/ProductPrice";
import ProductVariantSelector from "../components/productDetails/ProductVariantSelector";
//import ProductQuantitySelector from "../components/productDetails/ProductQuantitySelector";
//import ProductActionButtons from "../components/productDetails/ProductActionButtons";
//import ProductHighlights from "../components/productDetails/ProductHighlights";
import ProductTabs from "../components/productDetails/ProductTabs";
import StickyPurchaseCard from "../components/productDetails/StickyPurchaseCard";
//import FrequentlyBoughtTogether from "../components/productDetails/FrequentlyBoughtTogether";
//import ProductCompareSection from "../components/productDetails/ProductCompareSection";
//import RelatedProducts from "../components/productDetails/RelatedProducts";
//import RecentlyViewed from "../components/productDetails/RecentlyViewed";
import MobileBottomBar from "../components/productDetails/MobileBottomBar";
import LoadingSkeleton from "../components/productDetails/LoadingSkeleton";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function ProductDetails() {

    //--------------------------------------------------------
    // Routing
    //--------------------------------------------------------

    const { id } = useParams();

    const navigate = useNavigate();

    const location = useLocation();

    //--------------------------------------------------------
    // Product States
    //--------------------------------------------------------

    const [product, setProduct] =
        useState(null);

    //--------------------------------------------------------
    // Variant States
    //--------------------------------------------------------

    const [selectedVariant, setSelectedVariant] =
        useState(null);

    const [selectedImage, setSelectedImage] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [zoomOpen, setZoomOpen] =
        useState(false);

    //--------------------------------------------------------
    // Errors
    //--------------------------------------------------------

    const [error, setError] =
        useState("");
    
    const {

        addToCart,

        loadCart

    } = useCart();

    const {

        toggleWishlist,

        isWishlisted

    } = useWishlist();
    
 
    //--------------------------------------------------------
    // Load Product
    //--------------------------------------------------------

    const loadProduct = useCallback(async () => {

        try {

            setLoading(true);

            setError("");

            const response = await API.get(

                `/api/products/${id}`

            );

            console.log("API Response:", response.data);

            const data = response.data;

            // Product
            const loadedProduct =
                data.product ?? data;

            setProduct(loadedProduct);

            console.log("Product State:", data.product);

            // Variants
            const variants =
                loadedProduct.variants || [];

            const params = new URLSearchParams(location.search);

            const variantId = Number(params.get("variant"));

            const defaultVariant =
                variants.find(
                    x => x.productVariantId === variantId
                ) ?? variants[0];

            setSelectedVariant(defaultVariant);

            // Default Image
            if (

                defaultVariant?.images?.length > 0

            ) {

                setSelectedImage(

                    defaultVariant.images[0].imageUrl

                );

            }

            else if (

                loadedProduct.imageUrl

            ) {

                setSelectedImage(

                    loadedProduct.imageUrl

                );

            }

        }

        catch (err) {

            console.log(err);

            setError(

                err.response?.data?.message ||

                "Unable to load product."

            );

        }

        finally {

            setLoading(false);

        }

    }, [

        id,

        location.search
    ]);


    const handleBuyNow = async () => {

        if (!product || !selectedVariant)
            return;

        const success = await addToCart(

            product.id,

            selectedVariant.id,

            selectedVariant.minQuantity ?? 1

        );

        console.log(selectedVariant);

        if (success) {

            await loadCart();

            navigate("/cart");

        }

    };
    
    //--------------------------------------------------------
    // Change Variant
    //--------------------------------------------------------

    const changeVariant = (variant) => {

        setSelectedVariant(variant);

        if (variant.images?.length) {

            setSelectedImage(

                variant.images[0].imageUrl

            );

        }
        else {

            setSelectedImage(

                product.imageUrl

            );

        }

        navigate(

            `/product/${product.id}?variant=${variant.productVariantId}`,

            {

                replace: true,

                preventScrollReset: true

            }

        );

    };


    //--------------------------------------------------------
    // Change Image
    //--------------------------------------------------------

    const changeImage = useCallback((image) => {

        setSelectedImage(image);

    }, []);
    //--------------------------------------------------------
    // Open Zoom
    //--------------------------------------------------------

    const openZoom = () => {

        setZoomOpen(true);

    };
    //--------------------------------------------------------
    // Close Zoom
    //--------------------------------------------------------

    const closeZoom = () => {

        setZoomOpen(false);

    };

    //--------------------------------------------------------
    // Gallery Images
    //--------------------------------------------------------

    const galleryImages = useMemo(() => {

        if (
            selectedVariant?.images?.length
        ) {

            return selectedVariant.images.map(
                x => x.imageUrl
            );

        }

        if (product?.imageUrl)
            return [product.imageUrl];

        return [];

    }, [

        product,

        selectedVariant

    ]);

    //--------------------------------------------------------
    // Current Price
    //--------------------------------------------------------

    const currentPrice = useMemo(() => {

        return Number(

            selectedVariant?.price ??

            0

        );

    }, [

        selectedVariant

    ]);

    //--------------------------------------------------------
    // Stock Status
    //--------------------------------------------------------

    const inStock = useMemo(() => {

        return (

            Number(

                selectedVariant?.stockQuantity ?? 0

            ) > 0

        );

    }, [

        selectedVariant

    ]);
    //--------------------------------------------------------
    // Next Image
    //--------------------------------------------------------

    const nextImage = () => {

        if (!galleryImages.length)
            return;

        const index =
            galleryImages.indexOf(selectedImage);

        if (
            index <
            galleryImages.length - 1
        ) {

            setSelectedImage(

                galleryImages[index + 1]

            );

        }

    };
    //--------------------------------------------------------
    // Previous Image
    //--------------------------------------------------------

    const previousImage = () => {

        if (!galleryImages.length)
            return;

        const index =
            galleryImages.indexOf(selectedImage);

        if (index > 0) {

            setSelectedImage(

                galleryImages[index - 1]

            );

        }

    };



    //--------------------------------------------------------
    // Share
    //--------------------------------------------------------

    const handleShare = async () => {

        try {

            const url =

                `${window.location.origin}/product/${product.id}?variant=${selectedVariant.id}`;

            if (navigator.share) {

                await navigator.share({

                    title: product.name,

                    text: `${product.brand} - ${selectedVariant.model}`,

                    url

                });

            }

            else {

                await navigator.clipboard.writeText(url);

                console.log("Copied");

                // toast.success("Link Copied");

            }

        }

        catch (err) {

            console.log(err);

        }

    };


    const productSchema = {

        "@context": "https://schema.org",

        "@type": "Product",

        name: product?.name,

        image: galleryImages,

        description: product?.description,

        brand: {

            "@type": "Brand",

            name: product?.brand

        }

    };

    useEffect(() => {

        loadProduct();

    }, [

        loadProduct,

    ]);



    useEffect(() => {

        if (!product)
            return;

        let items =

            JSON.parse(

                localStorage.getItem(

                    "recentProducts"

                ) || "[]"

            );

        items = items.filter(

            x => x.id !== product.id

        );

        items.unshift({

            id: product.id,

            name: product.name,

            imageUrl: product.imageUrl

        });

        if (items.length > 10)

            items = items.slice(0, 10);

        localStorage.setItem(

            "recentProducts",

            JSON.stringify(items)

        );

    }, [

        product

    ]);

    //--------------------------------------------------------
    // Scroll Top
    //--------------------------------------------------------

    useEffect(() => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }, [

        id

    ]);

    //--------------------------------------------------------
    // Keep Gallery Synced
    //--------------------------------------------------------

    useEffect(() => {

        if (!selectedVariant)
            return;

        if (

            selectedVariant.images?.length

        ) {

            setSelectedImage(

                selectedVariant.images[0].imageUrl

            );

        }

    }, [

        selectedVariant

    ]);

    //--------------------------------------------------------
    // Keyboard Navigation
    //--------------------------------------------------------

    useEffect(() => {

        const handleKeyDown = (e) => {

            if (!zoomOpen)
                return;

            switch (e.key) {

                case "ArrowRight":

                    nextImage();

                    break;

                case "ArrowLeft":

                    previousImage();

                    break;

                case "Escape":

                    closeZoom();

                    break;

                default:

                    break;

            }

        };

        window.addEventListener(

            "keydown",

            handleKeyDown

        );

        return () =>

            window.removeEventListener(

                "keydown",

                handleKeyDown

            );

    }, [

        zoomOpen,

        selectedImage,

        galleryImages

    ]);

    if (!loading && !product) {

        return (

            <div
                className="
                min-h-[70vh]
                flex
                items-center
                justify-center
                flex-col
                text-center
            "
            >

                <h1
                    className="
                    text-4xl
                    font-bold
                    text-gray-800
                "
                >

                    Product Not Found

                </h1>

                <p
                    className="
                    text-gray-500
                    mt-3
                "
                >

                    The requested product is unavailable or has been removed.

                </p>

                <button

                    onClick={() => navigate("/products")}

                    className="
                    mt-8
                    px-8
                    py-3
                    rounded-xl
                    bg-blue-600
                    text-white
                "

                >

                    Browse Products

                </button>

            </div>

        );

    }

    if (error) {

        return (

            <div
                className="
                    max-w-6xl
                    mx-auto
                    py-32
                    text-center
                "
            >

                <h2
                    className="
                        text-3xl
                        font-bold
                        text-red-600
                    "
                >

                    {error}

                </h2>

            </div>

        );

    }
    //--------------------------------------------------------
    // Loading
    //--------------------------------------------------------

    if (

        loading ||

        !product ||

        !selectedVariant

    ) {

        return <LoadingSkeleton />;

    }

    return (

        <>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productSchema)
                }}
            />

            {/* Image Zoom */}

            <ImageZoomModal

                open={zoomOpen}

                images={galleryImages}

                currentImage={selectedImage}

                setCurrentImage={changeImage}

                onClose={closeZoom}

            />

            {/* Main Container  */}

            <div className="min-h-screen bg-slate-50">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                    <div
                        className="
                mt-6
                grid
                grid-cols-1
                xl:grid-cols-12
                gap-8
                items-start
            "
                    >

                        {/* LEFT : Gallery */}

                        <div
                            className="
                    xl:col-span-4
                "
                        >

                            <ProductGallery
                                product={product}
                                selectedVariant={selectedVariant}
                                selectedImage={selectedImage}
                                setSelectedImage={changeImage}
                                openZoom={openZoom}
                            />

                        </div>

                        {/* CENTER : Product Details */}

                        <div
                            className="
                    xl:col-span-5
                    space-y-8
                "
                        >

                            <ProductHeader

                                product={product}

                                selectedVariant={selectedVariant}

                                wishlisted={

                                    isWishlisted(

                                        product.id,

                                        selectedVariant.id

                                    )

                                }

                                toggleWishlist={() =>

                                    toggleWishlist({

                                        id: product.id,

                                        variantId: selectedVariant.id,

                                        name: product.name,

                                        brand: product.brand,

                                        imageUrl:
                                            selectedVariant.images?.[0]?.imageUrl ??
                                            product.imageUrl,

                                        price: selectedVariant.price,

                                        discountPercentage: product.discountPercentage,

                                        category: product.category,
                                        gstPercentage: product.gstPercentage,

                                        selectedVariant

                                    })

                                }

                                shareProduct={handleShare}

                            />

                        </div>

                        {/* RIGHT : Sticky Purchase Card */}

                        <div
                            className="
                    xl:col-span-3
                    hidden
                    lg:block
                "
                        >

                            <StickyPurchaseCard

                                product={product}

                                selectedVariant={selectedVariant}

                                onBuyNow={handleBuyNow}

                            />

                        </div>

                    </div>

                    <div className="mt-12">

                    {

                        product?.variants?.length > 1 && (

                            <ProductVariantSelector

                                product={product}

                                variants={product.variants}

                                selectedVariant={selectedVariant}

                                onVariantChange={changeVariant}

                            />

                        )

                        }
                    </div>

                    {/* Product Tabs */}

                    <section className="mt-12">

                        <ProductTabs

                            product={product}

                            selectedVariant={selectedVariant}

                        />

                    </section>

                </div>

                <MobileBottomBar

                    product={product}

                    selectedVariant={selectedVariant}


                    onBuyNow={handleBuyNow}

                />

            </div>

            <div
                className="
min-h-screen
bg-slate-50
pb-28
lg:pb-0
"
            >
            </div>

        </>
    );
}


