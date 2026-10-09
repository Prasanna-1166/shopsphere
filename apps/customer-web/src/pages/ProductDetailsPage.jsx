import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
  MapPin,
  CheckCircle,
  Zap,
  Check,
  Package,
  ShoppingBasket,
  Share2,
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/common/ProductCard';
import EmptyState from '../components/common/EmptyState';
import { GENERIC_PRODUCT_FALLBACK_IMAGE, handleImageError } from '../utils/imageFallback';

function extractPackSize(name) {
  if (!name) return null;
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        setSelectedImageIdx(0);
        setQuantity(1);
        setDeliveryStatus(null);
        setJustAdded(false);

        const res = await api.get(`/products/slug/${slug}`);
        if (res.data && res.data.product) {
          const prod = res.data.product;
          setProduct(prod);

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

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.trim().length === 6 && !isNaN(pincode)) {
      setDeliveryStatus({
        available: true,
        message: 'Delivery in 2–4 Business Days | Cash on Delivery Available',
      });
    } else {
      setDeliveryStatus({
        available: false,
        message: 'Please enter a valid 6-digit Indian Postal PIN Code.',
      });
    }
  };

  const handleAddToCart = async () => {
    if (product && product.stockQuantity > 0) {
      await addToCart(product.id, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (product && product.stockQuantity > 0) {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          title="Product Not Found"
          description="The product you are looking for might have been moved or is currently unavailable."
          actionLabel="Return to Store Catalog"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const packSize = extractPackSize(product.name);
  const isGrocery = product.categoryId === 'cat_grocery_daily_needs' || product.category?.slug === 'grocery-daily-needs';

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: GENERIC_PRODUCT_FALLBACK_IMAGE, altText: product.name }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-900 transition">
          Catalog
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-slate-900 transition font-medium"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Hero Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-sm">
        {/* Left: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
            <img
              src={images[selectedImageIdx]?.url || GENERIC_PRODUCT_FALLBACK_IMAGE}
              alt={images[selectedImageIdx]?.altText || product.name}
              onError={handleImageError}
              className="w-full h-full object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
              {hasDiscount && (
                <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
              {isGrocery && (
                <span className="px-2.5 py-1 bg-slate-900 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1">
                  <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Grocery</span>
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-3.5 right-3.5 p-2.5 rounded-full shadow-md transition-all ${
                inWish
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white/95 text-slate-600 hover:text-rose-600 border border-slate-200'
              }`}
              aria-label={inWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-5 h-5 ${inWish ? 'fill-current text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIdx === idx
                      ? 'border-slate-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img.url || GENERIC_PRODUCT_FALLBACK_IMAGE}
                    alt={img.altText || ''}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Information & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs font-bold text-accent-700 uppercase tracking-wider hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span>SKU: <strong className="text-slate-700">{product.sku}</strong></span>
              <span>•</span>
              {isOutOfStock ? (
                <span className="font-bold text-rose-600">Currently Out of Stock</span>
              ) : isLowStock ? (
                <span className="font-bold text-amber-600">Only {product.stockQuantity} units left in stock</span>
              ) : (
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> In Stock • Ready to Dispatch
                </span>
              )}
            </div>
          </div>

          {/* Pack Size / Variant Info */}
          {packSize && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
              <span className="text-xs text-slate-500 block">Packaging Quantity:</span>
              <span className="text-sm font-bold text-slate-900">{packSize}</span>
            </div>
          )}

          {/* Pricing Block */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-xs rounded">
                    Save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')} ({discountPercent}%)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Inclusive of all taxes & GST</p>
          </div>

          {/* Quantity & CTA Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full sm:flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : justAdded
                    ? 'bg-emerald-600 text-white scale-102'
                    : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </>
                )}
              </button>

              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 py-3.5 bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Pincode Availability Checker */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Check Delivery Pincode</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit PIN code (e.g. 560001)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shrink-0"
              >
                Check
              </button>
            </form>
            {deliveryStatus && (
              <p
                className={`text-xs font-medium ${
                  deliveryStatus.available ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {deliveryStatus.message}
              </p>
            )}
          </div>

          {/* 3 Core Trust Assurances */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <Truck className="w-4 h-4 text-accent-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Free Shipping</p>
              <p className="text-[10px] text-slate-400">On ₹499+ orders</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">100% Genuine</p>
              <p className="text-[10px] text-slate-400">Directly sourced</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <RotateCcw className="w-4 h-4 text-accent-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">7-Day Returns</p>
              <p className="text-[10px] text-slate-400">Easy replacement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Product Details */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-bold">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'description'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            About This Product
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'specs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Product Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'shipping'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Shipping & Return Policy
          </button>
        </div>

        <div>
          {activeTab === 'description' && (
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed max-w-3xl">
              <p>{product.description}</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Manufactured and packaged according to strict Indian quality standards.</li>
                <li>Hygienically packed to preserve freshness and ensure intact delivery.</li>
                <li>Includes official ShopSphere customer support and invoice with full GST details.</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-slate-100">
                  <tr className="py-2">
                    <td className="py-2.5 font-bold text-slate-500 w-1/3">Stock Keeping Unit</td>
                    <td className="py-2.5 text-slate-900 font-semibold">{product.sku}</td>
                  </tr>
                  <tr className="py-2">
                    <td className="py-2.5 font-bold text-slate-500">Category</td>
                    <td className="py-2.5 text-slate-900">{product.category?.name || 'General'}</td>
                  </tr>
                  {packSize && (
                    <tr className="py-2">
                      <td className="py-2.5 font-bold text-slate-500">Pack Quantity</td>
                      <td className="py-2.5 text-slate-900 font-semibold">{packSize}</td>
                    </tr>
                  )}
                  <tr className="py-2">
                    <td className="py-2.5 font-bold text-slate-500">Current Stock</td>
                    <td className="py-2.5 text-slate-900">{product.stockQuantity} units available</td>
                  </tr>
                  <tr className="py-2">
                    <td className="py-2.5 font-bold text-slate-500">Country of Origin</td>
                    <td className="py-2.5 text-slate-900">India</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-w-2xl">
              <p>
                <strong>Delivery Timeline:</strong> Standard dispatch occurs within 24 hours of order confirmation. Delivery takes 2–4 business days across metro cities and 4–6 business days for tier 2/3 locations.
              </p>
              <p>
                <strong>Free Shipping:</strong> Automatically applied to all orders above ₹499 across all serviceable PIN codes in India.
              </p>
              <p>
                <strong>Return & Replacement:</strong> Eligible for 7-day hassle-free replacement or full refund if received in damaged condition or differing from specifications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Complementary Deterministic Related Products Grid */}
      {related.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Complementary & Related Products
            </h2>
            <Link
              to={`/products?category=${product.category?.slug}`}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              View More in {product.category?.name} →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
