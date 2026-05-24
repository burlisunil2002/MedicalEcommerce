import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

export default function Banner() {
    const banners = [
        { image: "/images/MadeInIndiaBanner.png" },
        { image: "/images/bannerMRI.png" },
        { image: "/images/offerbanner.png" },
    ];

    return (
        <div className="mb-6 rounded-2xl overflow-hidden shadow-md border border-blue-100">

            <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 2000 }}
                loop
                pagination={{ clickable: true }}
            >
                {banners.map((b, i) => (
                    <SwiperSlide key={i}>
                        <div className="w-full aspect-[3020/820]">

                            <img
                                src={b.image}
                                alt="banner"
                                className="w-full h-full object-cover animate-[zoom_8s_linear_infinite]"
                            />

                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

        </div>
    );
}