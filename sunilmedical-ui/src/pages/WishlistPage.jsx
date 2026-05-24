import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function WishlistPage() {

    const { wishlist } = useWishlist();

    if (wishlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-5xl animate-bounce mb-4">💔</div>

                <h2 className="text-xl font-semibold">
                    Your wishlist is empty
                </h2>

                <p className="text-gray-500 text-sm mt-2">
                    Save products to see them here
                </p>

                <button
                    onClick={() => window.location.href = "/"}
                    className="mt-6 px-5 py-2 bg-black text-white rounded-lg text-sm"
                >
                    Explore Products
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-5">
            {wishlist.map(item => (
                <ProductCard key={item.id} p={item} />
            ))}
        </div>
    );
}