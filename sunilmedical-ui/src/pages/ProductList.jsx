import React, { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import MainBanner from "../components/MainBanner";
import CategoryRow from "../components/CategoryRow";
import { useParams } from "react-router-dom";
import HotDeals from "../components/HotDeals";

export default function ProductList() {

    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const { categoryName } = useParams();

    const isCategoryPage =
        categoryName && categoryName.toLowerCase() !== "all";

    // 🔥 FETCH PRODUCTS
    useEffect(() => {
        API.get("/api/products")
            .then(res => {
                let data = res.data;

                if (data?.$values) data = data.$values;
                if (!Array.isArray(data)) data = [];

                setAllProducts(data);
            })
            .catch(err => console.error(err));
    }, []);

    // 🎯 FILTER
    useEffect(() => {
        if (!isCategoryPage) {
            setProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p =>
                (p.category || p.Category || "")
                    .toLowerCase()
                    .trim() === categoryName.toLowerCase().trim()
            );
            setProducts(filtered);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });

    }, [categoryName, allProducts, isCategoryPage]);

    // 🔥 HOT DEALS
    const hotDeals = allProducts.filter(p =>
        (p.isHotDeal ?? p.IsHotDeal) &&
        (p.discount ?? p.DiscountPercentage ?? 0) > 0
    );

    return (

            <div className="bg-gradient-to-b from-white via-gray-50 to-gray-100 min-h-screen">

                <div className="max-w-7xl mx-auto px-4 py-5">

                    {/* HOME PAGE */}
                    {!isCategoryPage && (
                        <>
                            <MainBanner />

                            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-3 pb-2">
                                {allProducts.length > 0 ? (
                                    <CategoryRow
                                        activeCategory={categoryName}
                                        products={allProducts}
                                    />
                                ) : (
                                    <p className="text-center text-sm text-gray-400">
                                        Loading categories...
                                    </p>
                                )}
                            </div>

                            <div className="mt-3">
                                <HotDeals products={hotDeals} />
                            </div>
                        </>
                    )}

                    {/* CATEGORY PAGE */}
                    {isCategoryPage && (
                        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-3 pb-2">
                            {allProducts.length > 0 ? (
                                <CategoryRow
                                    activeCategory={categoryName}
                                    products={allProducts}
                                />
                            ) : (
                                <p className="text-center text-sm text-gray-400">
                                    Loading categories...
                                </p>
                            )}
                        </div>
                    )}

                    {/* TITLE */}
                    <div className="mt-6 mb-4">
                        <h2 className="text-xl font-bold">
                            {isCategoryPage ? categoryName : "Products For You"}
                        </h2>
                    </div>

                    {/* GRID */}
                    {products.length === 0 ? (
                        <p className="text-center mt-10">No products found</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {products.map((p, index) => (
                                <ProductCard
                                    key={p.id || index}
                                    p={p}
                                />
                            ))}
                        </div>
                    )}

                </div>

            </div>

    );
}