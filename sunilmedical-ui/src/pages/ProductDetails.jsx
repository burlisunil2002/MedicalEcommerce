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
import MobileBottomBar from "../components/productDetails/MobileBottomBar";
import LoadingSkeleton from "../components/productDetails/LoadingSkeleton";
import ProductPurchaseSection from "../components/productDetails/ProductPurchaseSection";
import RecommendedProducts from "../components/RecommendedProducts";

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { addToCart, loadCart } = useCart();

    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedImage, setSelectedImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const messageTimerRef = useRef(null);

    // Centralized short-lived notification.
    // Every message shown from this page disappears automatically after 2 seconds.
    const showMessage = useCallback((text) => {
        setMessage(text || "");

        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }

        if (text) {
            messageTimerRef.current = setTimeout(() => {
                showMessage("");
                messageTimerRef.current = null;
            }, 2000);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, []);

    // Load the product only when the product id changes.
    // Variant changes are handled locally so the whole page does not reload.
    const loadProduct = useCallback(async () => {
        if (!id) {
            setError("Product ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await API.get(`/api/products/${id}`);
            const loadedProduct = response?.data?.product ?? response?.data;

            if (!loadedProduct) {
                throw new Error("Product not found.");
            }

            setProduct(loadedProduct);
        } catch (err) {
            console.error("Product details error:", err);

            setProduct(null);
            setSelectedVariant(null);

            if (err?.response?.status === 404) {
                setError("Product not found.");
            } else {
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load product."
                );
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    // Resolve the variant from the URL without making another API request.
    useEffect(() => {
        if (!product) return;

        const variants = Array.isArray(product.variants)
            ? product.variants
            : [];

        if (!variants.length) {
            setSelectedVariant(null);
            return;
        }

        const params = new URLSearchParams(location.search);
        const requestedId = Number(params.get("variant"));

        const variant =
            variants.find(
                (item) =>
                    Number(item?.productVariantId ?? item?.id) === requestedId
            ) ?? variants[0];

        setSelectedVariant(variant);
    }, [product, location.search]);

    // Gallery images for the currently selected variant.
    const galleryImages = useMemo(() => {
        const images = [];

        if (Array.isArray(selectedVariant?.images)) {
            selectedVariant.images.forEach((image) => {
                if (image?.imageUrl) images.push(image.imageUrl);
            });
        }

        [
            product?.imageUrl,
            product?.imageUrl2,
            product?.imageUrl3,
            product?.imageUrl4,
        ].forEach((image) => {
            if (image) images.push(image);
        });

        return [...new Set(images.filter(Boolean))];
    }, [product, selectedVariant]);

    useEffect(() => {
        if (!product) return;

        const variantImage =
            selectedVariant?.images?.find((item) => item?.imageUrl)?.imageUrl;

        const productImage =
            product?.imageUrl ||
            product?.imageUrl2 ||
            product?.imageUrl3 ||
            product?.imageUrl4 ||
            "";

        setSelectedImage(variantImage || productImage);
    }, [product, selectedVariant]);

    const changeImage = useCallback((image) => {
        if (image) setSelectedImage(image);
    }, []);

    const currentImageIndex = useMemo(() => {
        const index = galleryImages.indexOf(selectedImage);
        return index >= 0 ? index : 0;
    }, [galleryImages, selectedImage]);

    const nextImage = useCallback(() => {
        if (galleryImages.length <= 1) return;

        setSelectedImage(
            galleryImages[(currentImageIndex + 1) % galleryImages.length]
        );
    }, [galleryImages, currentImageIndex]);

    const previousImage = useCallback(() => {
        if (galleryImages.length <= 1) return;

        setSelectedImage(
            galleryImages[
            (currentImageIndex - 1 + galleryImages.length) %
            galleryImages.length
            ]
        );
    }, [galleryImages, currentImageIndex]);

    const openZoom = useCallback(() => {
        if (galleryImages.length) setZoomOpen(true);
    }, [galleryImages.length]);

    const closeZoom = useCallback(() => {
        setZoomOpen(false);
    }, []);

    // Variant selection updates only the URL/state.
    const changeVariant = useCallback(
        (variant) => {
            if (!variant || !product) return;

            setSelectedVariant(variant);

            const variantImage =
                variant?.images?.find((item) => item?.imageUrl)?.imageUrl;

            setSelectedImage(
                variantImage ||
                product?.imageUrl ||
                product?.imageUrl2 ||
                ""
            );

            const variantId = variant?.productVariantId ?? variant?.id;

            if (!variantId) return;

            navigate(
                `/product/${product.id}?variant=${variantId}`,
                {
                    replace: true,
                    preventScrollReset: true,
                }
            );
        },
        [product, navigate]
    );

    // Buy Now uses the same cart service as the rest of the application.
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

        const quantity =
            Number(selectedVariant?.minQuantity) > 0
                ? Number(selectedVariant.minQuantity)
                : 1;

        try {
            showMessage("");

            const result = await addToCart(
                product.id,
                variantId,
                quantity
            );

            if (result === false) {
                showMessage("Unable to add product to cart.");
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

    const handleShare = useCallback(async () => {
        if (!product) return;

        const variantId =
            selectedVariant?.productVariantId ??
            selectedVariant?.id;

        const url = variantId
            ? `${window.location.origin}/product/${product.id}?variant=${variantId}`
            : `${window.location.origin}/product/${product.id}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: product?.name || "Product",
                    text:
                        selectedVariant?.model
                            ? `${product?.brand || ""} - ${selectedVariant.model}`
                            : product?.name || "Medical Product",
                    url,
                });
                return;
            }

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                showMessage("Product link copied.");
            }
        } catch (err) {
            if (err?.name !== "AbortError") {
                console.error("Share error:", err);
            }
        }
    }, [product, selectedVariant, showMessage]);

    // Recently viewed products.
    useEffect(() => {
        if (!product?.id) return;

        try {
            const stored = localStorage.getItem("recentProducts");
            let items = [];

            try {
                items = stored ? JSON.parse(stored) : [];
            } catch {
                items = [];
            }

            if (!Array.isArray(items)) items = [];

            items = items.filter(
                (item) => Number(item?.id) !== Number(product.id)
            );

            items.unshift({
                id: product.id,
                name: product.name,
                imageUrl:
                    selectedVariant?.images?.[0]?.imageUrl ||
                    product?.imageUrl ||
                    "",
            });

            localStorage.setItem(
                "recentProducts",
                JSON.stringify(items.slice(0, 10))
            );
        } catch (err) {
            console.warn("Recently viewed error:", err);
        }
    }, [product, selectedVariant]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [id]);

    useEffect(() => {
        if (!zoomOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "ArrowRight") nextImage();
            if (event.key === "ArrowLeft") previousImage();
            if (event.key === "Escape") closeZoom();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [zoomOpen, nextImage, previousImage, closeZoom]);

    const productSchema = useMemo(() => {
        if (!product) return null;

        const price = Number(
            selectedVariant?.price ??
            product?.price ??
            0
        );

        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product?.name || "",
            description: product?.description || "",
            image: galleryImages,
            brand: {
                "@type": "Brand",
                name: product?.brand || "",
            },
        };

        if (price > 0) {
            schema.offers = {
                "@type": "Offer",
                price: price.toFixed(2),
                priceCurrency: "INR",
                url: window.location.href,
            };
        }

        return schema;
    }, [product, selectedVariant, galleryImages]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6">
                    <LoadingSkeleton />
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-3xl">📦</div>

                    <h1 className="text-xl font-semibold text-slate-900">
                        Product unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error || "The requested product could not be loaded."}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/products")}
                        className="mt-6 min-h-10 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
                        __html: JSON.stringify(productSchema),
                    }}
                />
            )}

            {message && (
                <div className="fixed left-1/2 top-4 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
                        <span>{message}</span>

                        <button
                            type="button"
                            onClick={() => showMessage("")}
                            className="text-lg leading-none text-slate-300 hover:text-white"
                            aria-label="Close message"
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
                setCurrentImage={changeImage}
                onClose={closeZoom}
            />

            <main className="min-h-screen bg-slate-50 pb-24 lg:pb-8">
                <div className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
                    {/* Compact desktop hero: fixed gallery width + flexible purchase area */}
                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
                        <section className="min-w-0 w-full">
                            <div className="mx-auto w-full max-w-[390px] lg:mx-0">
                                <ProductGallery
                                    product={product}
                                    selectedVariant={selectedVariant}
                                    selectedImage={selectedImage}
                                    setSelectedImage={changeImage}
                                    openZoom={openZoom}
                                />
                            </div>
                        </section>

                        <section className="min-w-0 w-full">
                            <ProductPurchaseSection
                                product={product}
                                selectedVariant={selectedVariant}
                                onBuyNow={handleBuyNow}
                                setMessage={showMessage}
                                shareProduct={handleShare}
                            />
                        </section>
                    </div>

                    {Array.isArray(product?.variants) &&
                        product.variants.length > 1 && (
                            <section className="mt-4 sm:mt-5">
                                <ProductVariantSelector
                                    product={product}
                                    variants={product.variants}
                                    selectedVariant={selectedVariant}
                                    onVariantChange={changeVariant}
                                />
                            </section>
                        )}

                    <section className="mt-7 sm:mt-8 lg:mt-10">
                        <ProductTabs
                            product={product}
                            selectedVariant={selectedVariant}
                        />
                    </section>

                    <section className="mt-7 sm:mt-8 lg:mt-10">
                        <RecommendedProducts currentProduct={product} />
                    </section>
                </div>
            </main>

            <MobileBottomBar
                product={product}
                selectedVariant={selectedVariant}
                onBuyNow={handleBuyNow}
                setMessage={showMessage}
            />
        </>
    );
}
