export default function CartSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">

            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 bg-white p-4 rounded-xl shadow">

                    <div className="w-24 h-24 bg-gray-200 rounded"></div>

                    <div className="flex flex-col flex-grow gap-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>

                        <div className="flex gap-2 mt-2">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                </div>
            ))}

        </div>
    );
}