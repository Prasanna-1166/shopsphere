import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { isCartDrawerOpen, setIsCartDrawerOpen, items, summary, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Shopping Bag</h2>
                <p className="text-xs text-slate-400">{items.length} unique item(s)</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Your bag is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Discover curated fashion, electronics, and lifestyle goods.
                </p>
                <Link
                  to="/products"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="inline-block mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-semibold text-sm rounded-xl transition shadow-glow"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const imgUrl = item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-slate-850 rounded-xl border border-slate-800"
                  >
                    <img
                      src={imgUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          onClick={() => setIsCartDrawerOpen(false)}
                          className="text-sm font-semibold text-slate-100 hover:text-brand-400 transition truncate block"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ₹{item.unitPrice.toLocaleString('en-IN')} each
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-slate-400 hover:text-slate-100 p-0.5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-slate-200 px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.availableStock}
                            className="text-slate-400 hover:text-slate-100 p-0.5 disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200 font-medium">₹{summary.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery</span>
                  <span className="text-brand-400 font-medium">
                    {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}
                  </span>
                </div>
                {summary.totalSavings > 0 && (
                  <div className="flex justify-between text-brand-400 text-xs font-semibold">
                    <span>Total Savings</span>
                    <span>-₹{summary.totalSavings?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-100 pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-brand-400">₹{summary.finalTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/cart"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="py-3 text-center text-sm font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition"
                >
                  View Bag
                </Link>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/checkout');
                  }}
                  className="py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow-glow"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
