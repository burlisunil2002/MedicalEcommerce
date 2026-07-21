import { ShoppingBag } from "lucide-react";

export default function EmptyOrders({

    onContinueShopping

}) {

    return (

        <div className="rounded-3xl bg-white border shadow-sm p-16 text-center">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">

                <ShoppingBag

                    size={44}

                    className="text-blue-600"

                />

            </div>

            <h2 className="mt-8 text-3xl font-bold">

                No Orders Yet

            </h2>

            <p className="mt-3 text-slate-500">

                Looks like you haven't placed any orders yet.

            </p>

            <button

                onClick={onContinueShopping}

                className="mt-8 rounded-xl bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"

            >

                Continue Shopping

            </button>

        </div>

    );

}