import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const banners = [
    { image: "/images/MadeInIndiaBanner.png", alt: "Made in India medical products" },
    { image: "/images/bannerMRI.png", alt: "MRI medical equipment" },
    { image: "/images/offerbanner.png", alt: "Special medical product offers" },
];

export default function Banner() {
    return (
        <section aria-label="Featured offers" className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm sm:rounded-2xl">
            <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                loop={banners.length > 1}
                pagination={{ clickable: true }}
                className="w-full"
            >
                {banners.map((b) => (
                    <SwiperSlide key={b.image}>
                        <div className="relative aspect-[3.68/1] min-h-[112px] w-full overflow-hidden sm:min-h-0">
                            <img src={b.image} alt={b.alt} loading="eager" decoding="async" className="h-full w-full object-cover" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
