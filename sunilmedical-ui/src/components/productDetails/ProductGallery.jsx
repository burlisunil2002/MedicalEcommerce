
import { useEffect, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Expand,
    Image as ImageIcon,
} from "lucide-react";

export default function ProductGallery({
    product,
    selectedVariant,
    selectedImage,
    setSelectedImage,
    openZoom,
}) {
    // Only use images belonging to the currently selected variant.
    // Never use product.imageUrl or product-level image fields here.
    const images = useMemo(() => {
        const variantImages = selectedVariant?.images;

        if (!Array.isArray(variantImages)) return [];

        return [
            ...new Set(
                variantImages
                    .map((image) =>
                        typeof image === "string"
                            ? image
                            : image?.imageUrl
                    )
                    .filter(
                        (url) =>
                            typeof url === "string" &&
                            url.trim().length > 0
                    )
            ),
        ];
    }, [selectedVariant]);

    const currentIndex = Math.max(
        0,
        images.indexOf(selectedImage)
    );

    useEffect(() => {
        if (!images.length) {
            if (selectedImage) setSelectedImage("");
            return;
        }

        if (!images.includes(selectedImage)) {
            setSelectedImage(images[0]);
        }
    }, [images, selectedImage, setSelectedImage]);

    const showPrevious = () => {
        if (images.length < 2) return;

        const index =
            currentIndex <= 0
                ? images.length - 1
                : currentIndex - 1;

        setSelectedImage(images[index]);
    };

    const showNext = () => {
        if (images.length < 2) return;

        const index =
            currentIndex >= images.length - 1
                ? 0
                : currentIndex + 1;

        setSelectedImage(images[index]);
    };

    return (
        <article className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
            <div className="flex w-full gap-2 p-2.5 sm:gap-3 sm:p-4">
                {/* Desktop variant-image thumbnails */}
                {images.length > 1 && (
                    <div className="hidden w-14 shrink-0 flex-col gap-2 sm:flex">
                        {images.slice(0, 6).map((image, index) => (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() => setSelectedImage(image)}
                                aria-label={`View variant image ${index + 1}`}
                                aria-pressed={selectedImage === image}
                                className={`h-12 w-12 overflow-hidden rounded-xl border bg-white p-1 transition ${selectedImage === image
                                        ? "border-indigo-500 ring-2 ring-indigo-100"
                                        : "border-slate-200 hover:border-indigo-300"
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`Variant image ${index + 1}`}
                                    className="h-full w-full object-contain"
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </button>
                        ))}
                    </div>
                )}

                {/* Main image: selected variant only */}
                <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 sm:rounded-2xl">
                    {images.length > 0 && selectedImage ? (
                        <>
                            <button
                                type="button"
                                onClick={openZoom}
                                className="flex aspect-square min-h-[260px] w-full items-center justify-center p-5 sm:aspect-auto sm:h-[390px] sm:min-h-0 sm:p-8"
                                aria-label="Zoom selected variant image"
                            >
                                <img
                                    src={selectedImage}
                                    alt={`${selectedVariant?.model || "Selected variant"} image`}
                                    className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                                    loading="eager"
                                />
                            </button>

                            <button
                                type="button"
                                onClick={openZoom}
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:text-indigo-600"
                                aria-label="Zoom image"
                            >
                                <Expand size={16} />
                            </button>

                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={showPrevious}
                                        className="absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-slate-700 shadow-md sm:left-3"
                                        aria-label="Previous variant image"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={showNext}
                                        className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-slate-700 shadow-md sm:right-3"
                                        aria-label="Next variant image"
                                    >
                                        <ChevronRight size={18} />
                                    </button>

                                    <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold text-white">
                                        {currentIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex aspect-square min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center sm:h-[390px]">
                            <ImageIcon size={32} className="text-slate-300" />
                            <p className="text-sm font-semibold text-slate-600">
                                No images for this variant
                            </p>
                            <p className="text-xs text-slate-400">
                                Upload images specifically for this model.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2.5 sm:hidden">
                    {images.map((image, index) => (
                        <button
                            key={`${image}-mobile-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            aria-label={`View variant image ${index + 1}`}
                            aria-pressed={selectedImage === image}
                            className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-white p-1 ${selectedImage === image
                                    ? "border-indigo-500 ring-2 ring-indigo-100"
                                    : "border-slate-200"
                                }`}
                        >
                            <img
                                src={image}
                                alt=""
                                className="h-full w-full object-contain"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}
