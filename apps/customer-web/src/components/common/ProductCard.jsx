import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const imgUrl =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="group relative bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col hover:shadow-2xl hover:shadow-black/50">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img
          src={imgUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="px-2.5 py-1 bg-brand-500 text-slate-950 font-black text-xs rounded-lg shadow-md uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-rose-500/90 text-white font-bold text-[11px] rounded-lg shadow-md">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 bg-amber-500/90 text-slate-950 font-bold text-[11px] rounded-lg shadow-md">
              Only {product.stockQuantity} Left
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all duration-200 z-10 shadow-lg ${
            inWish
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:text-rose-400 hover:bg-slate-900'
          }`}
          title={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
        </button>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Link
            to={`/products/${product.slug}`}
            className="p-3 bg-slate-900/90 text-slate-100 hover:bg-brand-500 hover:text-slate-950 rounded-xl transition shadow-xl font-medium text-xs flex items-center gap-1.5 backdrop-blur-md"
          >
            <Eye className="w-4 h-4" />
            <span>Details</span>
          </Link>
          {!isOutOfStock && (
            <button
              onClick={() => addToCart(product.id, 1)}
              className="p-3 bg-brand-500 text-slate-950 hover:bg-brand-400 rounded-xl transition shadow-glow font-bold text-xs flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {product.category && (
            <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider block mb-1">
              {product.category.name}
            </span>
          )}
          <Link
            to={`/products/${product.slug}`}
            className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-slate-100">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Inclusive of all taxes</span>
          </div>

          <button
            onClick={() => addToCart(product.id, 1)}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500 hover:text-slate-950 shadow-glow'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
