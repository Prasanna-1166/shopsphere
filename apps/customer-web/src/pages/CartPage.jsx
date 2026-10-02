import React from 'react';
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
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

export default function CartPage() {
  const { items, summary, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your bag"
          description="Your saved shopping cart items will be synced across all your devices once you sign in."
          actionText="Sign In to ShopSphere"
          actionLink="/login"
        />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping bag is empty"
          description="Explore our collection of studio audio, Japanese denim, sneakers, and modern desk gear."
          actionText="Start Shopping"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Shopping Bag</h1>
          <p className="text-sm text-slate-400 mt-1">
            {summary.totalQuantity} item(s) selected for checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 self-start sm:self-auto flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const imgUrl =
              item.product.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
            const isLow = item.availableStock <= 5 && item.availableStock > 0;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800/90 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                {/* Product Image & Info */}
                <div className="flex gap-4 items-center flex-1 min-w-0">
                  <img
                    src={imgUrl}
                    alt={item.product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-slate-950 shrink-0"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block">
                      {item.product.category?.name || 'Item'}
                    </span>
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="text-sm sm:text-base font-bold text-white hover:text-brand-300 transition truncate block"
                    >
                      {item.product.name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      ₹{item.unitPrice.toLocaleString('en-IN')} / unit
                    </div>
                    {isLow && (
                      <span className="text-[11px] text-amber-400 font-semibold block">
                        Only {item.availableStock} in stock!
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.availableStock}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">
                      ₹{item.itemSubtotal.toLocaleString('en-IN')}
                    </div>
                    {item.discountPrice && (
                      <div className="text-[10px] text-brand-400 font-semibold">
                        Discount applied
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-slate-800"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 sticky top-28 shadow-xl">
            <h2 className="text-lg font-black text-white tracking-tight">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">
                  ₹{summary.subtotal?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Estimated Shipping</span>
                <span className="text-brand-400 font-medium">
                  {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}
                </span>
              </div>

              {summary.totalSavings > 0 && (
                <div className="flex justify-between text-brand-400 text-xs font-bold">
                  <span>Total Discount Savings</span>
                  <span>-₹{summary.totalSavings?.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Total Amount</span>
                <span className="text-2xl font-black text-brand-400">
                  ₹{summary.finalTotal?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {summary.shipping > 0 && (
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                Add <strong className="text-white">₹{1500 - summary.subtotal}</strong> more to qualify for <span className="text-brand-400 font-bold">FREE Express Delivery</span>!
              </p>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-glow flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Secure Checkout</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
                <span>7-Day Return</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
