import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Star,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/SkeletonLoader';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
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
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-24 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NEW ARRIVALS 2026 EDITION</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                At the End of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200">
                  Your Streets.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover engineered studio audio, iconic street silhouettes, Japanese selvedge denim,
                and precision workstation gears — delivered straight to your door with zero hassle.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-glow flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Catalog</span>
                </Link>
                <Link
                  to="/products?category=electronics-audio"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
                >
                  <span>Hi-Fi Audio Gear</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl font-black text-white">20+</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Curated Products</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-brand-400">100%</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Authentic Brands</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">4.9 ★</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Customer Trust</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Banner */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500 to-emerald-600 opacity-30 blur-2xl animate-pulse" />
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                    alt="SphereAcoustics Studio ANC Headphones"
                    className="w-full h-80 sm:h-96 object-cover object-center"
                  />
                  <div className="p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                        Editor’s Spotlight
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        SphereAcoustics Pro Wireless ANC
                      </h3>
                      <p className="text-xs text-slate-400">Custom 45mm Neodymium Drivers</p>
                    </div>
                    <Link
                      to="/products/sphereacoustics-pro-wireless-anc-headphones"
                      className="p-3 bg-brand-500 text-slate-950 rounded-xl hover:bg-brand-400 transition shadow-glow shrink-0"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop By Department / Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Explore Departments</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Shop by Category</h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-slate-400 hover:text-brand-400 flex items-center gap-1.5 transition"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3 text-center bg-slate-900/90 flex-1 flex flex-col justify-center">
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-brand-400 transition truncate">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  {cat._count?.products || 0} products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-brand-400" />
              <span>Handpicked Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Featured Products</h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-slate-400 hover:text-brand-400 flex items-center gap-1.5 transition"
          >
            <span>See Everything</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ProductSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Promotional Flash Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 border border-brand-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-brand-500/20 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-500 text-slate-950 font-black text-xs uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Limited Time Promotion</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Upgrade Your Desk & Workspace Setup
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Experience the tactility of hot-swappable mechanical keyboards, aerospace aluminum laptop
              stands, and premium felt desk organizers with up to 30% instant discount.
            </p>
            <div className="pt-2">
              <Link
                to="/products?category=workspace-stationery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-glow"
              >
                <span>Shop Workspace Gear</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Value Deals & Discounts */}
      {bestDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Special Pricing</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Flash Discounts & Deals
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-semibold text-slate-400 hover:text-brand-400 flex items-center gap-1.5 transition"
            >
              <span>Explore All Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestDeals.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Brand Commitment & Verified Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">What Our Customers Say</h2>
          <p className="text-sm text-slate-400">
            Real feedback from verified buyers who shop at the end of their streets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "The SphereAcoustics headphones arrived in Bengaluru within 24 hours. Studio-grade sound
              clarity, impeccable ANC, and the unboxing felt truly top-tier."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Aditya K.</span>
              <span className="text-[10px] text-brand-400 font-semibold">Verified Buyer</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "The 450GSM heavyweight hoodie is the best quality cotton I've ever bought online in India.
              Heavy, thick cuffs, and perfect oversized drape."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Shreya S.</span>
              <span className="text-[10px] text-brand-400 font-semibold">Verified Buyer</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "KeyForge 75% keyboard has buttery smooth pre-lubed switches right out of the box. Fast checkout
              and clean order tracking."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Rohan M.</span>
              <span className="text-[10px] text-brand-400 font-semibold">Verified Buyer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
