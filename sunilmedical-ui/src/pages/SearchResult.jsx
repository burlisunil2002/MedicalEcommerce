
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

export default function SearchResult() {
    const { term } = useParams();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchProducts = async () => {
            const searchTerm = term?.trim();

            if (!searchTerm || searchTerm.toLowerCase() === "all") {
                setProducts([]);
                setLoading(false);
                setError("");
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await API.get(
                    "/api/products/search",
                    {
                        params: {
                            term: searchTerm
                        }
                    }
                );

                if (cancelled) return;

                const data = response.data;

                // Support either a direct array or a wrapped response.
                const resultList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.products)
                        ? data.products
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

                setProducts(resultList);
            } catch (err) {
                if (cancelled) return;

                console.error("Product search failed:", err);

                setProducts([]);
                setError(
                    "Unable to load products. Please try again."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            cancelled = true;
        };
    }, [term]);

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-7">
            <div className="mx-auto w-full max-w-7xl">

                <div className="mb-6">
                    <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                        Search Results
                    </h1>

                    <p className="mt-1 text-sm text-slate-600 sm:text-base">
                        Results for "{term || ""}"
                    </p>

                    {!loading && !error && (
                        <p className="mt-2 text-sm text-slate-500">
                            {products.length}{" "}
                            {products.length === 1
                                ? "product"
                                : "products"} found
                        </p>
                    )}
                </div>

                {loading && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
                            >
                                <div className="mb-4 h-40 rounded-lg bg-slate-200 sm:h-48" />
                                <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
                                <div className="mb-3 h-5 w-3/4 rounded bg-slate-200" />
                                <div className="mb-4 h-6 w-1/2 rounded bg-slate-200" />
                                <div className="h-10 rounded bg-slate-200" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-white p-6 text-center">
                        <p className="font-semibold text-red-700">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                // Trigger a retry by reloading the current URL.
                                window.location.reload();
                            }}
                            className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
                        <h2 className="text-lg font-semibold text-slate-800">
                            No products found
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Try another product name, brand, category,
                            or model.
                        </p>
                    </div>
                )}

                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id ?? product.productId}
                                p={product}
                            />
                        ))}
                    </div>
                )}

            </div>
        </main>
    );
}
