import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import {
    ChevronDown, ChevronUp, Calendar, Download, PackageCheck,
    CircleDollarSign, MapPin, Phone, User, RefreshCw
} from "lucide-react";
import OrderItems from "./OrderItems";
import PaymentSummary from "./PaymentSummary";
import { generateSellerInvoicePdf } from "../../utils/invoicePdf";

const invoiceIdOf = (invoice) => invoice?.sellerInvoiceId ?? invoice?.invoiceId;
const invoiceSupplierOf = (invoice) => invoice?.supplierName ?? invoice?.sellerName ?? "Seller";
const invoiceDateOf = (invoice) => invoice?.issuedAtUtc ?? invoice?.invoiceDate;

const batchIdOf = (invoice) =>
    invoice?.deliveryBatchId ??
    invoice?.batchId ??
    invoice?.deliveryBatch?.deliveryBatchId ??
    invoice?.deliveryBatch?.id ??
    null;

const batchNumberOf = (invoice) =>
    invoice?.batchNumber ??
    invoice?.deliveryBatchNumber ??
    invoice?.deliveryBatch?.batchNumber ??
    (batchIdOf(invoice) != null ? `Batch #${batchIdOf(invoice)}` : "Delivery batch");

const batchStatusOf = (invoice) =>
    String(
        invoice?.deliveryBatchStatus ??
        invoice?.batchStatus ??
        invoice?.deliveryBatch?.status ??
        invoice?.deliveryBatch?.deliveryStatus ??
        ""
    ).trim().toLowerCase();

const batchDeliveredAtOf = (invoice) =>
    invoice?.batchDeliveredAt ??
    invoice?.deliveredAt ??
    invoice?.deliveryBatch?.deliveredAt ??
    invoice?.deliveryBatch?.deliveredDate ??
    null;

const isBatchDelivered = (invoice) =>
    invoice?.canDownload === true &&
    batchStatusOf(invoice) === "delivered";

