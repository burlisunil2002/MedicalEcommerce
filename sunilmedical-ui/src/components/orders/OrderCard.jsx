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
    const [invoiceAccessNotice, setInvoiceAccessNotice] = useState(null);

    const invoicesByBatch = sellerInvoices.reduce((groups, invoice) => {
        const batchId = batchIdOf(invoice);
        const key = batchId != null
            ? `batch-${batchId}`
            : `invoice-${invoiceIdOf(invoice) ?? invoice.invoiceNumber ?? groups.length}`;
        if (!groups.some((entry) => entry.key === key)) {
            groups.push({ key, invoice });
        }
        return groups;
    }, []);

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
                    <div className="mb-6 flex items-center justify-between">
                        <div><h3 className="text-xl font-bold text-slate-800">Ordered Items</h3><p className="mt-1 text-sm text-slate-500">{order.itemCount ?? order.items?.length ?? 0} item(s) in this order</p></div>
                        <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex"><PackageCheck size={18} />{overallStatus}</div>
                    </div>
                    <OrderItems items={order.items || []} overallStatus={overallStatus} onTrack={onTrack} onCancel={onCancel} onReturn={onReturn} onReview={onReview} onBuyAgain={onBuyAgain} order={order} />
                </div>

                <div className="min-w-0 border-t bg-slate-50"><PaymentSummary order={order} /></div>
                <div className="flex flex-col items-stretch justify-between gap-3 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5">
                    <div><h4 className="font-semibold text-slate-800">Payment Status</h4><p className="mt-1 text-slate-600">{order.paymentStatus || "-"}</p></div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onHelp?.(); }} className="w-full rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-100 sm:w-auto">Need Help</button>
                </div>

                <section className="border-t bg-white px-4 py-5 sm:px-6 sm:py-6" aria-label="Tax invoices by delivery batch">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-800 sm:text-lg">Tax Invoices by Delivery Batch</h4>
                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                Each delivery batch has its own seller tax invoice. Downloads become available only after that batch is delivered.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {invoicesLoading && (
                                <span className="text-xs text-slate-500 sm:text-sm" role="status">Loading…</span>
                            )}
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setInvoiceRefreshKey((value) => value + 1);
                                }}
                                disabled={invoicesLoading}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                            >
                                <RefreshCw size={14} className={invoicesLoading ? "animate-spin" : ""} />
                                Refresh status
                            </button>
                        </div>
                    </div>

                    {!invoicesLoading && invoiceLoadError && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 sm:p-4 sm:text-sm">
                            Unable to load tax invoices right now. Please refresh or try again later.
                        </p>
                    )}

                    {!invoicesLoading && !invoiceLoadError && invoicesByBatch.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500 sm:p-4 sm:text-sm">
                            No seller tax invoices are available for this order yet. They will appear here when generated for a delivery batch.
                        </p>
                    )}

                    {invoicesByBatch.length > 0 && (
                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {invoicesByBatch.map(({ key, invoice }) => {
                                const invoiceId = invoiceIdOf(invoice);
                                const delivered = isBatchDelivered(invoice);
                                const batchStatus = batchStatusOf(invoice);
                                const batchDeliveredAt = batchDeliveredAtOf(invoice);
                                const batchLabel = batchNumberOf(invoice);

                                return (
                                    <article
                                        key={key}
                                        className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="break-words text-sm font-bold text-slate-800">
                                                    {batchLabel}
                                                </p>
                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                    {invoice.invoiceNumber || "Invoice number unavailable"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {invoiceDateOf(invoice)
                                                        ? new Date(invoiceDateOf(invoice)).toLocaleDateString("en-IN")
                                                        : "Invoice date unavailable"}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${delivered
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-800"
                                                }`}>
                                                {delivered ? "Delivered" : "Not delivered"}
                                            </span>
                                        </div>

                                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                            <span className="font-semibold">Seller: </span>
                                            <span className="break-words">{invoiceSupplierOf(invoice)}</span>
                                            <p className="mt-1">Invoice total: <strong>₹{Number(invoice.invoiceTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                                            {batchDeliveredAt && (
                                                <p className="mt-1">
                                                    Delivered on {new Date(batchDeliveredAt).toLocaleDateString("en-IN")}
                                                </p>
                                            )}
                                            {!delivered && batchStatus && (
                                                <p className="mt-1 capitalize">Batch status: {batchStatus.replace(/([a-z])([A-Z])/g, "$1 $2")}</p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={!invoiceId || downloadingInvoiceId != null || !delivered}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                if (!delivered) {
                                                    setInvoiceAccessNotice({ batchLabel, batchStatus });
                                                    return;
                                                }
                                                downloadSellerInvoice(invoice);
                                            }}
                                            title="Download tax invoice PDF"
                                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Download size={16} />
                                            {downloadingInvoiceId === invoiceId ? "Downloading…" : "Download Tax Invoice"}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </>}

            {invoiceAccessNotice && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onClick={() => setInvoiceAccessNotice(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invoice-access-title"
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <PackageCheck size={24} />
                        </div>
                        <h3 id="invoice-access-title" className="text-center text-lg font-bold text-slate-900">
                            Tax invoice available after delivery
                        </h3>
                        <p className="mt-3 text-center text-sm leading-6 text-slate-600">
                            The tax invoice for <strong>{invoiceAccessNotice.batchLabel}</strong> can be downloaded only after this delivery batch is marked as delivered. Please check again once you have received the items.
                        </p>
                        {invoiceAccessNotice.batchStatus && (
                            <p className="mt-2 text-center text-xs text-slate-500"> 
                                Current batch status: {invoiceAccessNotice.batchStatus.replace(/([a-z])([A-Z])/g, "$1 $2")}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => setInvoiceAccessNotice(null)}
                            className="mt-5 min-h-11 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Okay, understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
