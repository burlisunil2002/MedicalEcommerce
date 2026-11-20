import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Download, ArrowLeft } from "lucide-react";
import API from "../services/api";

const money = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default function InvoicePage() {
    const { id: invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const loadInvoice = useCallback(async () => {
        if (!invoiceId) {
            setLoadError("Invoice reference is missing.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setLoadError("");
            // Existing authenticated detail endpoint in SellerInvoicesController.
            const response = await API.get(`/api/seller-invoices/${encodeURIComponent(invoiceId)}`);
            setInvoice(response?.data ?? null);
        } catch (error) {
            console.error("Invoice load failed:", error);
            setInvoice(null);
            setLoadError(error?.response?.status === 404
                ? "This invoice was not found or is not available to your account."
                : "Unable to load this invoice. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => { loadInvoice(); }, [loadInvoice]);

    const downloadInvoice = async () => {
        if (!invoiceId || downloading) return;
        try {
            setDownloading(true);
            // The backend must expose this route and render the stored invoice snapshot as PDF.
            const response = await API.get(`/api/seller-invoices/${encodeURIComponent(invoiceId)}/download`, { responseType: "blob" });
            const contentType = response.headers?.["content-type"] || "application/pdf";
            if (!contentType.includes("pdf")) throw new Error("The server did not return a PDF file.");
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${String(invoice?.invoiceNumber || `Invoice-${invoiceId}`).replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error("Invoice download failed:", error);
            toast.error("Unable to download the invoice PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="mt-4 text-sm text-slate-600">Loading invoice…</p></div></main>;
    if (!invoice) return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-xl font-bold text-slate-800">Invoice unavailable</h1><p className="mt-2 text-slate-600">{loadError || "The requested invoice could not be loaded."}</p><Link to="/my-orders" className="mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2"><ArrowLeft size={16} />Back to orders</Link></main>;

    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const supplierName = invoice.supplierName || "Supplier";
    const customerName = invoice.customerName || "Customer";

    return <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link to="/my-orders" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={16} />Back to orders</Link>
                <button type="button" onClick={downloadInvoice} disabled={downloading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Download size={17} />{downloading ? "Downloading…" : "Download PDF"}</button>
            </div>

            <article className="rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
                <header className="flex flex-col justify-between gap-6 border-b pb-6 sm:flex-row">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Tax invoice</p><h1 className="mt-2 break-all text-2xl font-bold text-slate-900">{invoice.invoiceNumber || "Invoice"}</h1><p className="mt-2 text-sm text-slate-500">Issued {dateText(invoice.issuedAtUtc)}</p><p className="mt-1 text-sm text-slate-500">Order: {invoice.orderNumber || invoice.orderId || "-"}</p></div>
                    <div className="sm:max-w-xs sm:text-right"><h2 className="font-bold text-slate-900">{supplierName}</h2><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.supplierAddress || "-"}</p>{invoice.supplierGSTIN && <p className="mt-2 text-sm text-slate-600">GSTIN: {invoice.supplierGSTIN}</p>}</div>
                </header>

                <section className="grid gap-5 border-b py-6 sm:grid-cols-2">
                    <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</h3><p className="font-semibold text-slate-900">{customerName}</p><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.customerAddress || "-"}</p>{invoice.customerPhone && <p className="mt-1 text-sm text-slate-600">Phone: {invoice.customerPhone}</p>}{invoice.customerGSTIN && <p className="mt-1 text-sm text-slate-600">GSTIN: {invoice.customerGSTIN}</p>}</div>
                    <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Supply details</h3><p className="text-sm text-slate-700">Place of supply: {invoice.placeOfSupply || "-"}</p><p className="mt-1 text-sm text-slate-700">Status: {invoice.status || "Issued"}</p></div>
                </section>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead><tr className="bg-slate-100 text-left text-xs uppercase text-slate-600"><th className="p-3">#</th><th className="p-3">Product</th><th className="p-3">HSN</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit price</th><th className="p-3 text-right">Taxable</th><th className="p-3 text-right">GST %</th><th className="p-3 text-right">GST</th><th className="p-3 text-right">Line total</th></tr></thead>
                        <tbody>{items.map((item, index) => <tr key={item.sellerInvoiceItemId ?? item.orderItemId ?? index} className="border-b"><td className="p-3">{index + 1}</td><td className="p-3 font-medium text-slate-800">{item.productName || "-"}</td><td className="p-3">{item.hsnCode || "-"}</td><td className="p-3 text-right">{Number(item.quantity || 0)}</td><td className="p-3 text-right">{money(item.unitPrice)}</td><td className="p-3 text-right">{money(item.taxableAmount)}</td><td className="p-3 text-right">{Number(item.gstPercentage || 0).toFixed(2)}%</td><td className="p-3 text-right">{money(item.gstAmount)}</td><td className="p-3 text-right font-semibold">{money(item.lineTotal)}</td></tr>)}</tbody>
                    </table>
                    {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No invoice line items are available.</p>}
                </div>

                <section className="mt-8 flex justify-end">
                    <dl className="w-full max-w-sm space-y-3 rounded-xl bg-slate-50 p-5 text-sm">
                        <div className="flex justify-between gap-4"><dt className="text-slate-600">Taxable total</dt><dd className="font-medium">{money(invoice.taxableTotal)}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-600">GST total</dt><dd className="font-medium">{money(invoice.gstTotal)}</dd></div>
                        <div className="flex justify-between gap-4 border-t pt-3 text-base"><dt className="font-semibold text-slate-900">Invoice total</dt><dd className="font-bold text-slate-900">{money(invoice.invoiceTotal)}</dd></div>
                    </dl>
                </section>
                <footer className="mt-8 border-t pt-5 text-xs text-slate-500">This page displays the saved invoice snapshot. For an official copy, use Download PDF.</footer>
            </article>
        </div>
    </main>;
}
