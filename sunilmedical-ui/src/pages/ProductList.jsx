
import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import MainBanner from "../components/MainBanner";
import CategoryRow from "../components/CategoryRow";
import HotDeals from "../components/HotDeals";
import { useParams } from "react-router-dom";
import ProductListSkeleton from "../components/loader/ProductListSkeleton";

export default function ProductList() {

    const { categoryName } = useParams();

    const [allProducts, setAllProducts] = useState([]);

    const isCategoryPage =
        categoryName &&
        categoryName.toLowerCase() !== "all";

    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");

    // Fetch Products Only Once
    useEffect(() => {

        const loadProducts = async () => {

            setLoading(true);


            try {

                const res = await API.get("/api/products");

                let data = res.data;

                if (data?.$values)
                    data = data.$values;

                if (!Array.isArray(data))
                    data = [];

                setAllProducts(data);

            }
            catch (err) {

                console.error(err);

            }
            finally {
                setLoading(false);

            }

        };

        loadProducts();

    }, []);

    // Scroll Only
    useEffect(() => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }, [categoryName]);

    // Products (Instant Filter)
    const products = useMemo(() => {

        if (!isCategoryPage)
            return allProducts;

        return allProducts.filter(product =>
            (product.category || product.Category || "")
                .toLowerCase()
                .trim() === categoryName.toLowerCase().trim()
        );

    }, [allProducts, categoryName, isCategoryPage]);

    // Hot Deals
    const hotDeals = useMemo(() => {

        return allProducts.filter(product =>
            (product.isHotDeal ?? product.IsHotDeal) &&
            (product.discount ?? product.DiscountPercentage ?? 0) > 0
        );

    }, [allProducts]);

    if (loading) {

        return <ProductListSkeleton />;

    }

    return (

        <>

            {message && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]">
                    <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-2 font-medium animate-fade-in">
                        {message}
                    </div>
                </div>
            )}

    {/* Your existing ProductCard JSX */}


        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">

            <div className="max-w-7xl mx-auto px-4 py-5">

                {/* Home Page */}
                {!isCategoryPage && (
                    <>
                        <MainBanner />

                        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-3 pb-2">

                            <CategoryRow
                                activeCategory={categoryName}
                                products={allProducts}
                            />

                        </div>

                        <div className="mt-3">

                            <HotDeals
                                products={hotDeals}
                            />

                        </div>

                    </>
                )}

                {/* Category Page */}
                {isCategoryPage && (

                    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-3 pb-2">

                        <CategoryRow
                            activeCategory={categoryName}
                            products={allProducts}
                        />

                    </div>

                )}

                {/* Heading */}

                <div className="mt-6 mb-5">

                    <h2 className="text-2xl font-bold text-gray-800">

                        {isCategoryPage
                            ? categoryName
                            : "Products For You"}

                    </h2>

                </div>

                {/* Products */}

                {products.length === 0 ? (

                    <div className="flex justify-center items-center h-52">

                        <p className="text-gray-500 text-lg">

                            No Products Found

                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">

                        {products.map((product, index) => (

                            <ProductCard
                                key={product.id || index}
                                p={product}
                                setMessage={setMessage}
                            />

                        ))}

                    </div>

                )}

            </div>

            </div>
        </>

            );

}