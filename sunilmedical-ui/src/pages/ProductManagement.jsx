import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function ProductManagement() {

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {

            const res =
                await API.get(
                    "/api/products/manage"
                );

            setProducts(
                res.data.products || []
            );
        }
        catch (err) {
            console.error(err);
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
                `/api/products/${id}`
            );

            setProducts(prev =>
                prev.filter(x =>
                    x.id !== id
                )
            );

            alert(
                "Product deleted successfully"
            );

        } catch {

            alert(
                "Unable to delete product"
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
            from-indigo-900
            via-slate-900
            to-black
            p-6
            text-white
        ">

            {/* Header */}

            <div className="
                max-w-7xl
                mx-auto
                mb-8
                flex
                justify-between
                items-center
                flex-wrap
                gap-4
            ">

                <div>

                    <h1 className="
                        text-3xl
                        font-bold
                    ">
                        📦 Product Management
                    </h1>

                    <p className="
                        text-gray-300
                        text-sm
                    ">
                        Manage all your products,
                        variants & stock
                    </p>

                </div>

                <button
                    onClick={() =>
                        navigate(
                            "/admin/add-product"
                        )
                    }
                    className="
                        px-6
                        py-3
                        bg-gradient-to-r
                        from-pink-500
                        to-red-500
                        rounded-xl
                        font-semibold
                        shadow-lg
                    "
                >
                    + Add Product
                </button>

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
                            bg-white/10
                            uppercase
                            text-xs
                            text-gray-300
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

                            {products.map(item => {

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

                                        <td className="
                                            px-6
                                            py-4
                                        ">

                                            <div className="
                                                flex
                                                gap-2
                                                justify-center
                                            ">

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/edit-product/${item.id}`
                                                        )
                                                    }
                                                    className="
                                                        px-3
                                                        py-1
                                                        bg-yellow-400
                                                        text-black
                                                        rounded-lg
                                                        text-xs
                                                    "
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        deleteProduct(
                                                            item.id
                                                        )
                                                    }
                                                    className="
                                                        px-3
                                                        py-1
                                                        bg-red-500
                                                        text-white
                                                        rounded-lg
                                                        text-xs
                                                    "
                                                >
                                                    Delete
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