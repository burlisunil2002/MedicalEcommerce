import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "./ProductCard";

export default function RecommendedProducts({ currentProduct }) {

    const [products, setProducts] = useState([]);

    useEffect(() => {
        load();
    }, [currentProduct]);

    const load = async () => {
        const res = await API.get("/api/products");

        const currentId = currentProduct?.id ?? currentProduct?.Id;
        const currentCategory = currentProduct?.category ?? currentProduct?.Category;

        const normalized = res.data.map(p => ({
            ...p,
            id: p.id ?? p.Id,
            category: p.category ?? p.Category,
            priceType: (p.priceType ?? p.PriceType ?? "normal").toLowerCase()
        }));

        const filtered = normalized
            .filter(p => p.id !== currentId)
            .filter(p => p.priceType === "normal");

        const same = filtered.filter(p => p.category === currentCategory);
        const others = filtered.filter(p => p.category !== currentCategory);

        setProducts([...same, ...others].slice(0, 8)); // 4x2 grid
    };

    return (
        <div className="mt-12">

            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                You may also like
            </h2>

            <div className="
        grid 
        grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        gap-5
    ">
                {products.map(p => (
                    <ProductCard key={p.id} p={p} />
                ))}
            </div>
        </div>
    );
}