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
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/common/ProductCard';
import EmptyState from '../components/common/EmptyState';

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
        message: 'Standard Delivery by Thursday | Cash on Delivery Available',
      });
    } else {
      setDeliveryStatus({
        available: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
    }
  };

  const handleBuyNow = async () => {
    if (product) {
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
          message="The product you are looking for might have been moved, renamed, or is temporarily unavailable."
          actionLabel="Return to Catalog"
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

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', altText: product.name }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-slate-900 transition">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-900 transition">Catalog</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-slate-900 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main 2-Column Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <img
              src={images[selectedImageIdx]?.url}
              alt={images[selectedImageIdx]?.altText || product.name}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-white border-2 transition shrink-0 ${
                    selectedImageIdx === idx ? 'border-slate-900 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Information & Purchasing */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mb-2">
              {product.category && (
                <span className="uppercase tracking-wider text-accent-700 bg-accent-50 px-2 py-0.5 rounded">
                  {product.category.name}
                </span>
              )}
              <span>SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing Block */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')} ({discountPercent}% off)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">Price inclusive of all statutory GST & taxes.</p>
          </div>

          {/* Stock Status */}
          <div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                Hurry! Only {product.stockQuantity} units left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> In Stock — Ready to dispatch
              </span>
            )}
          </div>

          {/* Quantity and Primary Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <button
                onClick={() => addToCart(product.id, quantity)}
                disabled={isOutOfStock}
                className="sm:col-span-6 py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="sm:col-span-4 py-3 px-6 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`sm:col-span-2 py-3 rounded-lg border flex items-center justify-center transition ${
                  inWish
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title={inWish ? 'Saved to Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWish ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* PIN Code Delivery Check */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              <span>Check Delivery & Cash on Delivery</span>
            </h4>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit PIN code"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition shrink-0"
              >
                Check
              </button>
            </form>
            {deliveryStatus && (
              <p className={`text-xs font-medium ${deliveryStatus.available ? 'text-emerald-700' : 'text-rose-600'}`}>
                {deliveryStatus.message}
              </p>
            )}
          </div>

          {/* Delivery & Assurance Pills */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Truck className="w-4 h-4 mx-auto text-accent-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-900">Free Delivery</p>
              <p className="text-[10px] text-slate-500">On orders ₹499+</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <RotateCcw className="w-4 h-4 mx-auto text-accent-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-900">7-Day Returns</p>
              <p className="text-[10px] text-slate-500">Doorstep pickup</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-900">100% Genuine</p>
              <p className="text-[10px] text-slate-500">Quality verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description & Specifications */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="border-b border-slate-200 flex gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-bold transition border-b-2 ${
              activeTab === 'description' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Overview & Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 text-sm font-bold transition border-b-2 ${
              activeTab === 'specifications' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Specifications & Details
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="text-sm text-slate-700 leading-relaxed space-y-3">
            <p>{product.description}</p>
            <p className="text-xs text-slate-500">
              Each unit is inspected for physical defects and packaged with protective cushioning to ensure pristine arrival at your doorstep.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Item SKU</span>
              <span className="font-semibold text-slate-900">{product.sku}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Category</span>
              <span className="font-semibold text-slate-900">{product.category?.name || 'General'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Country of Origin</span>
              <span className="font-semibold text-slate-900">India</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Warranty</span>
              <span className="font-semibold text-slate-900">1 Year Brand Warranty</span>
            </div>
          </div>
        )}
      </div>

      {/* Related / Recommended Products */}
      {related.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Customers Also Viewed</h3>
            <Link
              to={`/products?category=${product.category?.slug}`}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              See More in {product.category?.name} →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
