import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Check,
    ExternalLink,
    Store,
    Tag
} from "lucide-react";
import API from "../services/api";

export default function ProductComparison({
    currentProduct,
    onViewProduct
}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const currentId =
        currentProduct?.id ??
        currentProduct?.Id;

    const familyId =
        currentProduct?.productFamilyId ??
        currentProduct?.ProductFamilyId ??
        currentProduct?.productGroupId ??
        currentProduct?.ProductGroupId ??
        currentProduct?.familyId ??
        currentProduct?.FamilyId;

    const currentVendorId =
        currentProduct?.vendorId ??
        currentProduct?.VendorId ??
        currentProduct?.sellerId ??
        currentProduct?.SellerId;

    useEffect(() => {
        if (!currentProduct || !familyId) {
            setProducts([]);
            return;
        }

        let cancelled = false;

        const loadComparison = async () => {
            try {
                setLoading(true);

                const res = await API.get("/api/products");

                if (cancelled) return;

                const allProducts = Array.isArray(res.data)
                    ? res.data
                    : [];

                const normalized = allProducts.map((p) => ({
                    ...p,

                    id: p.id ?? p.Id,

                    productFamilyId:
                        p.productFamilyId ??
                        p.ProductFamilyId ??
                        p.productGroupId ??
                        p.ProductGroupId ??
                        p.familyId ??
                        p.FamilyId,

                    vendorId:
                        p.vendorId ??
                        p.VendorId ??
                        p.sellerId ??
                        p.SellerId,

                    vendorName:
                        p.vendorName ??
                        p.VendorName ??
                        p.sellerName ??
                        p.SellerName ??
                        "Seller",

                    name:
                        p.name ??
                        p.Name ??
                        p.productName ??
                        p.ProductName,

                    brand:
                        p.brand ??
                        p.Brand ??
                        "",

                    model:
                        p.model ??
                        p.Model ??
                        "",

                    sku:
                        p.sku ??
                        p.Sku ??
                        p.SKU ??
                        "",

                    price:
                        Number(
                            p.finalPrice ??
                            p.FinalPrice ??
                            p.price ??
                            p.Price ??
                            0
                        ),

                    image:
                        p.imageUrl ??
                        p.ImageUrl ??
                        p.image ??
                        p.Image ??
                        "/images/no-image.png"
                }));

                const comparisonProducts = normalized
                    .filter(
                        (p) =>
                            p.productFamilyId === familyId
                    )
                    .filter(
                        (p) =>
                            p.id !== currentId
                    )
                    .filter(
                        (p) =>
                            p.vendorId &&
                            p.vendorId !== currentVendorId
                    );

                /*
                 * Remove duplicate vendors.
                 * One vendor should appear only once.
                 */
                const uniqueVendors = [];

                const vendorMap = new Map();

                comparisonProducts.forEach((product) => {
                    const key = String(product.vendorId);

                    if (!vendorMap.has(key)) {
                        vendorMap.set(key, product);
                        uniqueVendors.push(product);
                    }
                });

                setProducts(uniqueVendors.slice(0, 6));
            } catch (error) {
                console.error(
                    "Failed to load product comparison:",
                    error
                );

                setProducts([]);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadComparison();

        return () => {
            cancelled = true;
        };
    }, [
        currentProduct,
        currentId,
        familyId,
        currentVendorId
    ]);

    const visibleProducts = useMemo(() => {
        if (!currentProduct || !familyId) {
            return [];
        }

        return [
            {
                id: currentId,
                vendorId: currentVendorId,

                vendorName:
                    currentProduct?.vendorName ??
                    currentProduct?.VendorName ??
                    currentProduct?.sellerName ??
                    currentProduct?.SellerName ??
                    "Current Seller",

                name:
                    currentProduct?.name ??
                    currentProduct?.Name ??
                    currentProduct?.productName ??
                    currentProduct?.ProductName,

                brand:
                    currentProduct?.brand ??
                    currentProduct?.Brand ??
                    "",

                model:
                    currentProduct?.model ??
                    currentProduct?.Model ??
                    "",

                sku:
                    currentProduct?.sku ??
                    currentProduct?.Sku ??
                    currentProduct?.SKU ??
                    "",

                price: Number(
                    currentProduct?.finalPrice ??
                    currentProduct?.FinalPrice ??
                    currentProduct?.price ??
                    currentProduct?.Price ??
                    0
                ),

                image:
                    currentProduct?.imageUrl ??
                    currentProduct?.ImageUrl ??
                    currentProduct?.image ??
                    currentProduct?.Image ??
                    "/images/no-image.png",

                current: true
            },

            ...products.map((p) => ({
                ...p,
                current: false
            }))
        ];
    }, [
        currentProduct,
        products,
        currentId,
        currentVendorId,
        familyId
    ]);

    /*
     * Important:
     * If there is only the current vendor,
     * don't render the section.
     */
    if (
        loading ||
        !familyId ||
        visibleProducts.length < 2
    ) {
        return null;
    }

    const formatPrice = (price) => {
        if (!price) return "—";

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <section className="mt-10">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 mb-4 px-1">
                <div>
                    <div className="flex items-center gap-2">
                        <Store
                            size={18}
                            className="text-indigo-600"
                        />

                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                            Compare Sellers
                        </h2>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Compare the same product from different vendors.
                    </p>
                </div>

                <span className="hidden sm:block text-xs text-slate-400">
                    {visibleProducts.length} sellers
                </span>
            </div>

            {/* Comparison */}
            <div className="
                overflow-hidden
                rounded-2xl
                border border-slate-200
                bg-white
                shadow-sm
            ">
                {/* Desktop */}
                <div className="hidden lg:grid grid-cols-[minmax(280px,2fr)_180px_180px_130px_100px] bg-slate-50 border-b border-slate-200">

                    <div className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Product
                    </div>

                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Vendor
                    </div>

                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Model
                    </div>

                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Price
                    </div>

                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Action
                    </div>
                </div>

                {visibleProducts.map((product) => (
                    <div
                        key={`${product.vendorId}-${product.id}`}
                        className={`
                            group
                            border-b border-slate-100
                            last:border-b-0
                            transition
                            hover:bg-slate-50
                        `}
                    >
                        {/* Desktop row */}
                        <div className="
                            hidden
                            lg:grid
                            grid-cols-[minmax(280px,2fr)_180px_180px_130px_100px]
                            items-center
                        ">
                            {/* Product */}
                            <div className="flex items-center gap-4 px-5 py-4 min-w-0">
                                <div className="
                                    w-14
                                    h-14
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    flex
                                    items-center
                                    justify-center
                                    shrink-0
                                    overflow-hidden
                                ">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {product.current && (
                                            <span className="
                                                inline-flex
                                                items-center
                                                gap-1
                                                rounded-full
                                                bg-emerald-50
                                                px-2
                                                py-0.5
                                                text-[10px]
                                                font-bold
                                                text-emerald-700
                                            ">
                                                <Check size={11} />
                                                Current
                                            </span>
                                        )}
                                    </div>

                                    <p className="font-semibold text-sm text-slate-900 truncate">
                                        {product.name}
                                    </p>

                                    {product.brand && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {product.brand}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Vendor */}
                            <div className="px-4">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                    {product.vendorName}
                                </p>
                            </div>

                            {/* Model */}
                            <div className="px-4">
                                <p className="text-xs text-slate-600 line-clamp-2">
                                    {product.model || "Standard"}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="px-4">
                                <p className="font-bold text-slate-900">
                                    {formatPrice(product.price)}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="px-4">
                                {product.current ? (
                                    <span className="
                                        text-xs
                                        font-semibold
                                        text-emerald-600
                                    ">
                                        Selected
                                    </span>
                                ) : (
                                    <button
                                        onClick={() =>
                                            onViewProduct?.(product.id)
                                        }
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1
                                            rounded-lg
                                            border
                                            border-slate-300
                                            px-3
                                            py-2
                                            text-xs
                                            font-semibold
                                            text-slate-700
                                            transition
                                            hover:border-indigo-500
                                            hover:text-indigo-600
                                        "
                                    >
                                        View
                                        <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile / Tablet card */}
                        <div className="
                            lg:hidden
                            p-4
                        ">
                            <div className="flex gap-3">
                                <div className="
                                    w-16
                                    h-16
                                    shrink-0
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    overflow-hidden
                                ">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {product.current && (
                                            <span className="
                                                text-[10px]
                                                font-bold
                                                text-emerald-600
                                            ">
                                                ✓ Current seller
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">
                                        {product.name}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {product.vendorName}
                                    </p>

                                    <p className="mt-2 text-base font-bold text-slate-900">
                                        {formatPrice(product.price)}
                                    </p>
                                </div>

                                {!product.current && (
                                    <button
                                        onClick={() =>
                                            onViewProduct?.(product.id)
                                        }
                                        className="
                                            self-center
                                            rounded-lg
                                            border
                                            border-slate-300
                                            p-2
                                            text-slate-600
                                            hover:border-indigo-500
                                            hover:text-indigo-600
                                        "
                                    >
                                        <ExternalLink size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}