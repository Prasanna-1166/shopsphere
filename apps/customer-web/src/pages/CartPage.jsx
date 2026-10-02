import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

export default function CartPage() {
  const { items, summary, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState(null);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME100' || code === 'SAVE100') {
      setCouponDiscount(100);
      setCouponMessage({ type: 'success', text: '₹100 discount coupon applied successfully!' });
    } else if (code === 'SPHERE50') {
      setCouponDiscount(50);
      setCouponMessage({ type: 'success', text: '₹50 discount coupon applied!' });
    } else {
      setCouponDiscount(0);
      setCouponMessage({ type: 'error', text: 'Invalid coupon code. Try WELCOME100' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Please sign in to view your cart"
          message="Your cart items are saved securely in your customer account."
          actionLabel="Sign In to ShopSphere"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Your shopping cart is empty"
          message="Looks like you haven't added anything to your cart yet. Explore our everyday essentials."
          actionLabel="Explore Catalog"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const freeDeliveryThreshold = 499;
  const deliveryFee = summary.subtotal >= freeDeliveryThreshold ? 0 : 49;
  const finalTotal = Math.max(0, summary.subtotal + deliveryFee - couponDiscount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {summary.totalQuantity} item(s) in your basket
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
        >
          Clear entire cart
        </button>
      </div>

      {/* Free Delivery Banner */}
      {summary.subtotal < freeDeliveryThreshold && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <span>
            Add <strong>₹{(freeDeliveryThreshold - summary.subtotal).toLocaleString('en-IN')}</strong> more for <strong>FREE Delivery</strong>!
          </span>
          <Link to="/products" className="font-bold underline">Add Items</Link>
        </div>
      )}

      {/* 2-Column Cart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
            {items.map((item) => {
              const prod = item.product;
              const imgUrl = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
              const price = prod.discountPrice || prod.price;

              return (
                <div key={item.id} className="p-4 sm:p-5 flex gap-4 items-center">
                  {/* Thumbnail */}
                  <Link to={`/products/${prod.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      {prod.category?.name || 'Item'}
                    </span>
                    <Link
                      to={`/products/${prod.slug}`}
                      className="text-sm font-semibold text-slate-900 hover:text-accent-600 transition block truncate"
                    >
                      {prod.name}
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      {prod.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= prod.stockQuantity}
                          className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Line Subtotal */}
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              to="/products"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {/* Coupon Code Section */}
            <div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME100)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0 transition"
                >
                  Apply
                </button>
              </form>
              {couponMessage && (
                <p className={`text-[11px] font-semibold mt-1.5 ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ₹{summary.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST & Taxes</span>
                <span className="text-slate-400">Included</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span>Total Payable</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Assurances */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Safe & Encrypted Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-accent-600" />
              <span>7-Day Easy Returns with Doorstep Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-700" />
              <span>Free Delivery on all orders above ₹499</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
