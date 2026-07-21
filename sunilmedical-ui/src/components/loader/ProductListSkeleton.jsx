import "./skeleton.css";

import BannerSkeleton from "./BannerSkeleton";
import CategorySkeleton from "./CategorySkeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function ProductListSkeleton() {

    return (

        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">

            <div className="max-w-7xl mx-auto px-4 py-5">

                <BannerSkeleton />

                <CategorySkeleton />

                <div className="mt-8">

                    <div className="h-8 w-52 skeleton rounded-lg mb-6"></div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">

                        {Array.from({ length: 10 }).map((_, index) => (

                            <ProductCardSkeleton key={index} />

                        ))}

                    </div>

                </div>

            </div>

        </div>

    );

}