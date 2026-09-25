import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon } from "lucide-react";

export default function ProductGallery({
    product,
    selectedVariant,
    selectedImage,
    setSelectedImage,
    openZoom,
    onNext,
    onPrevious,
}) {
    const images = useMemo(() => {
        const result = [];

        selectedVariant?.images?.forEach?.((image) => {
            if (image?.imageUrl) result.push(image.imageUrl);
        });

        [
            product?.imageUrl,
            product?.imageUrl2,
            product?.imageUrl3,
            product?.imageUrl4,
        ].forEach((image) => {
            if (image) result.push(image);
        });

        const unique = [...new Set(result.filter(Boolean))];
        return unique.length ? unique : ["/images/no-image.png"];
    }, [product, selectedVariant]);

    const currentIndex = Math.max(0, images.indexOf(selectedImage));

    useEffect(() => {
        if (!selectedImage || !images.includes(selectedImage)) {
            setSelectedImage(images[0]);
        }
    }, [images, selectedImage, setSelectedImage]);

    const previous = () => {
        if (onPrevious) return onPrevious();
        const next = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
        setSelectedImage(images[next]);
    };

    const next = () => {
        if (onNext) return onNext();
        const nextIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
        setSelectedImage(images[nextIndex]);
    };

    return (
        <article className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            <div className="flex w-full gap-2 p-2.5 sm:gap-3 sm:p-4">
                {images.length > 1 && (
                    <div className="hidden w-14 shrink-0 flex-col gap-2 sm:flex">
                        {images.slice(0, 6).map((image, index) => {
                            const active = selectedImage === image;
                            return (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedImage(image)}
                                    aria-label={`View image ${index + 1}`}
                                    className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition ${active
                                            ? "border-indigo-500 ring-2 ring-indigo-100"
                                            : "border-slate-200 hover:border-indigo-300"
                                        }`}
                                >
                                    <img
                                        src={image}
                                        alt=""
                                        className="h-full w-full object-contain"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 sm:rounded-2xl">
                    <button
                        type="button"
                        onClick={openZoom}
                        className="flex aspect-square min-h-[260px] w-full items-center justify-center p-5 sm:aspect-auto sm:h-[390px] sm:min-h-0 sm:p-8"
                        aria-label="Open product image"
                    >
                        <img
                            src={selectedImage || "/images/no-image.png"}
                            alt={selectedVariant?.model || product?.name || "Product"}
                            className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                            loading="eager"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={openZoom}
                        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition hover:text-indigo-600 sm:right-3 sm:top-3"
                        aria-label="Zoom product image"
                    >
                        <Expand size={16} />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={previous}
                                className="absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-slate-700 shadow-md sm:left-3"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={next}
                                className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-slate-700 shadow-md sm:right-3"
                                aria-label="Next image"
                            >
                                <ChevronRight size={18} />
                            </button>

                            <div className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold text-white">
                                {currentIndex + 1} / {images.length}
                            </div>
                        </>
                    )}

                    {images.length === 1 && (
                        <div className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                            <ImageIcon size={12} />
                            Product image
                        </div>
                    )}
                </div>
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2.5 sm:hidden">
                    {images.map((image, index) => (
                        <button
                            key={`${image}-mobile-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-white p-1 ${selectedImage === image
                                    ? "border-indigo-500 ring-2 ring-indigo-100"
                                    : "border-slate-200"
                                }`}
                            aria-label={`View image ${index + 1}`}
                        >
                            <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}
