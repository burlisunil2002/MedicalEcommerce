import { useEffect, useState } from "react";
import {
    Sparkles
} from "lucide-react";

import API from "../services/api";
import ProductCard from "./ProductCard";

export default function RecommendedProducts({
    currentProduct
}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                const res =
                    await API.get("/api/products");

                if (cancelled) return;

                const all =
                    Array.isArray(res.data)
                        ? res.data
                        : [];

                const currentId =
                    currentProduct?.id ??
                    currentProduct?.Id;

                const currentCategory =
                    currentProduct?.category ??
                    currentProduct?.Category;

                const currentBrand =
                    currentProduct?.brand ??
                    currentProduct?.Brand;

                const currentName = (
                    currentProduct?.name ??
                    currentProduct?.Name ??
                    currentProduct?.productName ??
                    currentProduct?.ProductName ??
                    ""
                ).toLowerCase();

                const normalized =
                    all.map((p) => ({
                        ...p,

                        id:
                            p.id ??
                            p.Id,

                        category:
                            p.category ??
                            p.Category,

                        brand:
                            p.brand ??
                            p.Brand,

                        name:
                            p.name ??
                            p.Name ??
                            p.productName ??
                            p.ProductName,

                        priceType: (
                            p.priceType ??
                            p.PriceType ??
                            "normal"
                        ).toLowerCase()
                    }));

                const candidates =
                    normalized.filter(
                        (p) =>
                            p.id !== currentId
                    ).filter(
                        (p) =>
                            p.priceType ===
                            "normal"
                    );

                /*
                 * Relevance scoring.
                 * Higher score = more relevant.
                 */
                const scored =
                    candidates.map((p) => {
                        let score = 0;

                        const name = (
                            p.name || ""
                        ).toLowerCase();

                        if (
                            p.category &&
                            currentCategory &&
                            p.category ===
                            currentCategory
                        ) {
                            score += 50;
                        }

                        if (
                            p.brand &&
                            currentBrand &&
                            p.brand ===
                            currentBrand
                        ) {
                            score += 15;
                        }

                        /*
                         * Basic keyword relevance.
                         */
                        const words =
                            currentName
                                .split(/\s+/)
                                .filter(
                                    (word) =>
                                        word.length >
                                        3
                                );

                        words.forEach(
                            (word) => {
                                if (
                                    name.includes(word)
                                ) {
                                    score += 5;
                                }
                            }
                        );

                        return {
                            ...p,
                            recommendationScore:
                                score
                        };
                    });

                scored.sort(
                    (a, b) =>
                        b.recommendationScore -
                        a.recommendationScore
                );

                setProducts(
                    scored.slice(0, 8)
                );
            } catch (error) {
                console.error(
                    "Failed to load recommendations:",
                    error
                );

                setProducts([]);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [currentProduct]);

    /*
     * Don't show empty recommendation
     * container.
     */
    if (
        !loading &&
        products.length === 0
    ) {
        return null;
    }

    return (
        <section className="mt-10 sm:mt-12">

            <div className="
                flex
                items-center
                justify-between
                mb-4
                px-1
            ">
                <div>
                    <div className="
                        flex
                        items-center
                        gap-2
                    ">
                        <Sparkles
                            size={17}
                            className="text-indigo-600"
                        />

                        <h2 className="
                            text-lg
                            sm:text-xl
                            font-bold
                            text-slate-900
                        ">
                            Recommended For You
                        </h2>
                    </div>

                    <p className="
                        mt-1
                        text-xs
                        sm:text-sm
                        text-slate-500
                    ">
                        Products related to your current selection.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    lg:grid-cols-4
                    gap-3
                    sm:gap-5
                ">
                    {Array.from({
                        length: 4
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="
                                h-72
                                rounded-2xl
                                bg-slate-100
                                animate-pulse
                            "
                        />
                    ))}
                </div>
            ) : (
                <div className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    lg:grid-cols-4
                    gap-3
                    sm:gap-5
                ">
                    {products.map((p) => (
                        <ProductCard
                            key={p.id}
                            p={p}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}