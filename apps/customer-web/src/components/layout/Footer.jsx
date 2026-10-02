import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Headphones, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      {/* Value Proposition Banners */}
      <div className="border-b border-slate-800 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-accent-500 flex items-center justify-center shrink-0 border border-slate-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Free Delivery</h4>
                <p className="text-xs text-slate-400">On all orders above ₹499 across India</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-success-500 flex items-center justify-center shrink-0 border border-slate-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">100% Genuine Quality</h4>
                <p className="text-xs text-slate-400">Directly sourced & quality verified</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-accent-500 flex items-center justify-center shrink-0 border border-slate-700">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">7-Day Easy Returns</h4>
                <p className="text-xs text-slate-400">Doorstep pickup & quick refunds</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center shrink-0 border border-slate-700">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Helpful Customer Care</h4>
                <p className="text-xs text-slate-400">Mon - Sat: 9:00 AM - 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-base border border-slate-700">
                <span className="text-accent-500">S</span>S
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Shop<span className="text-accent-500">Sphere</span>
                </span>
                <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400 block -mt-0.5">
                  At the end of your streets
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              ShopSphere is an Indian retail platform bringing quality everyday essentials, kitchenware, audio gear, apparel, and workspace products directly to your doorstep at sensible, honest prices.
            </p>
            <div className="space-y-1.5 text-xs text-slate-300 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-accent-500" />
                <span>care@shopsphere.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-accent-500" />
                <span>+91 80 4567 8900</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent-500" />
                <span>Indiranagar 100ft Road, Bengaluru, Karnataka 560038</span>
              </div>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Shop Categories
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?category=home-kitchen" className="hover:text-white transition">
                  Home & Kitchen
                </Link>
              </li>
              <li>
                <Link to="/products?category=electronics-audio" className="hover:text-white transition">
                  Electronics & Audio
                </Link>
              </li>
              <li>
                <Link to="/products?category=personal-care" className="hover:text-white transition">
                  Personal Care & Grooming
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion-apparel" className="hover:text-white transition">
                  Fashion & Daily Wear
                </Link>
              </li>
              <li>
                <Link to="/products?category=bags-travel" className="hover:text-white transition">
                  Bags & Travel Gear
                </Link>
              </li>
              <li>
                <Link to="/products?category=workspace-stationery" className="hover:text-white transition">
                  Workspace & Stationery
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Customer Support
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Saved Addresses
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition">
                  Your Wishlist
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Shipping Policy (2-4 Days Metro)</span>
              </li>
              <li>
                <span className="text-slate-400">Returns & Doorstep Pickup</span>
              </li>
              <li>
                <span className="text-slate-400">FAQ & Help Center</span>
              </li>
            </ul>
          </div>

          {/* Trust & Safe Payments */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Payment & Security
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              100% Secure Checkout with 256-bit SSL encryption. We support all major Indian payment methods.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-300">
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">UPI / QR</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Google Pay</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">PhonePe</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Paytm</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">RuPay</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Visa / MC</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopSphere Retail Technologies Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Grievance Officer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
