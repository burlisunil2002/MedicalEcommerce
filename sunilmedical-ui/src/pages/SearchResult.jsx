import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

export default function SearchResult() {
    const { term } = useParams();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (!term || term === "all") return;

        API.get(`/api/products/search?term=${term}`)
            .then(res => setProducts(res.data));
    }, [term]);

    return (
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                    Results for "{term}"
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {products.map(p => (
                        <ProductCard key={p.id} p={p} />
                    ))}
                </div>
            </div>
    );
}