import React from "react";
import { ArrowRight, ShieldCheck, Truck, Package, BarChart3, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function SellerLanding() {

    const navigate = useNavigate();
  const features = [
    { icon: <Package className="w-8 h-8 text-blue-600"/>, title:"Easy Product Listing", desc:"Add and manage your medical products in minutes."},
    { icon: <ShieldCheck className="w-8 h-8 text-blue-600"/>, title:"Verified Marketplace", desc:"Trusted buyers and secure transactions."},
    { icon: <Truck className="w-8 h-8 text-blue-600"/>, title:"Logistics Support", desc:"Deliver products across India with ease."},
    { icon: <BarChart3 className="w-8 h-8 text-blue-600"/>, title:"Sales Analytics", desc:"Track orders, revenue and performance."},
    { icon: <BadgeCheck className="w-8 h-8 text-blue-600"/>, title:"Fast Payments", desc:"Receive payments securely and on time."},
    { icon: <ShieldCheck className="w-8 h-8 text-blue-600"/>, title:"Business Growth", desc:"Reach hospitals, clinics and distributors."},
  ];

  const categories = [
    "Consumables",
    "Diagnostic Equipment",
    "Hospital Furniture",
    "Surgical Instruments",
    "Laboratory Products",
    "Medical Devices",
  ];

  return (
    <div className="bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_45%)]"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur">
              India's Trusted Medical Marketplace
            </span>
            <h1 className="text-5xl font-extrabold mt-6 leading-tight">
              Grow Your Medical Business Online
            </h1>
            <p className="mt-6 text-lg text-blue-100">
              Sell medical products to hospitals, clinics and distributors across India through a secure and modern marketplace.
            </p>
            <div className="flex gap-4 mt-8">
                          <button
                              onClick={() => navigate("/seller-register")}
                              className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition duration-300 flex items-center gap-2"
                          >
                              Start Selling
                              <ArrowRight size={18} />
                          </button>
                          <button
                              onClick={() => navigate("/seller-login")}
                              className="border border-white px-6 py-3 rounded-xl hover:bg-white hover:text-blue-700 transition duration-300"
                          >
                              Sign In
                          </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                ["10K+","Products"],
                ["5K+","Buyers"],
                ["100+","Sellers"]
              ].map(([n,l])=>(
                <div key={l} className="bg-white/10 rounded-xl p-4 backdrop-blur">
                  <div className="text-2xl font-bold">{n}</div>
                  <div className="text-sm text-blue-100">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
                      <img
                          loading="lazy"
                          src="/images/sellerimage.jpg"
                          alt="Medical Seller"
                          className="rounded-3xl shadow-2xl border border-white/20 object-cover w-full"
                      />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center">Why Sell With Us?</h2>
        <p className="text-center text-gray-500 mt-3">Everything you need to grow your business.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {features.map((f)=>(
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow hover:-translate-y-3 duration-300 ease-in-out hover:shadow-xl transition">
              {f.icon}
              <h3 className="font-bold text-xl mt-5">{f.title}</h3>
              <p className="text-gray-600 mt-3">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">What You Can Sell</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {categories.map(c=>(
              <div key={c} className="rounded-2xl border p-8 bg-gradient-to-br from-white to-slate-100 hover:border-blue-500 hover:shadow-lg transition">
                <h3 className="font-semibold text-lg">{c}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          {["Register","Upload Products","Receive Orders","Get Paid"].map((s,i)=>(
            <div key={s} className="text-center bg-white rounded-2xl p-8 shadow">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center font-bold">{i+1}</div>
              <h3 className="font-semibold mt-5">{s}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">Start Selling Today</h2>
          <p className="mt-4 text-blue-100">Join our growing network of trusted medical sellers.</p>
                  <button
                      onClick={() => navigate("/seller-register")}
                      className="inline-flex items-center gap-2 mt-8 bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition duration-300"
                  >
                      Register Now
                      <ArrowRight size={18} />
                  </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-10 text-center">
        © 2026 MedMarket. All rights reserved.
      </footer>
    </div>
  );
}
