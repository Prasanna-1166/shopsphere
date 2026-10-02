import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Headphones, ArrowRight, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 mt-20">
      {/* Value Proposition Banners */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Free Express Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">On all domestic orders over ₹1,500</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">100% Authentic Products</h4>
                <p className="text-xs text-slate-400 mt-0.5">Sourced directly from verified creators</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Hassle-Free Returns</h4>
                <p className="text-xs text-slate-400 mt-0.5">7-day doorstep replacement guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">24/7 Dedicated Support</h4>
                <p className="text-xs text-slate-400 mt-0.5">Always here to assist your shopping</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center">
                <span className="text-slate-950 font-black text-lg">S</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">
                  Shop<span className="text-brand-400">Sphere</span>
                </span>
                <span className="block text-[9px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                  At the End of Your Streets
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your neighborhood digital flagship. Delivering curated electronics, precision footwear,
              streetwear apparel, and workspace essentials straight to your doorstep.
            </p>
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-300 mb-2">Subscribe to our newsletter</div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 flex-1 text-slate-200"
                />
                <button className="bg-brand-500 hover:bg-brand-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1">
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Shop Departments */}
          <div>
            <h5 className="text-sm font-bold text-slate-100 tracking-wider uppercase mb-4">Shop</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products?category=electronics-audio" className="hover:text-brand-400 transition">
                  Electronics & Audio
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion-apparel" className="hover:text-brand-400 transition">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link to="/products?category=footwear-sneakers" className="hover:text-brand-400 transition">
                  Footwear & Sneakers
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-living" className="hover:text-brand-400 transition">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link to="/products?category=workspace-stationery" className="hover:text-brand-400 transition">
                  Workspace & Tech
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="text-sm font-bold text-slate-100 tracking-wider uppercase mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/orders" className="hover:text-brand-400 transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-brand-400 transition">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-brand-400 transition">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-brand-400 transition">
                  Manage Addresses
                </Link>
              </li>
            </ul>
          </div>

          {/* About Company */}
          <div>
            <h5 className="text-sm font-bold text-slate-100 tracking-wider uppercase mb-4">About</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-brand-400 transition">
                  Our Story
                </Link>
              </li>
              <li>
                <a href="#privacy" className="hover:text-brand-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-brand-400 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-brand-400 transition">
                  Security Guarantee
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ShopSphere Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for modern online commerce.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
