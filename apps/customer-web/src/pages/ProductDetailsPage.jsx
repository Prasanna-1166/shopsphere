import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/common/ProductCard';
import EmptyState from '../components/common/EmptyState';

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        setSelectedImageIdx(0);
        setQuantity(1);

        const res = await api.get(`/products/slug/${slug}`);
        if (res.data && res.data.product) {
          const prod = res.data.product;
          setProduct(prod);

          // Fetch related products
          const relatedRes = await api.get(`/products/${prod.id}/related`);
          if (relatedRes.data) {
            setRelated(relatedRes.data.products || []);
          }
        }
      } catch (err) {
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-slate-900 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-900 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-slate-900 rounded w-3/4" />
            <div className="h-6 bg-slate-900 rounded w-1/3" />
            <div className="h-24 bg-slate-900 rounded" />
            <div className="h-12 bg-slate-900 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Product Not Available"
          description={error || "The product you're looking for doesn't exist or is currently unavailable."}
          actionText="Back to Catalog"
          actionLink="/products"
        />
      </div>
    );
  }

  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const currentPrice = hasDiscount ? product.discountPrice : product.price;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', altText: product.name }];

  const currentImageUrl = images[selectedImageIdx]?.url || images[0]?.url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Back Navigation */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Main Product Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Display Image */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <img
              src={currentImageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-brand-500 text-slate-950 font-black text-xs rounded-xl shadow-lg uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 bg-slate-900 ${
                    selectedImageIdx === idx
                      ? 'border-brand-500 ring-2 ring-brand-500/30'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category & Title */}
          <div>
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs font-bold text-brand-400 uppercase tracking-wider hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <span className={isOutOfStock ? 'text-rose-400 font-bold' : isLowStock ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (Only ${product.stockQuantity} Left)` : 'In Stock & Ready to Ship'}
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-brand-400 font-medium">
              Free delivery available on orders above ₹1,500.
            </p>
          </div>

          {/* Quick Summary Description */}
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Quantity & Actions */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="text-slate-400 hover:text-white p-1 disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-white px-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="text-slate-400 hover:text-white p-1 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => addToCart(product.id, quantity)}
                  className="flex-1 py-4 px-6 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-glow flex items-center justify-center gap-2.5"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Shopping Bag</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-4 rounded-2xl border transition ${
                    inWish
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-850'
                  }`}
                  title={inWish ? 'Saved to Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${inWish ? 'fill-current text-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Guarantees Box */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <Truck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Fast Doorstep Delivery in 2-4 business days</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>100% Genuine Certified Merchandise</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <RotateCcw className="w-4 h-4 text-brand-400 shrink-0" />
              <span>7-Day Return & Replacement Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Specifications & Policies */}
      <div className="border-t border-slate-800 pt-12 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-bold transition border-b-2 ${
              activeTab === 'description'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-sm font-bold transition border-b-2 ${
              activeTab === 'specs'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 text-sm font-bold transition border-b-2 ${
              activeTab === 'shipping'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Shipping & Returns
          </button>
        </div>

        <div className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <p>
                Engineered for longevity and aesthetic distinction. Every ShopSphere product undergoes
                meticulous quality verification prior to dispatch.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 py-2 border-b border-slate-800/60">
                <span className="text-slate-400">SKU Code</span>
                <span className="font-mono text-white">{product.sku}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="text-white">{product.category?.name || 'General'}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Authenticity</span>
                <span className="text-brand-400 font-semibold">100% Verified OEM Original</span>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <p>
                We ship across India with leading express courier partners. Tracking updates are sent
                directly via your account portal.
              </p>
              <p>
                Eligible items may be replaced or returned within 7 calendar days of delivery in their original
                unopened packaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {related.length > 0 && (
        <div className="border-t border-slate-800 pt-16 space-y-8">
          <div>
            <div className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommendations</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">You Might Also Like</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
