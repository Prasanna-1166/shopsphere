import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  BadgePercent,
  Sparkles,
  ShoppingBasket,
  Flame,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/SkeletonLoader';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [catRes, showcaseRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/showcase/featured'),
        ]);

        if (catRes.data) setCategories(catRes.data.categories || []);
        if (showcaseRes.data) {
          setFeatured(showcaseRes.data.featured || []);
          setNewArrivals(showcaseRes.data.newArrivals || []);
          setBestDeals(showcaseRes.data.bestDeals || []);
          setGrocery(showcaseRes.data.grocery || []);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. Practical Consumer Hero Banner */}
      <section className="bg-gradient-to-b from-slate-100 via-slate-50 to-white border-b border-slate-200/80 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <ShoppingBasket className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pantry Staples, Home & Everyday Gear Starting at ₹25</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Everyday essentials, <br />
                <span className="text-accent-600">at prices that make sense.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Everything your home and family need daily — unpolished pulses, aged basmati rice, pure cooking oils, kitchen cookware, tech accessories, and comfortable clothing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/products?category=grocery-daily-needs"
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBasket className="w-4 h-4" />
                  <span>Shop Daily Groceries</span>
                </Link>
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                  <span>Explore All Products</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Trust Value Props */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 text-left">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Truck className="w-4 h-4 text-accent-600 shrink-0" />
                  <span>Free shipping ₹499+</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <RotateCcw className="w-4 h-4 text-accent-600 shrink-0" />
                  <span>7-Day Returns</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Visual Feature Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Daily Indian Market Fresh
                    </span>
                  </div>
                  <span className="text-xs font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded">
                    106+ Items
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/products?category=grocery-daily-needs"
                    className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 transition group block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2">
                      <ShoppingBasket className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      Grocery Staples
                    </p>
                    <p className="text-[11px] text-slate-500">Rice, Atta, Dals, Oils</p>
                  </Link>

                  <Link
                    to="/products?category=home-kitchen"
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 hover:border-amber-300 transition group block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                      Kitchen Cookware
                    </p>
                    <p className="text-[11px] text-slate-500">Tawas, Bottles, Jars</p>
                  </Link>

                  <Link
                    to="/products?category=electronics-accessories"
                    className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 hover:border-sky-300 transition group block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-2">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700">
                      Audio & Tech
                    </p>
                    <p className="text-[11px] text-slate-500">Earbuds, Chargers, Hubs</p>
                  </Link>

                  <Link
                    to="/products?category=fashion-apparel"
                    className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 hover:border-purple-300 transition group block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2">
                      <Package className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                      Pure Cotton Wear
                    </p>
                    <p className="text-[11px] text-slate-500">Tees, Belts, Wallets</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop By Department / Category Tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shop by Department
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Explore categories curated for everyday Indian living
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const isGroceries = cat.slug === 'grocery-daily-needs';
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className={`group flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 ${
                  isGroceries
                    ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 mb-2.5 relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isGroceries && (
                    <span className="absolute bottom-0 inset-x-0 bg-emerald-700 text-white text-[9px] font-bold py-0.5 text-center">
                      ESSENTIAL
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-accent-600 line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. DEDICATED GROCERY & DAILY NEEDS SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white mb-6 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-200 text-xs font-bold">
              <ShoppingBasket className="w-3.5 h-3.5" />
              <span>Pantry & Kitchen Staples</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grocery & Daily Needs
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Unpolished pulses, aged basmati rice, cold-pressed oils, pure spices, detergent liquids, and family care essentials.
            </p>
            <div className="pt-2">
              <Link
                to="/products?category=grocery-daily-needs"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-900 font-bold text-xs rounded-xl hover:bg-emerald-50 transition shadow-sm"
              >
                <span>View All 32 Grocery Items</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <ProductSkeletonGrid count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {grocery.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. BEST VALUE DEALS (Honest Discounts) */}
      {bestDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Best Value Deals
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Top-rated everyday products with genuine discount pricing
                </p>
              </div>
            </div>
            <Link
              to="/products"
              className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestDeals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. POPULAR & TRENDING ESSENTIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Popular Everyday Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Proven bestsellers across kitchen, electronics, and fashion
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ProductSkeletonGrid count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. SHOP BY NEED / CURATED COLLECTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Shop by Need
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Handpicked collections for your home, work, and lifestyle
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/products?category=grocery-daily-needs"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-2 group block"
          >
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Daily Pantry
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600">
              Monthly Grocery Stock
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Atta, rice, unpolished lentils, cooking oils, and spices for regular home cooking.
            </p>
          </Link>

          <Link
            to="/products?category=home-kitchen"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-2 group block"
          >
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Cookware & Dining
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600">
              Kitchen Essentials
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tri-ply fry pans, non-stick tawas, glass containers, and vacuum thermal bottles.
            </p>
          </Link>

          <Link
            to="/products?category=stationery-office"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-2 group block"
          >
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Work & Study
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600">
              Desk & Office Setup
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aluminium laptop stands, executive journals, gel pens, and desk organizers.
            </p>
          </Link>

          <Link
            to="/products?category=travel-lifestyle"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-2 group block"
          >
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Commute & Travel
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600">
              Travel Gear
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Neck pillows, packing cubes, compact umbrellas, and worldwide travel adapters.
            </p>
          </Link>
        </div>
      </section>

      {/* 7. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent-50 text-accent-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  New Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Recently added catalog products for modern Indian households
                </p>
              </div>
            </div>
            <Link
              to="/products?sortBy=newest"
              className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
            >
              <span>View All New</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 8. TRUST & COMMITMENT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-accent-500 text-slate-900 flex items-center justify-center mx-auto sm:mx-0 font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Free Delivery on ₹499+</h4>
              <p className="text-xs text-slate-400">
                Direct shipping to all serviceable pin codes across India with tracking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mx-auto sm:mx-0 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">100% Genuine Products</h4>
              <p className="text-xs text-slate-400">
                Directly sourced from verified Indian manufacturers and genuine brands.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-accent-500 text-slate-900 flex items-center justify-center mx-auto sm:mx-0 font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Easy 7-Day Returns</h4>
              <p className="text-xs text-slate-400">
                Hassle-free replacement or full refund if items arrive damaged or defective.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mx-auto sm:mx-0 font-bold">
                <BadgePercent className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Affordable & Fair Prices</h4>
              <p className="text-xs text-slate-400">
                Everyday realistic pricing tailored for practical middle-class Indian families.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
