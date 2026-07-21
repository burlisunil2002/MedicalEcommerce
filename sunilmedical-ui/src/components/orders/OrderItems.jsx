import OrderItemCard from "./OrderItemCard";

export default function OrderItems({

    items,

    order,

    overallStatus,

    onTrack,

    onCancel,

    onReturn,

    onReview,

    onBuyAgain

}) {

    if (!items?.length) {

        return (

            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">

                No items found in this order.

            </div>

        );

    }

    return (

        <div className="space-y-5">

            {

                items.map((item) => (

                    <OrderItemCard

                        key={item.orderItemId}

                        order={order}

                        item = {{
                                ...item,
                                orderDate: order.orderDate
                               }}

                        overallStatus={overallStatus}

                        onTrack={onTrack}

                        onCancel={onCancel}

                        onReturn={onReturn}

                        onReview={onReview}

                        onBuyAgain={onBuyAgain}

                    />

                ))

            }

        </div>

    );

}