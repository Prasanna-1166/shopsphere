import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  BadgePercent,
  CheckCircle2,
  Sparkles,
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
    <div className="space-y-12 pb-16">
      {/* 1. Practical Consumer Hero Section */}
      <section className="bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-xs font-semibold">
                <BadgePercent className="w-3.5 h-3.5" />
                <span>Everyday essentials starting at ₹249</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Good products. Fair prices. <br />
                <span className="text-accent-600">Delivered to your door.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Discover everyday kitchen essentials, reliable audio accessories, comfortable apparel, and workspace organizers — curated for quality and priced honestly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop Catalog</span>
                </Link>
                <Link
                  to="/products?category=home-kitchen"
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span>Kitchen & Home</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>

              {/* 4 Trust Props */}
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Hero Product Collage */}
            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80"
                      alt="Wireless Earbuds"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <div className="pt-2 text-left">
                      <p className="text-xs font-bold text-slate-900 truncate">BoltAudio Earbuds</p>
                      <p className="text-xs font-bold text-slate-900">₹1,299 <span className="text-[10px] text-slate-400 line-through">₹1,899</span></p>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80"
                      alt="Stainless Steel Water Bottle"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <div className="pt-2 text-left">
                      <p className="text-xs font-bold text-slate-900 truncate">Thermosteel 1L</p>
                      <p className="text-xs font-bold text-slate-900">₹649 <span className="text-[10px] text-slate-400 line-through">₹899</span></p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-6">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
                      alt="UrbanShield Laptop Backpack"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <div className="pt-2 text-left">
                      <p className="text-xs font-bold text-slate-900 truncate">Laptop Backpack</p>
                      <p className="text-xs font-bold text-slate-900">₹1,199 <span className="text-[10px] text-slate-400 line-through">₹1,799</span></p>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80"
                      alt="Cotton Crewneck T-Shirt"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <div className="pt-2 text-left">
                      <p className="text-xs font-bold text-slate-900 truncate">Cotton Tee</p>
                      <p className="text-xs font-bold text-slate-900">₹449 <span className="text-[10px] text-slate-400 line-through">₹699</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore by Category</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Handpicked collections for everyday living</p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white border border-slate-200 rounded-xl p-3 text-center hover:border-slate-300 hover:shadow-md transition flex flex-col items-center justify-between"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 line-clamp-1">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400 mt-0.5">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Essentials</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
                Top Rated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Most loved products by customers across India</p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ProductSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Value / Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="px-2.5 py-1 bg-accent-600 text-white text-xs font-bold rounded uppercase tracking-wider inline-block">
              Budget Friendly
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quality Kitchenware & Essentials Under ₹999
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upgrade your home with stainless steel insulated bottles, airtight glass containers, and durable cookware backed by our 7-day doorstep replacement guarantee.
            </p>
            <div className="pt-2">
              <Link
                to="/products?category=home-kitchen"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition"
              >
                <span>Shop Kitchen Essentials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Deals Section */}
      {bestDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Best Value Deals</h2>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-bold rounded">
                  Limited Period
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Top discounts on high-utility items</p>
            </div>
            <Link
              to="/products"
              className="text-xs sm:text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
            >
              <span>See All Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {bestDeals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. Why ShopSphere Trust Section */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Why ShopSphere?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              At the end of your streets — honest pricing, verified items, and neighborhood support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-base font-bold">
                ₹
              </div>
              <h3 className="text-sm font-bold text-slate-900">Transparent & Honest Pricing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No inflated markups or artificial discounts. Every item is priced sensibly for middle-class Indian households.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verified Quality Sourcing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We inspect materials, durability, and manufacturer reliability before adding any product to the ShopSphere catalog.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reliable Doorstep Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast courier partnerships across 19,000+ Indian pincodes with real-time tracking and Cash on Delivery support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
