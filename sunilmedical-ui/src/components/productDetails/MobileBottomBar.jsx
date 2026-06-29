import { Zap } from "lucide-react";
import AddToCartButton from "../../components/AddToCartButton";

export default function MobileBottomBar({

    product,

    selectedVariant,

    onBuyNow

}) {

    if (!selectedVariant) return null;

    const discount =
        Number(product.discountPercentage ?? 0);

    const price =
        Number(selectedVariant.price ?? 0);

    const finalPrice =
        discount > 0
            ? price - (price * discount) / 100
            : price;

    return (<div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 lg:hidden">

        <div className="flex justify-between items-center mb-4">

            <div>

                <p className="text-2xl font-bold text-green-700">

                    ₹{finalPrice.toFixed(0)}

                </p>

                <p className="text-sm text-gray-500">

                    {selectedVariant.model}

                </p>

            </div>

        </div>

        <div className="grid grid-cols-2 gap-3">

            <AddToCartButton
                productId={product.id}
                variantId={selectedVariant.id}
                minQty={selectedVariant.minQuantity}
                maxQty={selectedVariant.maxQuantity}
                stepQty={selectedVariant.stepQuantity}
            />

            <button

                onClick={onBuyNow}

                className="
h-12
rounded-xl
bg-green-600
text-white
font-semibold
flex
items-center
justify-center
gap-2
hover:bg-green-700
transition
"

            >

                <Zap size={18} />

                Buy Now

            </button>

        </div>

    </div>);

}