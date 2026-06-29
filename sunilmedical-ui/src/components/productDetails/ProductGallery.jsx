import { useEffect, useMemo } from "react";
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

    openZoom

}) {

    const images = useMemo(() => {

        if (
            selectedVariant?.images &&
            selectedVariant.images.length > 0
        ) {

            return selectedVariant.images.map(
                x => x.imageUrl
            );

        }

        if (product?.imageUrl)
            return [product.imageUrl];

        return ["/images/no-image.png"];

    }, [

        product,

        selectedVariant

    ]);


    const currentIndex =
        images.indexOf(
            selectedImage
        );


    const nextImage = () => {

        if (
            currentIndex <
            images.length - 1
        ) {

            setSelectedImage(
                images[currentIndex + 1]
            );

        }

    };


    const previousImage = () => {

        if (
            currentIndex > 0
        ) {

            setSelectedImage(
                images[currentIndex - 1]
            );

        }

    };

    useEffect(() => {

        if (
            images.length > 0 &&
            !selectedImage
        ) {
            setSelectedImage(images[0]);
        }

    }, [images, selectedImage, setSelectedImage]);


    return (

        <div className="lg:sticky lg:top-24">

            <div className="flex gap-4 items-start">

                {/* Thumbnail Images */}

                {

                    images.length > 1 && (

                        <div
                            className="
                            hidden
                            lg:flex
                            flex-col
                            gap-3
                            w-24
                            shrink-0
                        "
                        >

                            {

                                images.map((image, index) => (

                                    <button

                                        key={index}

                                        onClick={() => setSelectedImage(image)}

                                        className={`
                                        w-20
                                        h-20
                                        rounded-xl
                                        overflow-hidden
                                        border-2
                                        transition

                                        ${selectedImage === image
                                                ? "border-blue-600"
                                                : "border-gray-200"
                                            }
                                    `}
                                    >

                                        <img

                                            src={image}

                                            alt="Thumbnail"

                                            className="
                                            w-full
                                            h-full
                                            object-contain
                                        "

                                        />

                                    </button>

                                ))

                            }

                        </div>

                    )

                }

                {/* Main Image */}

                <div
                    className="
                    relative
                    flex-1
                    bg-white
                    rounded-3xl
                    border
                    shadow-sm
                    p-8
                "
                >

                    <img

                        src={selectedImage}

                        alt={selectedVariant?.model}

                        onClick={openZoom}

                        className="
                        w-full
                        h-[500px]
                        object-contain
                        cursor-zoom-in
                        transition
                        duration-300
                        hover:scale-105
                    "

                    />

                    {/* Expand */}

                    <button

                        onClick={openZoom}

                        className="
                        absolute
                        top-5
                        right-5
                        bg-white
                        shadow-lg
                        rounded-full
                        p-3
                        hover:bg-gray-100
                    "

                    >

                        <Expand size={18} />

                    </button>

                    {/* Slider Controls */}

                    {

                        images.length > 1 && (

                            <>

                                {/* Counter */}

                                <div
                                    className="
                                    absolute
                                    bottom-5
                                    left-5
                                    bg-black/70
                                    text-white
                                    text-xs
                                    px-3
                                    py-1
                                    rounded-full
                                "
                                >

                                    {currentIndex + 1}/{images.length}

                                </div>

                                {/* Previous */}

                                {

                                    currentIndex > 0 && (

                                        <button

                                            onClick={previousImage}

                                            className="
                                            absolute
                                            top-1/2
                                            left-4
                                            -translate-y-1/2
                                            bg-white
                                            rounded-full
                                            shadow-xl
                                            p-3
                                        "

                                        >

                                            <ChevronLeft />

                                        </button>

                                    )

                                }

                                {/* Next */}

                                {

                                    currentIndex < images.length - 1 && (

                                        <button

                                            onClick={nextImage}

                                            className="
                                            absolute
                                            top-1/2
                                            right-4
                                            -translate-y-1/2
                                            bg-white
                                            rounded-full
                                            shadow-xl
                                            p-3
                                        "

                                        >

                                            <ChevronRight />

                                        </button>

                                    )

                                }

                            </>

                        )

                    }

                </div>

            </div>

        </div>

    );
}