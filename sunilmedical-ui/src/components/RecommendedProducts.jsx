import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import API from "../services/api";
import ProductCard from "./ProductCard";

export default function RecommendedProducts({ currentProduct }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                const res = await API.get("/api/products");
                if (cancelled) return;

                const all = Array.isArray(res.data)
                    ? res.data
                    : res.data?.products ?? res.data?.items ?? [];

                const currentId = currentProduct?.id ?? currentProduct?.Id;
                const currentCategory =
                    currentProduct?.category ?? currentProduct?.Category;
                const currentBrand =
                    currentProduct?.brand ?? currentProduct?.Brand;

                const currentName = String(
                    currentProduct?.name ??
                    currentProduct?.Name ??
                    currentProduct?.productName ??
                    currentProduct?.ProductName ??
                    ""
                ).toLowerCase();

                const normalized = all.map((p) => ({
                    ...p,
                    id: p.id ?? p.Id,
                    category: p.category ?? p.Category,
                    brand: p.brand ?? p.Brand,
                    name:
                        p.name ??
                        p.Name ??
                        p.productName ??
                        p.ProductName,
                    priceType: String(
                        p.priceType ?? p.PriceType ?? "normal"
                    ).toLowerCase(),
                }));

                const candidates = normalized
                    .filter((p) => String(p.id) !== String(currentId))
                    .filter((p) => p.priceType === "normal");

                const words = currentName
                    .split(/\s+/)
                    .filter((word) => word.length > 3);

                const scored = candidates.map((p) => {
                    let score = 0;
                    const name = String(p.name || "").toLowerCase();

                    if (p.category && currentCategory && p.category === currentCategory) score += 50;
                    if (p.brand && currentBrand && p.brand === currentBrand) score += 15;

                    words.forEach((word) => {
                        if (name.includes(word)) score += 5;
                    });

                    return { ...p, recommendationScore: score };
                });

                scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
                setProducts(scored.slice(0, 8));
            } catch (error) {
                console.error("Failed to load recommendations:", error);
                if (!cancelled) setProducts([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (currentProduct) load();

        return () => {
            cancelled = true;
        };
    }, [currentProduct]);

    if (!loading && products.length === 0) return null;

    return (
        <section className="w-full">
            <div className="mb-4 flex items-start gap-2 px-0.5">
                <Sparkles size={17} className="mt-0.5 shrink-0 text-indigo-600" />
                <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
                        Recommended For You
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                        Products related to your current selection.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-64 animate-pulse rounded-2xl bg-slate-100 sm:h-72"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                    {products.map((p) => (
                        <div key={p.id} className="min-w-0">
                            <ProductCard p={p} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
