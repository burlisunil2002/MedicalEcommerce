import { Link, NavLink } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

const links = [
  { to: "/about-us", label: "About Us" },
  { to: "/contact-us", label: "Contact Us" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/refund-cancellation", label: "Refund & Cancellation" },
];

export default function StaticPageLayout({ eyebrow, title, intro, updated = "26 November 2026", children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <ShieldCheck size={15} /> JEDE MEDTECH INDIA PRIVATE LIMITED
          </div>
          <p className="mb-3 text-sm font-semibold text-cyan-300">{eyebrow}</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          {intro && <p className="mt-5 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">{intro}</p>}
          <p className="mt-6 text-xs text-blue-200">Last updated: {updated}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28">
          <p className="px-3 pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Explore</p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "bg-blue-50 text-blue-800 ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-5 hidden rounded-xl bg-slate-950 p-4 text-white lg:block">
            <p className="text-sm font-semibold">Need assistance?</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Our support team can help with website, order and product enquiries.</p>
            <Link to="/contact-us" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-white">
              Contact support <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="policy-content">{children}</div>
          <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
            Questions? Email <a className="font-semibold text-blue-700 hover:underline" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a>.
          </div>
        </main>
      </div>
    </div>
  );
}

export function Section({ id, title, children }) {
  return <section id={id} className="scroll-mt-28 border-b border-slate-100 py-6 first:pt-0 last:border-0">
    <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
  </section>;
}
