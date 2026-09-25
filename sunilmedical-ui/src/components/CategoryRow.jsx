import { useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CategoryRow({ activeCategory, products = [] }) {
    const navigate = useNavigate();

    const categories = useMemo(() => {
        const map = new Map();
        products.forEach((p) => {
            const name = String(p?.category ?? p?.Category ?? "").trim();
            if (!name || map.has(name.toLowerCase())) return;
            map.set(name.toLowerCase(), {
                name,
                image: p?.imageUrl ?? p?.ImageUrl ?? "/images/no-image.png",
            });
        });
        return [{ name: "All", image: null }, ...Array.from(map.values()).slice(0, 10)];
    }, [products]);

    return (
        <nav aria-label="Product categories" className="w-full">
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-1 py-1 sm:gap-4">
                {categories.map((c) => {
                    const isActive =
                        (!activeCategory && c.name === "All") ||
                        activeCategory?.toLowerCase() === c.name.toLowerCase();

                    return (
                        <button key={c.name} type="button"
                            onClick={() => c.name === "All" ? navigate("/") : navigate(`/category/${encodeURIComponent(c.name)}`)}
                            aria-current={isActive ? "page" : undefined}
                            className="group flex w-[72px] shrink-0 flex-col items-center gap-2 outline-none sm:w-[82px]">
                            <span className={`relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full bg-white transition duration-200 sm:h-[68px] sm:w-[68px] ${isActive ? "ring-2 ring-blue-600 ring-offset-2 shadow-md" : "border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:shadow-md"
                                }`}>
                                {c.name === "All" ? (
                                    <span className="flex h-full w-full items-center justify-center bg-slate-950 text-white"><LayoutGrid size={21} /></span>
                                ) : (
                                    <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "/images/no-image.png"; }} />
                                )}
                            </span>
                            <span className={`line-clamp-2 w-full text-center text-[10px] font-semibold leading-4 transition sm:text-[11px] ${isActive ? "text-blue-700" : "text-slate-600 group-hover:text-blue-600"
                                }`}>
                                {c.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
