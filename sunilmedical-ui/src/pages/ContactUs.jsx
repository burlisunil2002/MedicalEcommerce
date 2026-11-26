import { useState } from "react";
import { Mail, MapPin, Phone, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import StaticPageLayout, { Section } from "../components/StaticPageLayout";

const email = "aasraj2026@gmail.com";
const address = "AMTZ Campus, Pragati Maidan, VM Steel Project S.O, Siddeswaram / Nadupuru, Visakhapatnam, Andhra Pradesh 530031, India";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "General enquiry", message: "" });
  const [error, setError] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please complete your name, email and message."); return;
    }
    const subject = encodeURIComponent(`[TheMakeInIndia.in] ${form.subject}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not provided"}\n\n${form.message}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return <StaticPageLayout eyebrow="We're here to help" title="Contact our team"
    intro="Reach out for product enquiries, order assistance, seller-related questions or general support.">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <Mail className="text-cyan-300" size={22}/><p className="mt-4 text-xs uppercase tracking-wider text-slate-400">Email support</p>
        <a href={`mailto:${email}`} className="mt-1 block break-all font-semibold hover:text-cyan-300">{email}</a>
        <p className="mt-2 text-xs leading-5 text-slate-400">For product, order and customer service enquiries.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 p-5">
        <MapPin className="text-blue-700" size={22}/><p className="mt-4 text-xs uppercase tracking-wider text-slate-400">Registered / business address</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{address}</p>
        <a className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=AMTZ+Campus+Visakhapatnam+Andhra+Pradesh+530031">Get directions</a>
      </div>
    </div>

    <Section title="Send an enquiry">
      <p>Complete the form below. Your email application will open with the enquiry details ready to send.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *"><input name="name" value={form.name} onChange={update} required className={inputClass} placeholder="Your name"/></Field>
          <Field label="Email address *"><input type="email" name="email" value={form.email} onChange={update} required className={inputClass} placeholder="you@example.com"/></Field>
          <Field label="Phone number"><input name="phone" value={form.phone} onChange={update} className={inputClass} placeholder="+91"/></Field>
          <Field label="Enquiry type"><select name="subject" value={form.subject} onChange={update} className={inputClass}><option>General enquiry</option><option>Product enquiry</option><option>Order support</option><option>Return or refund</option><option>Seller support</option><option>Website feedback</option></select></Field>
        </div>
        <Field label="Message *"><textarea name="message" value={form.message} onChange={update} required rows={5} className={inputClass} placeholder="How can we help you?"/></Field>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 sm:w-auto"><Send size={16}/> Prepare email</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">This starter form uses your visitor's default email application. For direct website submissions and stored enquiries, connect it to a secure backend API.</p>
    </Section>
    <Section title="Other ways to reach us">
      <div className="flex flex-wrap gap-3">
        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"><Mail size={17}/> Email us</a>
        <a href="https://wa.me/919390630297" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"><MessageCircle size={17}/> WhatsApp</a>
      </div>
    </Section>
  </StaticPageLayout>;
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
function Field({ label, children }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
