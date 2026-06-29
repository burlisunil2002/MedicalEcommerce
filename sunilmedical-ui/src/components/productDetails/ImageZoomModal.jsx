import {
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export default function ImageZoomModal({

    open,

    images = [],

    currentImage,

    setCurrentImage,

    onClose

}) {

    if (!open)
        return null;

    const currentIndex =
        images.indexOf(currentImage);

    const previous = () => {

        if (currentIndex > 0) {

            setCurrentImage(
                images[currentIndex - 1]
            );

        }

    };

    const next = () => {

        if (currentIndex < images.length - 1) {

            setCurrentImage(
                images[currentIndex + 1]
            );

        }

    };

    return (

        <div
            className="
                fixed
                inset-0
                z-[999]
                bg-black/90
                flex
                items-center
                justify-center
            "
        >

            {/* Close */}

            <button

                onClick={onClose}

                className="
                    absolute
                    top-6
                    right-6
                    text-white
                "

            >

                <X size={34} />

            </button>

            {/* Previous */}

            {

                currentIndex > 0 &&

                <button

                    onClick={previous}

                    className="
                        absolute
                        left-6
                        text-white
                    "

                >

                    <ChevronLeft size={42} />

                </button>

            }

            {/* Main Image */}

            <img

                src={currentImage}

                alt="Product"

                className="
                    max-h-[80vh]
                    max-w-[80vw]
                    object-contain
                    rounded-xl
                "

            />

            {/* Next */}

            {

                currentIndex < images.length - 1 &&

                <button

                    onClick={next}

                    className="
                        absolute
                        right-6
                        text-white
                    "

                >

                    <ChevronRight size={42} />

                </button>

            }

            {/* Thumbnails */}

            <div
                className="
                    absolute
                    bottom-6
                    flex
                    gap-3
                    overflow-x-auto
                    px-6
                "
            >

                {

                    images.map((img, index) => (

                        <img

                            key={index}

                            src={img}

                            alt="Thumb"

                            onClick={() =>
                                setCurrentImage(img)
                            }

                            className={`

                                w-20
                                h-20
                                rounded-xl
                                cursor-pointer
                                object-cover
                                border-4

                                ${currentImage === img

                                    ? "border-blue-500"

                                    : "border-transparent"

                                }

                            `}

                        />

                    ))

                }

            </div>

        </div>

    );

}