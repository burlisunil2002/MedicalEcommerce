import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import MainBanner from "../components/MainBanner";
import CategoryRow from "../components/CategoryRow";
import HotDeals from "../components/HotDeals";
import ProductListSkeleton from "../components/loader/ProductListSkeleton";

export default function ProductList() {
    const { categoryName } = useParams();
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const isCategoryPage = Boolean(categoryName) && categoryName.toLowerCase() !== "all";

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await API.get("/api/products");
            let data = response?.data;
            if (data?.$values) data = data.$values;
            setAllProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Products load error:", error);
            setAllProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [categoryName]);

    const products = useMemo(() => {
        if (!isCategoryPage) return allProducts;
        const target = categoryName.toLowerCase().trim();

        return allProducts.filter((product) =>
            String(product?.category ?? product?.Category ?? "").toLowerCase().trim() === target
        );
    }, [allProducts, categoryName, isCategoryPage]);

    const hotDeals = useMemo(() => allProducts.filter((product) =>
        Boolean(product?.isHotDeal ?? product?.IsHotDeal) &&
        Number(product?.discount ?? product?.DiscountPercentage ?? 0) > 0
    ), [allProducts]);

    if (loading) return <ProductListSkeleton />;

    return (
        <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
            {message && (
                <div className="pointer-events-none fixed inset-x-3 top-4 z-[9999] flex justify-center sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
                    <div className="pointer-events-auto max-w-md rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-semibold text-emerald-700 shadow-xl sm:text-sm">
                        {message}
                    </div>
                </div>
            )}

            <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
                {!isCategoryPage && (
                    <section className="mb-4 sm:mb-6">
                        <MainBanner />
                    </section>
                )}

                <div className="sticky top-0 z-40 -mx-3 border-y border-slate-200/80 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
                    <CategoryRow activeCategory={categoryName} products={allProducts} />
                </div>

                {!isCategoryPage && hotDeals.length > 0 && (
                    <section className="mt-5 sm:mt-7">
                        <HotDeals products={hotDeals} />
                    </section>
                )}

                <section className="mt-6 sm:mt-8">
                    <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Medical Marketplace</p>
                            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                                {isCategoryPage ? categoryName : "Products For You"}
                            </h1>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 sm:text-xs">
                            {products.length} {products.length === 1 ? "product" : "products"}
                        </span>
                    </div>
                </section>

                {products.length === 0 ? (
                    <section className="flex min-h-[280px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">📦</div>
                            <h2 className="mt-4 text-base font-bold text-slate-800">No products found</h2>
                            <p className="mt-1 text-xs text-slate-500">Try another category or browse all products.</p>
                        </div>
                    </section>
                ) : (
                    <section className="mt-4 sm:mt-5">
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {products.map((product, index) => (
                                <ProductCard
                                    key={product?.id ?? product?.Id ?? index}
                                    p={product}
                                    setMessage={setMessage}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
