import {
    Download,
    FileText,
    PlayCircle,
    ExternalLink,
} from "lucide-react";

export default function ProductDownload({ product }) {
    const quotationUrl = product?.quotationUrl || null;

    // Supports common API shapes without breaking the existing quotation URL.
    const videoUrls = [
        ...(Array.isArray(product?.videoUrls) ? product.videoUrls : []),
        ...(product?.videoUrl ? [product.videoUrl] : []),
    ].filter(Boolean);

    const uniqueVideoUrls = [...new Set(videoUrls)];

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:rounded-3xl">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/50 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Download size={19} />
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">
                            Resources
                        </p>
                        <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                            Downloads & Videos
                        </h2>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
                {quotationUrl && (
                    <a
                        href={quotationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-[92px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <FileText size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-slate-900">
                                Product Quotation
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                View or download quotation
                            </p>
                        </div>

                        <ExternalLink
                            size={17}
                            className="shrink-0 text-slate-400 transition group-hover:text-indigo-600"
                        />
                    </a>
                )}

                {uniqueVideoUrls.length > 0 &&
                    uniqueVideoUrls.map((url, index) => (
                        <div
                            key={`${url}-${index}`}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"
                        >
                            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-white">
                                <PlayCircle size={18} className="text-indigo-300" />
                                <span className="text-sm font-bold">
                                    Product Video{uniqueVideoUrls.length > 1 ? ` ${index + 1}` : ""}
                                </span>
                            </div>

                            <video
                                controls
                                playsInline
                                preload="metadata"
                                className="aspect-video w-full bg-black object-contain"
                            >
                                <source src={url} />
                                Your browser does not support video playback.
                            </video>
                        </div>
                    ))}

                {!quotationUrl && uniqueVideoUrls.length === 0 && (
                    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:col-span-2">
                        <div>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                                <Download size={19} />
                            </div>
                            <p className="mt-4 text-sm font-bold text-slate-700">
                                No resources available
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Quotations or product videos will appear here when available.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