export default function OrderCard({
    order, overallStatus, onTrack, onCancel, onReturn,
    onReview, onBuyAgain, onHelp
}) {
    const [expanded, setExpanded] = useState(true);
    const [sellerInvoices, setSellerInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [invoiceLoadError, setInvoiceLoadError] = useState(false);
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0);

    const orderItems = Array.isArray(order?.items) ? order.items : [];

    const normalizeStatus = (value) =>
        String(value ?? "").replace(/[\s_-]/g, "").toLowerCase();

    const itemIdOf = (item) => item?.orderItemId ?? item?.OrderItemId;
    const sellerIdOf = (item) => item?.sellerId ?? item?.SellerId ?? item?.seller?.sellerId;
    const itemBatchIdOf = (item) => item?.deliveryBatchId ?? item?.DeliveryBatchId ?? item?.batchId;

    const deliveryDateOf = (item) =>
        item?.outForDeliveryDate ?? item?.OutForDeliveryDate ??
        item?.deliveredDate ?? item?.DeliveredDate ??
        item?.deliveryDate ?? item?.DeliveryDate;

    const dateKeyOf = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? null
            : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    const deliveryGroups = (() => {
        // Group items first, independently of invoices. Persisted batch ID is
        // authoritative; otherwise same seller + same calendar day + delivered
        // or out-for-delivery are shown together.
        const groups = new Map();
        orderItems.forEach((item, index) => {
            const rawId = itemIdOf(item);
            const batchId = itemBatchIdOf(item);
            const status = normalizeStatus(item?.itemStatus ?? item?.orderItemStatus);
            const seller = sellerIdOf(item) ?? item?.sellerName ?? item?.SellerName;
            const day = dateKeyOf(deliveryDateOf(item));
            let key;
            if (batchId != null) key = `batch-${batchId}`;
            else if (seller != null && day && ["outfordelivery", "delivered"].includes(status)) key = `seller-${seller}-${day}`;
            else key = `item-${rawId ?? index}`;
            if (!groups.has(key)) groups.set(key, { key, items: [], invoice: null });
            groups.get(key).items.push(item);
        });

        const result = [...groups.values()];
        // Attach each invoice to the best matching group without splitting a
        // same-seller/same-day delivery group into separate item cards.
        sellerInvoices.forEach(invoice => {
            const rows = Array.isArray(invoice?.items) ? invoice.items : [];
            const invoiceItemIds = new Set(rows.map(row => row?.orderItemId ?? row?.OrderItemId).filter(v => v != null).map(String));
            const batchId = batchIdOf(invoice);
            let target = null;
            if (batchId != null) target = result.find(g => g.items.some(item => String(itemBatchIdOf(item) ?? '') === String(batchId)));
            if (!target && invoiceItemIds.size) target = result.find(g => g.items.some(item => invoiceItemIds.has(String(itemIdOf(item)))));
            const sellerId = invoice?.sellerId ?? invoice?.SellerId ?? invoice?.seller?.sellerId;
            if (!target && sellerId != null) {
                const day = dateKeyOf(invoice?.batchOutForDeliveryDate ?? invoice?.outForDeliveryDate ?? invoice?.batchDeliveredAt ?? invoice?.deliveredAt ?? invoice?.issuedAtUtc ?? invoice?.invoiceDate);
                target = result.find(g => g.items.some(item => String(sellerIdOf(item) ?? '') === String(sellerId) && day && dateKeyOf(deliveryDateOf(item)) === day));
            }
            if (!target) {
                target = { key: `invoice-${invoiceIdOf(invoice) ?? invoice.invoiceNumber ?? result.length}`, items: [], invoice: null };
                result.push(target);
            }
            // Prefer an invoice that is actually tied to this batch; keep the
            // first invoice only to avoid putting duplicate invoice controls in one card.
            if (!target.invoice || (batchId != null && batchIdOf(target.invoice) == null)) target.invoice = invoice;
        });
        return result;
    })();

    useEffect(() => {
        if (!expanded || !order?.orderId) return undefined;
        const controller = new AbortController();
        let active = true;

        const loadSellerInvoices = async () => {
            setInvoicesLoading(true);
            setInvoiceLoadError(false);
            try {
                // This is the customer-order route already present in SellerInvoicesController.
                const response = await API.get(
                    `/api/seller-invoices/customer/order/${order.orderId}`,
                    { signal: controller.signal }
                );
                const rows = Array.isArray(response?.data)
                    ? response.data
                    : (response?.data?.invoices ?? response?.data?.data ?? []);
                if (active) {
                    setSellerInvoices(Array.isArray(rows) ? rows : []);
                }
            } catch (error) {
                if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
                    console.error("Unable to load seller invoices:", error);
                    if (active) {
                        setSellerInvoices([]);
                        setInvoiceLoadError(true);
                    }
                }
            } finally {
                if (active) setInvoicesLoading(false);
            }
        };

        loadSellerInvoices();
        return () => {
            active = false;
            controller.abort();
        };
    }, [expanded, order?.orderId, invoiceRefreshKey]);

    const downloadSellerInvoice = async (invoice) => {
        const invoiceId = invoiceIdOf(invoice);
        if (!invoiceId || downloadingInvoiceId != null) return;

        // canDownload is calculated by the server from invoice status + batch status.
        if (invoice.canDownload !== true || !isBatchDelivered(invoice)) {
            toast.info("This tax invoice will be available after the delivery batch is delivered.");
            return;
        }

        try {
            setDownloadingInvoiceId(invoiceId);
            await generateSellerInvoicePdf(invoice);
        } catch (error) {
            console.error("Seller invoice PDF generation failed:", error);
            toast.error(error?.message || "Unable to generate this tax invoice. Please try again.");
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    const getStatusBadge = () => {
        switch (overallStatus) {
            case "Delivered": return "bg-emerald-100 text-emerald-700";
            case "Out For Delivery": return "bg-orange-100 text-orange-700";
            case "Shipped": return "bg-blue-100 text-blue-700";
            case "Packed": return "bg-indigo-100 text-indigo-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            default: return "bg-amber-100 text-amber-700";
        }
    };

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            <div className="cursor-pointer p-4 sm:p-6" onClick={() => setExpanded((value) => !value)}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="break-words text-lg font-bold text-slate-800 sm:text-xl">{order.orderNumber}</h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge()}`}>{overallStatus}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 sm:mt-4 sm:gap-6 sm:text-sm">
                            <div className="flex items-center gap-2"><Calendar size={18} />{order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN") : "-"}</div>
                            <div className="flex items-center gap-2"><PackageCheck size={18} />{order.itemCount ?? order.items?.length ?? 0} Items</div>
                            <div className="flex items-center gap-2"><CircleDollarSign size={18} />₹{Number(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    <button type="button" aria-label={expanded ? "Collapse order" : "Expand order"}
                        className="self-start rounded-full p-3 hover:bg-slate-100 lg:self-auto"
                        onClick={(event) => { event.stopPropagation(); setExpanded((value) => !value); }}>
                        {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>
                </div>
            </div>

            {expanded && <>
                <div className="border-t bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="mb-5 flex items-center gap-3"><MapPin className="text-blue-600" size={22} /><h3 className="text-lg font-semibold">Delivery Address</h3></div>
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2"><User size={18} className="text-emerald-600" /><span className="font-semibold">Customer Details</span></div>
                            <p className="font-semibold text-slate-800">{order.deliveryAddress?.fullName || "-"}</p>
                            <p className="mt-2 flex items-center gap-2 text-slate-600"><Phone size={16} />{order.deliveryAddress?.mobileNumber || "-"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center justify-between"><span className="font-semibold">Shipping Address</span>
                                {order.deliveryAddress?.addressType && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{order.deliveryAddress.addressType}</span>}
                            </div>
                            {order.deliveryAddress ? <>
                                <p className="text-slate-700">{order.deliveryAddress.addressLine1}</p>
                                {order.deliveryAddress.addressLine2 && <p className="mt-1 text-slate-700">{order.deliveryAddress.addressLine2}</p>}
                                {order.deliveryAddress.landmark && <p className="mt-2 text-slate-500"><strong>Landmark:</strong> {order.deliveryAddress.landmark}</p>}
                                <p className="mt-2 text-slate-700">{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                            </> : <p className="text-slate-500">Delivery address not available.</p>}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-5 sm:px-6 sm:py-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div><h3 className="text-xl font-bold text-slate-800">Ordered Items</h3><p className="mt-1 text-sm text-slate-500">{order.itemCount ?? orderItems.length} item(s) in this order</p></div>
                        <div className="flex items-center gap-2 self-start">
                            {invoicesLoading && <span className="text-xs text-slate-500" role="status">Refreshing invoices…</span>}
                            <button type="button" onClick={(event) => { event.stopPropagation(); setInvoiceRefreshKey((value) => value + 1); }} disabled={invoicesLoading}
                                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                <RefreshCw size={14} className={invoicesLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                    </div>
                    {invoiceLoadError && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Invoice status could not be refreshed. Your order items are still shown.</p>}
                    <div className="space-y-4">
                        {deliveryGroups.map(({ key, items, invoice }) => {
                            const invoiceId = invoice ? invoiceIdOf(invoice) : null;
                            const delivered = invoice ? isBatchDelivered(invoice) : false;
                            const batchLabel = invoice ? batchNumberOf(invoice) : "Delivery group";
                            const batchStatus = invoice ? batchStatusOf(invoice) : "";
                            return (
                                <section key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    {items.length > 0 && <div className="p-2 sm:p-3">
                                        <OrderItems items={items} overallStatus={overallStatus} onTrack={onTrack} onCancel={onCancel} onReturn={onReturn} onReview={onReview} onBuyAgain={onBuyAgain} order={order} />
                                    </div>}
                                    {invoice ? (
                                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800">{batchLabel} · {invoiceSupplierOf(invoice)}</p>
                                                <p className="mt-1 break-all text-xs text-slate-500">{invoice.invoiceNumber || "Invoice number unavailable"} · Invoice total ₹{Number(invoice.invoiceTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className={`mt-1 text-xs font-semibold ${delivered ? "text-emerald-700" : "text-amber-700"}`}>{delivered ? "Delivery completed · Invoice ready" : `Invoice available after batch delivery${batchStatus ? ` · Current status: ${batchStatus}` : ""}`}</p>
                                            </div>
                                            <button type="button" disabled={!invoiceId || downloadingInvoiceId != null || !delivered}
                                                onClick={(event) => { event.stopPropagation(); downloadSellerInvoice(invoice); }}
                                                title={delivered ? "Download this delivery batch tax invoice" : "Available after this batch is delivered"}
                                                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                                                <Download size={16} /> {downloadingInvoiceId === invoiceId ? "Preparing…" : "Tax Invoice"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">Tax invoice</p>
                                                <p className="mt-0.5 text-xs text-slate-500">The invoice has not been returned by the server for this delivery batch yet.</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </div>

                <div className="min-w-0 border-t bg-slate-50"><PaymentSummary order={order} /></div>
                <div className="flex flex-col items-stretch justify-between gap-3 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5">
                    <div><h4 className="font-semibold text-slate-800">Payment Status</h4><p className="mt-1 text-slate-600">{order.paymentStatus || "-"}</p></div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onHelp?.(); }} className="w-full rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-100 sm:w-auto">Need Help</button>
                </div>


            </>}

        </div>
    );
}
