import {
    useEffect,
    useMemo
} from "react";

import {
    ChevronLeft,
    ChevronRight,
    Expand
} from "lucide-react";


export default function ProductGallery({

    product,

    selectedVariant,

    selectedImage,

    setSelectedImage,

    openZoom,

    onNext,

    onPrevious

}) {


    const images =
        useMemo(() => {

            const result = [];


            selectedVariant?.images?.forEach?.(
                image => {

                    if (
                        image?.imageUrl
                    ) {

                        result.push(
                            image.imageUrl
                        );

                    }

                }
            );


            [
                product?.imageUrl,
                product?.imageUrl2,
                product?.imageUrl3,
                product?.imageUrl4
            ].forEach(image => {

                if (image) {

                    result.push(
                        image
                    );

                }

            });


            const unique =
                [
                    ...new Set(
                        result.filter(
                            Boolean
                        )
                    )
                ];


            return unique.length
                ? unique
                : [
                    "/images/no-image.png"
                ];

        }, [
            product,
            selectedVariant
        ]);


    const currentIndex =
        Math.max(
            0,
            images.indexOf(
                selectedImage
            )
        );


    useEffect(() => {

        if (
            !selectedImage ||
            !images.includes(
                selectedImage
            )
        ) {

            setSelectedImage(
                images[0]
            );

        }

    }, [
        images,
        selectedImage,
        setSelectedImage
    ]);


    return (

        <article className="h-full min-h-[360px] overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-4">


            <div className="flex h-full min-h-[328px] gap-3">


                {/* =================================================
                    DESKTOP THUMBNAILS
                ================================================== */}

                {images.length > 1 && (

                    <div className="hidden w-[60px] shrink-0 flex-col gap-2 sm:flex">

                        {images
                            .slice(0, 6)
                            .map(
                                (
                                    image,
                                    index
                                ) => {

                                    const active =
                                        selectedImage ===
                                        image;


                                    return (

                                        <button

                                            key={`${image}-${index}`}

                                            type="button"

                                            onClick={() =>
                                                setSelectedImage(
                                                    image
                                                )
                                            }

                                            className={`h-[56px] w-[56px] shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition ${active

                                                    ? "border-indigo-500 ring-2 ring-indigo-100"

                                                    : "border-slate-200 hover:border-indigo-300"
                                                }`}

                                        >

                                            <img

                                                src={
                                                    image
                                                }

                                                alt={`${product?.name || "Product"} ${index + 1}`}

                                                className="h-full w-full object-contain"

                                                loading={
                                                    index ===
                                                        0
                                                        ? "eager"
                                                        : "lazy"
                                                }

                                            />

                                        </button>

                                    );

                                }
                            )}

                    </div>

                )}


                {/* =================================================
                    MAIN IMAGE
                ================================================== */}

                <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">


                    <button

                        type="button"

                        onClick={
                            openZoom
                        }

                        className="flex h-full min-h-[328px] w-full items-center justify-center p-5 sm:p-6"

                    >

                        <img

                            src={
                                selectedImage ||
                                "/images/no-image.png"
                            }

                            alt={
                                selectedVariant?.model ||
                                product?.name ||
                                "Product"
                            }

                            className="max-h-[300px] max-w-full object-contain transition-transform duration-300 hover:scale-[1.03]"

                            loading="eager"

                        />

                    </button>


                    {/* Zoom */}

                    <button

                        type="button"

                        onClick={
                            openZoom
                        }

                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"

                        aria-label="Zoom"

                    >

                        <Expand
                            size={16}
                        />

                    </button>


                    {/* Previous */}

                    {images.length > 1 && (

                        <button

                            type="button"

                            onClick={
                                onPrevious
                            }

                            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:text-indigo-600"

                            aria-label="Previous image"

                        >

                            <ChevronLeft
                                size={18}
                            />

                        </button>

                    )}


                    {/* Next */}

                    {images.length > 1 && (

                        <button

                            type="button"

                            onClick={
                                onNext
                            }

                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:text-indigo-600"

                            aria-label="Next image"

                        >

                            <ChevronRight
                                size={18}
                            />

                        </button>

                    )}


                    {/* Counter */}

                    {images.length > 1 && (

                        <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold text-white">

                            {currentIndex + 1}
                            /
                            {images.length}

                        </div>

                    )}

                </div>

            </div>


            {/* Mobile thumbnails */}

            {images.length > 1 && (

                <div className="mt-2 flex gap-2 overflow-x-auto sm:hidden">

                    {images.map(
                        (
                            image,
                            index
                        ) => (

                            <button

                                key={`${image}-mobile-${index}`}

                                type="button"

                                onClick={() =>
                                    setSelectedImage(
                                        image
                                    )
                                }

                                className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border p-1 ${selectedImage ===
                                        image

                                        ? "border-indigo-500 ring-2 ring-indigo-100"

                                        : "border-slate-200"
                                    }`}

                            >

                                <img

                                    src={
                                        image
                                    }

                                    alt=""

                                    className="h-full w-full object-contain"

                                    loading="lazy"

                                />

                            </button>

                        )
                    )}

                </div>

            )}

        </article>

    );

}