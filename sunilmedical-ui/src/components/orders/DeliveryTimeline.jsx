import { ShoppingBag, Package, Truck, MapPin, CheckCircle2 } from "lucide-react";

const normalize = value => String(value ?? "").replace(/[\s_-]/g, "").toLowerCase();
const indexFor = status => {
    const s = normalize(status);
    if (s === "delivered") return 4;
    if (s === "outfordelivery") return 3;
    if (s === "shipped") return 2;
    if (s === "packed") return 1;
    if (["placed", "accepted", "pending", "processing"].includes(s)) return 0;
    return 0;
};
const latest = (items, field) => {
    const dates = items.map(x => x?.[field]).filter(Boolean).map(x => new Date(x)).filter(d => !Number.isNaN(d.getTime()));
    return dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
};
const fmt = date => date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";

export default function DeliveryTimeline({ item, items }) {
    const rows = Array.isArray(items) && items.length ? items : item ? [item] : [];
    if (!rows.length) return null;
    const statuses = rows.map(x => x.itemStatus ?? x.orderItemStatus ?? "Pending");
    const allDelivered = statuses.every(s => normalize(s) === "delivered");
    const sharedIndex = allDelivered ? 4 : Math.min(...statuses.map(indexFor));
    const steps = [
        { label: "Ordered", icon: ShoppingBag, date: latest(rows, "orderDate") },
        { label: "Packed", icon: Package, date: latest(rows, "packedDate") },
        { label: "Shipped", icon: Truck, date: latest(rows, "shippedDate") },
        { label: "Out for delivery", icon: MapPin, date: latest(rows, "outForDeliveryDate") },
        { label: "Delivered", icon: CheckCircle2, date: latest(rows, "deliveredDate") }
    ];
    return (
        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800">Delivery progress</h4>
            </div>
            <div className="relative">
                <div className="absolute left-[8%] right-[8%] top-4 h-1 rounded-full bg-slate-200" />
                <div className="absolute left-[8%] top-4 h-1 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(sharedIndex / 4) * 84}%` }} />
                <div className="relative grid grid-cols-5 gap-1">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const done = index <= sharedIndex;
                        return (
                            <div key={step.label} className="flex min-w-0 flex-col items-center text-center">
                                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}>
                                    <Icon size={15} />
                                </div>
                                <span className={`mt-2 text-[10px] font-semibold sm:text-xs ${done ? "text-emerald-700" : "text-slate-500"}`}>{step.label}</span>
                                <span className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">{fmt(step.date)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">One shared tracking timeline for {rows.length} item{rows.length === 1 ? "" : "s"} in this delivery group.</p>
        </section>
    );
}
