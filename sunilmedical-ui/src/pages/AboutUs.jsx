import { ArrowUpRight, BadgeCheck, Building2, HeartPulse, ShieldCheck, Truck } from "lucide-react";
import StaticPageLayout, { Section } from "../components/StaticPageLayout";

const strengths = [
  { icon: HeartPulse, title: "Healthcare-focused", text: "A marketplace focused on medical equipment, healthcare supplies, consumables and disposables." },
  { icon: BadgeCheck, title: "Product discovery", text: "A convenient online destination to explore product information and connect with participating sellers." },
  { icon: Truck, title: "Pan-India reach", text: "An online shopping experience intended to serve customers across India, subject to product and delivery availability." },
  { icon: ShieldCheck, title: "Customer support", text: "A support channel for questions about products, orders and the marketplace experience." },
];

export default function AboutUs() {
  return <StaticPageLayout eyebrow="Who we are" title="Healthcare supplies, made easier to discover."
    intro="JEDE MEDTECH INDIA PRIVATE LIMITED operates TheMakeInIndia.in, an online marketplace for medical equipment, healthcare products, consumables and disposables.">
    <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Our platform</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">Connecting healthcare needs with product choices.</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">TheMakeInIndia.in is designed to help individuals, healthcare professionals, clinics, hospitals and institutions discover medical products online. Products may be listed and supplied by the company and/or independent marketplace sellers. Seller, product and delivery details are shown where applicable.</p>
    </div>
    <Section title="About JEDE MEDTECH">
      <p>JEDE MEDTECH INDIA PRIVATE LIMITED is focused on the medical technology and healthcare supply ecosystem. Through TheMakeInIndia.in, we aim to make product discovery and online purchasing more convenient for customers and to provide participating sellers with an online channel to present their offerings.</p>
    </Section>
    <Section title="Our mission">
      <p>To make healthcare products easier to discover and access through a convenient, transparent and customer-focused online marketplace.</p>
    </Section>
    <Section title="Our vision">
      <p>To build a trusted digital destination for medical equipment and healthcare supplies, supporting connections between customers and product suppliers across India.</p>
    </Section>
    <Section title="What you can find">
      <ul className="list-disc space-y-2 pl-5">
        <li>Medical equipment and devices.</li>
        <li>Medical consumables and disposable products.</li>
        <li>Healthcare supplies for professionals and institutions.</li>
        <li>Product listings from participating marketplace sellers.</li>
      </ul>
    </Section>
    <Section title="Why use TheMakeInIndia.in">
      <div className="grid gap-3 sm:grid-cols-2">
        {strengths.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-xl border border-slate-200 p-4">
          <Icon className="text-blue-700" size={21} /><h3 className="mt-3 font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6">{text}</p>
        </div>)}
      </div>
    </Section>
    <Section title="Our location">
      <div className="flex gap-3"><Building2 className="mt-1 shrink-0 text-blue-700" size={20}/><p>AMTZ Campus, Pragati Maidan, VM Steel Project S.O, Siddeswaram / Nadupuru, Visakhapatnam, Andhra Pradesh – 530031, India.</p></div>
      <a href="https://www.google.com/maps/search/?api=1&query=AMTZ+Campus+Visakhapatnam+Andhra+Pradesh+530031" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline">View location <ArrowUpRight size={15}/></a>
    </Section>
  </StaticPageLayout>;
}
