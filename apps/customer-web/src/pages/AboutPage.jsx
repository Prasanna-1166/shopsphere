import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, ArrowRight, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Brand Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-bold border border-accent-200 inline-block">
          ABOUT SHOPSPHERE
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          At the end of your streets.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          ShopSphere was created with a clear goal: to bring genuine, reliable everyday essentials, kitchenware, audio accessories, and clothing directly to Indian families at fair and honest prices.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            ₹
          </div>
          <h3 className="text-base font-bold text-slate-900">Honest Value</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            No inflated markups or artificial flash discounts. Practical pricing designed for middle-class Indian households.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Verified Quality</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every product is handpicked and quality-checked before dispatch to ensure dependable everyday performance.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-accent-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Fast Doorstep Delivery</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Express courier integration across 19,000+ Indian pincodes with full tracking and Cash on Delivery support.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white text-center space-y-3">
        <h2 className="text-xl font-bold">Ready to discover everyday essentials?</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Explore our wide range of kitchenware, electronics, grooming products, and casual wear.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg transition"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
