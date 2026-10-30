import React, { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Admin Audit Log Report
 *
 * Expected API:
 * GET /api/admin/audit-logs?page=1&pageSize=20&search=&role=&module=&action=&status=&from=&to=
 *
 * Expected response:
 * {
 *   items: [{
 *     id, eventId, userId, userName, userRole, action, module,
 *     entityType, entityId, description, status, createdAt
 *   }],
 *   total: 125, page: 1, pageSize: 20
 * }
 *
 * The API must enforce Admin authorization and apply filters/pagination on the
 * server. Adjust normalizeResponse() if your API uses different property names.
 */

const DEFAULT_API_URL = "/api/admin/audit-logs";
const PAGE_SIZES = [10, 20, 50, 100];

function normalizeResponse(payload) {
  const items = payload?.items ?? payload?.data ?? payload?.results ?? [];
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(payload?.total ?? payload?.totalCount ?? items.length ?? 0),
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.pageSize ?? payload?.limit ?? 20),
  };
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function shortId(value) {
  if (!value) return "—";
  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 8)}…${text.slice(-6)}` : text;
}

function StatusPill({ status }) {
  const value = String(status || "Unknown").toLowerCase();
  const styles =
    value === "success" || value === "succeeded"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : value === "failed" || value === "failure" || value === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-600/20"
      : value === "warning" || value === "pending"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : "bg-slate-100 text-slate-700 ring-slate-500/20";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
}

function Icon({ name, className = "h-4 w-4" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    filter: <><path d="M4 5h16M7 12h10m-7 7h4" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

function buildQuery(filters, page, pageSize) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.role) params.set("role", filters.role);
  if (filters.module) params.set("module", filters.module);
  if (filters.action) params.set("action", filters.action);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  // Always request newest records first. The server must also enforce this.
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "desc");
  return params.toString();
}

export default function AuditLogReport({
  apiUrl = DEFAULT_API_URL,
  getAuthHeaders,
  onExport,
}) {
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    module: "",
    action: "",
    status: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchLogs = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const query = buildQuery(filters, page, pageSize);
      const headers = typeof getAuthHeaders === "function" ? getAuthHeaders() : {};
      const response = await fetch(`${apiUrl}?${query}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...(headers || {}) },
        signal,
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("You are not authorized to view audit logs.");
        }
        throw new Error(`Unable to load audit logs (HTTP ${response.status}).`);
      }
      const payload = await response.json();
      const result = normalizeResponse(payload);
      // Keep newest first in the UI as a defensive fallback.
      result.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRows(result.items);
      setTotal(result.total);
    } catch (err) {
      if (err.name !== "AbortError") {
        setRows([]);
        setTotal(0);
        setError(err.message || "Something went wrong while loading audit logs.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiUrl, filters, page, pageSize, getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchLogs(controller.signal), 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchLogs, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", role: "", module: "", action: "", status: "", from: "", to: "" });
    setPage(1);
  };

  const exportCsv = () => {
    if (onExport) {
      onExport({ filters, sortBy: "createdAt", sortDirection: "desc" });
      return;
    }
    const columns = ["userId", "userName", "userRole", "eventId", "action", "module", "entityType", "description", "status", "createdAt"];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.join(","),
      ...rows.map((row) => columns.map((key) => escapeCsv(row[key] ?? (key === "userRole" ? row.role : ""))).join(",")),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit-logs-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = useMemo(
    () => Object.values(filters).some((value) => String(value).trim() !== ""),
    [filters]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/80 via-slate-100 to-cyan-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-2xl border border-white/70 bg-white/65 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Icon name="shield" className="h-4 w-4" />
              Administration <Icon name="chevron" className="h-3 w-3" /> Audit & Compliance
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Audit Log Report</h1>
            <p className="mt-1 text-sm text-slate-500">Search and review customer activity, event history and administrative actions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Icon name="refresh" /> Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0 || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Icon name="download" /> Export CSV
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="filter" className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Filter audit records</h2>
              <p className="ml-2 hidden text-xs text-slate-500 sm:block">Search by customer, user ID, event ID or activity description</p>
            </div>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="lg:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Search</span>
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder="User, ID, event, description, entity…"
                  className="w-full rounded-xl border border-white/80 bg-white/80 py-3 pl-10 pr-3 text-sm shadow-inner shadow-slate-100 outline-none placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100/80"
                />
              </div>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Role</span>
              <select value={filters.role} onChange={(e) => updateFilter("role", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                <option value="">All roles</option><option>Admin</option><option>Seller</option><option>Customer</option><option>Staff</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Status</span>
              <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                <option value="">All statuses</option><option value="Success">Success</option><option value="Failed">Failed</option><option value="Warning">Warning</option><option value="Pending">Pending</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Module</span>
              <input value={filters.module} onChange={(e) => updateFilter("module", e.target.value)} placeholder="e.g. Orders" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Action</span>
              <input value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} placeholder="e.g. Create, Update, Delete" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">From date</span>
              <div className="relative"><Icon name="calendar" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => updateFilter("from", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">To date</span>
              <div className="relative"><Icon name="calendar" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => updateFilter("to", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Activity history</h2>
              <p className="mt-0.5 text-xs text-slate-500">Sorted by created date · newest to oldest</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Rows per page
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500">
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <div role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="font-semibold">Could not load audit records</div>
              <div className="mt-1">{error}</div>
              <button type="button" onClick={() => setReloadKey((v) => v + 1)} className="mt-2 font-semibold underline">Try again</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Entity type</th>
                  <th className="px-4 py-3 min-w-[260px]">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 min-w-[175px]">Created at</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 11 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-3 w-20 rounded bg-slate-200" /></td>)}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon name="shield" className="h-5 w-5" /></div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">No audit records found</p>
                    <p className="mt-1 text-xs text-slate-500">{hasFilters ? "Try changing or clearing your filters." : "Audit activity will appear here when available."}</p>
                  </td></tr>
                ) : rows.map((row, index) => (
                  <tr key={row.id ?? row.eventId ?? `${row.createdAt}-${index}`} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="text-sm font-semibold text-slate-800">{row.userName || row.username || "System"}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{row.userRole || row.role || "—"}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600" title={row.userId || ""}>{shortId(row.userId)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600" title={row.eventId || ""}>{shortId(row.eventId)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.userRole || row.role || "—"}</td>
                    <td className="px-4 py-3.5"><span className="inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{row.action || "—"}</span></td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.module || "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.entityType || "—"}</td>
                    <td className="max-w-[340px] px-4 py-3.5 text-sm text-slate-600"><span className="line-clamp-2" title={row.description || ""}>{row.description || "—"}</span></td>
                    <td className="px-4 py-3.5"><StatusPill status={row.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs tabular-nums text-slate-600">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3.5"><button type="button" onClick={() => setSelected(row)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-700">{startRecord}–{endRecord}</span> of <span className="font-semibold text-slate-700">{total.toLocaleString()}</span> records</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(1)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">First</button>
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((v) => Math.max(1, v - 1))} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Previous</button>
              <span className="px-2 text-xs font-semibold tabular-nums text-slate-700">{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((v) => Math.min(totalPages, v + 1))} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Next</button>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(totalPages)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Last</button>
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Audit record details</p><h2 id="audit-detail-title" className="mt-1 text-lg font-bold text-slate-950">{selected.action || "Activity"} · {selected.module || "Module"}</h2></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Icon name="close" /></button>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["User ID", selected.userId], ["Username", selected.userName || selected.username],
                ["Role", selected.userRole || selected.role], ["Event ID", selected.eventId],
                ["Action", selected.action], ["Module", selected.module],
                ["Entity type", selected.entityType], ["Entity ID", selected.entityId],
                ["Status", selected.status], ["Created at", formatDateTime(selected.createdAt)],
              ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{value || "—"}</dd></div>)}
              <div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{selected.description || "—"}</dd></div>
            </dl>
            <div className="mt-6 flex justify-end"><button type="button" onClick={() => setSelected(null)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Close</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
