import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function ProductManagement() {

    const navigate = useNavigate();

    const [search, setSearch] = useState("");

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {

            const res =
                await API.get(
                    "/api/product-management"
                );

            setProducts(
                res.data.products || []
            );
        }
        catch (err) {

            console.log(err.response);

            alert(
                err.response?.data?.message ||
                err.message
            );
        }
        finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {

        if (
            !window.confirm(
                "Delete this product?"
            )
        )
            return;

        try {

            await API.delete(
                `/api/products/delete/${id}`
            );

            setProducts(prev =>
                prev.filter(x =>
                    x.id !== id
                )
            );

            alert(
                "Product deleted successfully"
            );

        }

           catch (err) {

                console.log(err);

                alert(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message
                );
            }
    };

    const filteredProducts = products.filter(item => {

        const text = search.toLowerCase();

        return (
            item.name?.toLowerCase().includes(text) ||
            item.brand?.toLowerCase().includes(text) ||
            item.category?.toLowerCase().includes(text) ||
            item.description?.toLowerCase().includes(text) ||
            item.hsnCode?.toLowerCase().includes(text) ||
            item.variants?.some(v =>
                v.model?.toLowerCase().includes(text)
            )
        );
    });

    const toggleStatus = async (id) => {
        try {
            const res = await API.put(
                `/api/products/change-status/${id}`
            );

            setProducts(prev =>
                prev.map(p =>
                    p.id === id
                        ? {
                            ...p,
                            status: res.data.status
                        }
                        : p
                )
            );
        } catch (err) {
            alert(
                err.response?.data?.message ||
                err.message
            );
        }
    };

    if (loading) {
        return (
            <div className="
                min-h-screen
                flex
                items-center
                justify-center
                bg-slate-900
                text-white
            ">
                Loading Products...
            </div>
        );
    }

    return (
        <div className="
    min-h-screen
    bg-gradient-to-br
    from-slate-950
    via-indigo-950
    to-slate-900
    p-8
">

            {/* Header */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">
                        Product Management
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Manage products, variants and inventory
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin/add-product")}
                    className="
      flex items-center gap-2
      px-6 py-3
      rounded-2xl
      bg-blue-600 hover:bg-blue-700
      text-white font-semibold
      shadow-lg
    "
                >
                    ➕ Add Product
                </button>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

                <div className="bg-white/10 rounded-3xl p-6">
                    <p className="text-slate-400">Total Products</p>
                    <h2 className="text-4xl font-bold text-white mt-2">
                        {products.length}
                    </h2>
                </div>

                <div className="bg-white/10 rounded-3xl p-6">
                    <p className="text-slate-400">Active Products</p>
                    <h2 className="text-4xl font-bold text-green-400 mt-2">
                        {
                            products.filter(
                                p => p.status === "Active"
                            ).length
                        }
                    </h2>
                </div>

                <div className="bg-white/10 rounded-3xl p-6">
                    <p className="text-slate-400">Inactive</p>
                    <h2 className="text-4xl font-bold text-red-400 mt-2">
                        {
                            products.filter(
                                p => p.status !== "Active"
                            ).length
                        }
                    </h2>
                </div>

                <div className="bg-white/10 rounded-3xl p-6">
                    <p className="text-slate-400">Total Variants</p>
                    <h2 className="text-4xl font-bold text-blue-400 mt-2">
                        {
                            products.reduce(
                                (sum, p) =>
                                    sum + (p.variants?.length || 0),
                                0
                            )
                        }
                    </h2>
                </div>

            </div>

            <div className="
  flex items-center
  bg-white/10
  border border-white/20
  rounded-2xl
  px-5 py-4
  mb-8
">
                <span className="text-slate-400 mr-3">
                    🔍
                </span>

                <input
                    type="text"
                    placeholder="Search by name, brand, category..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="
      w-full
      bg-transparent
      text-white
      placeholder:text-slate-400
      outline-none
    "
                />
            </div>


            {/* Table */}

            <div className="
                max-w-7xl
                mx-auto
                backdrop-blur-xl
                bg-white/10
                border
                border-white/20
                rounded-3xl
                overflow-hidden
            ">

                <div className="overflow-x-auto">

                    <table className="
                        w-full
                        text-sm
                    ">

                        <thead className="
  bg-slate-800/70
  text-slate-300
  uppercase
  text-xs
  sticky top-0
">

                            <tr>

                                <th className="px-6 py-4">
                                    Image
                                </th>

                                <th className="px-6 py-4">
                                    Product
                                </th>

                                <th className="px-6 py-4">
                                    Price
                                </th>

                                <th className="px-6 py-4">
                                    Variants
                                </th>

                                <th className="px-6 py-4">
                                    Stock
                                </th>

                                <th className="px-6 py-4">
                                    GST
                                </th>

                                <th className="px-6 py-4">
                                    Status
                                </th>

                                <th className="px-6 py-4">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredProducts.map(item => { 

                                const variants =
                                    item.variants || [];

                                const hasVariants =
                                    variants.length > 0;

                                const prices =
                                    variants.map(
                                        x => x.price
                                    );

                                const minPrice =
                                    hasVariants
                                        ? Math.min(...prices)
                                        : 0;

                                const maxPrice =
                                    hasVariants
                                        ? Math.max(...prices)
                                        : 0;

                                const totalStock =
                                    variants.reduce(
                                        (sum, x) =>
                                            sum +
                                            x.stockQuantity,
                                        0
                                    );

                                return (

                                    <tr
                                        key={item.id}
                                        className="
                                            border-b
                                            border-white/10
                                            hover:bg-white/10
                                        "
                                    >

                                        <td className="px-6 py-4">

                                            <img
                                                src={
                                                    item.imageUrl ||
                                                    "/images/no-image.png"
                                                }
                                                alt=""
                                                className="
                                                    h-14
                                                    w-14
                                                    rounded-xl
                                                    object-cover
                                                "
                                            />

                                        </td>

                                        <td className="px-6 py-4">

                                            <div className="font-semibold">
                                                {item.name}
                                            </div>

                                            <div className="
                                                text-xs
                                                text-gray-400
                                            ">
                                                {item.category}
                                            </div>

                                        </td>

                                        <td className="
                                            px-6
                                            py-4
                                            text-green-400
                                            font-semibold
                                        ">

                                            {
                                                item.priceType?.toLowerCase() ===
                                                    "normal"
                                                    ? (
                                                        <>
                                                            ₹
                                                            {minPrice.toLocaleString()}

                                                            {
                                                                maxPrice >
                                                                minPrice &&
                                                                (
                                                                    <>
                                                                        {" "}
                                                                        -
                                                                        ₹
                                                                        {maxPrice.toLocaleString()}
                                                                    </>
                                                                )
                                                            }
                                                        </>
                                                    )
                                                    : (
                                                        <span className="text-red-400">
                                                            Ask Price
                                                        </span>
                                                    )
                                            }

                                        </td>

                                        <td className="px-6 py-4">

                                            <span className="
                                                px-3
                                                py-1
                                                bg-blue-500/20
                                                text-blue-300
                                                rounded-full
                                            ">
                                                {variants.length}
                                            </span>

                                        </td>

                                        <td className="px-6 py-4">
                                            {totalStock} units
                                        </td>

                                        <td className="px-6 py-4">
                                            {item.gstPercentage}%
                                        </td>

                                        <td className="px-6 py-4">

                                            <span
                                                className={`
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    text-xs
                                                    ${item.status === "Active"
                                                        ? "bg-green-500/20 text-green-300"
                                                        : "bg-red-500/20 text-red-300"
                                                    }
                                                `}
                                            >
                                                {item.status}
                                            </span>

                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/products/edit/${item.id}`
                                                        )
                                                    }
                                                    className="
        bg-amber-500
        hover:bg-amber-600
        px-4 py-2
        rounded-xl
        text-black
        font-medium
      "
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => toggleStatus(item.id)}
                                                    className={`px-4 py-2 rounded-xl font-medium ${item.status === "Active"
                                                            ? "bg-red-500 hover:bg-red-600 text-white"
                                                            : "bg-green-500 hover:bg-green-600 text-white"
                                                        }`}
                                                >
                                                    {item.status === "Active"
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>

                                            </div>
                                        </td>
                                        </tr>
                                );
                            })}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}