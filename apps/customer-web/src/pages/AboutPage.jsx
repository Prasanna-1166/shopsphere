import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Truck, Heart, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Brand Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OUR PHILOSOPHY</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          ShopSphere — <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200">
            At the End of Your Streets.
          </span>
        </h1>
        <p className="text-base text-slate-300 leading-relaxed font-normal">
          We founded ShopSphere on a singular principle: high-end, premium quality craftsmanship
          shouldn't feel distant or inaccessible. It should be right in your neighborhood, right at
          the end of your streets.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Curated Excellence</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We don't list thousands of low-grade items. Every piece in our catalog is rigorously tested
            for design integrity, material quality, and real-world durability.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Hyperlocal Speed</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Partnered with top tier logistics networks to provide same-day processing and 24-48 hour
            doorstep delivery across major hubs.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Trust & Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero compromises on customer security. Built with encrypted sessions, double-submit CSRF
            protection, and authentic payment processing.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 border border-brand-500/30 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Ready to elevate your everyday gear?</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Explore our collection of studio headphones, Japanese selvedge denim, sneakers, and desk accessories.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm rounded-xl transition shadow-glow"
        >
          <span>Shop Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
