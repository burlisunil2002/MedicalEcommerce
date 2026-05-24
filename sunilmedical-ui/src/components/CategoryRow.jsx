import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function CategoryRow({ activeCategory, products = [] }) {
    const navigate = useNavigate();

    // 🔥 Generate categories from products (NO API call)
    const categories = useMemo(() => {
        const map = {};

        products.forEach(p => {
            const cat = (p.category || p.Category || "").trim();

            if (cat && !map[cat]) {
                map[cat] = {
                    name: cat,
                    image: p.imageUrl || p.ImageUrl || "/images/no-image.png"
                };
            }
        });

        return [{ name: "All" }, ...Object.values(map)];
    }, [products]);

    return (
        <div className="overflow-visible pt-2">
            <div className="flex items-start gap-5 overflow-x-auto pb-4 pt-4 min-h-[110px] no-scrollbar">

                {categories.map((c, i) => {
                    const isActive =
                        (!activeCategory && c.name === "All") ||
                        activeCategory?.toLowerCase() === c.name.toLowerCase();

                    return (
                        <button
                            key={i}
                            onClick={() =>
                                c.name === "All"
                                    ? navigate("/")
                                    : navigate(`/category/${encodeURIComponent(c.name)}`)
                            }
                            className="flex flex-col items-center w-[88px] flex-shrink-0 group focus:outline-none"
                        >
                            {/* Glow */}
                            <div className="relative flex items-center justify-center">

                                {isActive && (
                                    <span className="absolute inset-[-6px] rounded-full bg-blue-300/50 blur-md"></span>
                                )}

                                {/* Circle */}
                                <span
                                    className={`
                                        relative z-10
                                        w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]
                                        rounded-full aspect-square
                                        overflow-hidden
                                        flex items-center justify-center
                                        bg-white
                                        transition-all duration-300
                                        ${isActive
                                            ? "ring-2 ring-blue-500 shadow-lg scale-105"
                                            : "shadow-sm group-hover:shadow-md group-hover:scale-105"
                                        }
                                    `}
                                >
                                    {c.name === "All" ? (
                                        <span className="
                                            w-full h-full flex items-center justify-center
                                            bg-gradient-to-br from-blue-500 via-sky-400 to-indigo-500
                                            text-white text-xs font-bold
                                        ">
                                            All
                                        </span>
                                    ) : (
                                        <img
                                            src={c.image}
                                            alt={c.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </span>
                            </div>

                            {/* Label */}
                            <span
                                className={`
                                    mt-2 text-[11px] leading-tight text-center transition
                                    ${isActive
                                        ? "text-blue-600 font-semibold"
                                        : "text-gray-600 group-hover:text-blue-500"
                                    }
                                `}
                            >
                                {c.name}
                            </span>
                        </button>
                    );
                })}

            </div>
        </div>
    );
}