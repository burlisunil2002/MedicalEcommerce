import React, { useMemo } from "react";
import OrderItemCard from "./OrderItemCard";
import DeliveryTimeline from "./DeliveryTimeline";

const norm = value => String(value ?? "").replace(/[\s_-]/g, "").toLowerCase();

export default function OrderItems({
    items = [], order, overallStatus, onTrack, onCancel, onReturn, onReview, onBuyAgain
}) {
    const uniqueItems = useMemo(() => {
        if (!Array.isArray(items)) return [];
        const seen = new Set();
        return items.filter((item, index) => {
            if (!item) return false;
            const id = item.orderItemId ?? item.OrderItemId;
            const key = id != null ? `item-${id}` : `row-${index}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [items]);

    if (!uniqueItems.length) {
        return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No items found in this delivery group.</div>;
    }

    const statuses = uniqueItems.map(x => x.itemStatus ?? x.orderItemStatus);
    const groupStatus = statuses.every(s => norm(s) === "delivered")
        ? "Delivered"
        : statuses.some(s => norm(s) === "outfordelivery")
            ? "Out for delivery"
            : statuses[0] ?? overallStatus ?? "Processing";

    return (
        <div className="overflow-hidden bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3">
                <div>
                    <p className="text-sm font-bold text-slate-800">Delivery items</p>
                    <p className="text-xs text-slate-500">{uniqueItems.length} product{uniqueItems.length === 1 ? "" : "s"} in this delivery group</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${norm(groupStatus) === "delivered" ? "bg-emerald-100 text-emerald-700" : norm(groupStatus) === "outfordelivery" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>{groupStatus}</span>
            </div>
            <div className="divide-y divide-slate-100 px-4">
                {uniqueItems.map((item, index) => {
                    const id = item.orderItemId ?? item.OrderItemId;
                    return (
                        <div key={id != null ? `order-item-${id}` : `order-item-${index}`} className="py-4">
                            <OrderItemCard
                                order={order}
                                item={{ ...item, orderDate: item.orderDate ?? order?.orderDate }}
                                overallStatus={overallStatus}
                                onTrack={onTrack}
                                onCancel={onCancel}
                                onReturn={onReturn}
                                onReview={onReview}
                                onBuyAgain={onBuyAgain}
                                compact
                                hideStatusBadge
                            />
                        </div>
                    );
                })}
            </div>
            <div className="px-4 pb-4">
                <DeliveryTimeline items={uniqueItems.map(x => ({ ...x, orderDate: x.orderDate ?? order?.orderDate }))} />
            </div>
        </div>
    );
}
