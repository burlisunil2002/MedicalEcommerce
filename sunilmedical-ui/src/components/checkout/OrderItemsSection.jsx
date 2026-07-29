export default function OrderItemsSection({
    items = []
}) {
  

    if (!items.length) return null;

    return (

        <div className="bg-white rounded-3xl shadow-sm p-6">

            <div className="flex items-center justify-between mb-6">

                <h2 className="text-2xl font-bold">

                    Order Items

                </h2>

                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full font-semibold">

                    {items.length} Item{items.length > 1 ? "s" : ""}

                </span>

            </div>

            <div className="space-y-5">

                {items.map(item => (

                    <div
                        key={item.id}
                        className="flex gap-5 border rounded-2xl p-4 hover:shadow-md transition"
                    >

                        <img
                            src={item.variantImage}
                            alt={item.productName}
                            className="w-24 h-24 rounded-xl object-cover border"
                        />

                        <div className="flex-1">

                            <h3 className="font-semibold text-lg">

                                {item.productName}

                            </h3>

                            {item.variantName && (

                                <p className="text-gray-500 mt-1">

                                    Variant :
                                    <span className="font-medium">

                                        {" "}
                                        {item.variantName}

                                    </span>

                                </p>

                            )}

                            <div className="flex gap-6 mt-3 text-sm">

                                <span>

                                    Qty :

                                    <strong>

                                        {" "}
                                        {item.quantity}

                                    </strong>

                                </span>

                                <span>

                                    Price :

                                    <strong className="text-emerald-600">

                                        ₹{item.productFinalPrice}

                                    </strong>

                                </span>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}