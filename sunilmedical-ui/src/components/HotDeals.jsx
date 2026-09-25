import { useRef } from "react";
import { ChevronRight, Flame, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HotDeals({ products = [] }) {
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    if (!products.length) return null;

    const scrollDeals = (direction) => {
        scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
    };

    return (
        <section aria-labelledby="hot-deals-heading" className="w-full">
            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                            <Flame size={17} fill="currentColor" />
                        </span>
                        <h2 id="hot-deals-heading" className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                            Hot Deals
                        </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">Limited-time offers on selected products</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => scrollDeals(-1)} aria-label="Previous hot deals"
                        className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:flex">
                        <ChevronRight size={17} className="rotate-180" />
                    </button>
                    <button type="button" onClick={() => scrollDeals(1)} aria-label="Next hot deals"
                        className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:flex">
                        <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => navigate("/")}
                        className="ml-1 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50 sm:px-3 sm:text-sm">
                        View all <ChevronRight size={15} />
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar sm:gap-4">
                {products.map((p, index) => {
                    const id = p.id ?? p.Id;
                    const name = p.name ?? p.Name ?? "Product";
                    const brand = p.brand ?? p.Brand ?? "";
                    const image = p.imageUrl ?? p.ImageUrl ?? "/images/no-image.png";
                    const price = Number(p.price ?? p.Price ?? p.minPrice ?? p.MinPrice ?? p.sellingPrice ?? p.SellingPrice ?? 0);
                    const discount = Math.max(0, Math.min(100, Number(p.discount ?? p.DiscountPercentage ?? 0)));
                    const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;

                    return (
                        <article key={id ?? index} className="group w-[214px] shrink-0 snap-start sm:w-[232px] lg:w-[244px]">
                            <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                                <button type="button" onClick={() => navigate(`/product/${id}`)}
                                    className="relative block h-[170px] w-full overflow-hidden bg-slate-50 text-left sm:h-[180px]" aria-label={`View ${name}`}>
                                    {discount > 0 && <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-sm">{discount}% OFF</span>}
                                    <span className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-md border border-white/80 bg-white/90 px-2 py-1 text-[9px] font-bold text-slate-700 shadow-sm backdrop-blur">
                                        <Clock3 size={11} /> Deal
                                    </span>
                                    <img src={image} loading="lazy" decoding="async" alt={name}
                                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.04]"
                                        onError={(e) => { e.currentTarget.src = "/images/no-image.png"; }} />
                                </button>

                                <div className="flex min-h-[150px] flex-col p-3.5">
                                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{brand || "Medical Product"}</p>
                                    <button type="button" onClick={() => navigate(`/product/${id}`)}
                                        className="mt-1.5 line-clamp-2 text-left text-sm font-semibold leading-5 text-slate-900 transition hover:text-blue-600">
                                        {name}
                                    </button>
                                    <div className="mt-auto pt-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-extrabold tracking-tight text-slate-950">
                                                ₹{Math.round(finalPrice).toLocaleString("en-IN")}
                                            </span>
                                            {discount > 0 && <span className="text-[11px] text-slate-400 line-through">₹{Math.round(price).toLocaleString("en-IN")}</span>}
                                        </div>
                                        {discount > 0 && <p className="mt-0.5 text-[10px] font-bold text-emerald-600">Save {Math.round(price - finalPrice).toLocaleString("en-IN")}</p>}
                                        <button type="button" onClick={() => navigate(`/product/${id}`)}
                                            className="mt-2.5 flex h-9 w-full items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]">
                                            View Deal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
