import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { GENERIC_PRODUCT_FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback';

export default function CartDrawer() {
  const { isCartDrawerOpen, setIsCartDrawerOpen, items, summary, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
                <p className="text-xs text-slate-500">{summary?.totalQuantity ?? items.length} item(s)</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Add everyday essentials, kitchen items, and tech gear.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/products');
                  }}
                  className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
                >
                  Shop Catalog
                </button>
              </div>
            ) : (
              items.map((item) => {
                const prod = item.product || {};
                const imgUrl = prod.images?.[0]?.url || GENERIC_PRODUCT_FALLBACK_IMAGE;
                const price = Number(prod.discountPrice ?? prod.price ?? item.unitPrice ?? 0);
                const stock = prod.stockQuantity ?? item.availableStock ?? 99;
                const name = prod.name || item.productName || 'Product';
                const slug = prod.slug || '';

                return (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 items-center">
                    <img src={imgUrl} alt={name} onError={handleImageError} className="w-16 h-16 rounded-lg object-cover bg-white shrink-0 border border-slate-200" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        to={slug ? `/products/${slug}` : '/products'}
                        onClick={() => setIsCartDrawerOpen(false)}
                        className="text-xs font-semibold text-slate-900 hover:text-accent-600 block truncate"
                      >
                        {name}
                      </Link>
                      <div className="text-xs font-bold text-slate-900">
                        ₹{price.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center border border-slate-300 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="p-1 text-slate-500 hover:text-slate-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            disabled={(item.quantity || 1) >= stock}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 text-sm">
                  ₹{(summary?.subtotal ?? items.reduce((acc, it) => acc + ((it.product?.discountPrice ?? it.product?.price ?? 0) * (it.quantity || 1)), 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Shipping and promotional discounts calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/cart');
                  }}
                  className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition text-center"
                >
                  View Full Cart
                </button>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/checkout');
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
