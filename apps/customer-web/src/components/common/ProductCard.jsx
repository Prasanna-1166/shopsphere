import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (product.stockQuantity <= 0) return;
    await addToCart(product.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

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
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={imgUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Discount & Stock Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[11px] rounded shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="px-2 py-0.5 bg-slate-800 text-white font-medium text-[10px] rounded shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 bg-amber-500 text-white font-medium text-[10px] rounded shadow-sm">
              Only {product.stockQuantity} left
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all z-10 shadow-sm ${
            inWish
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/90 text-slate-500 hover:text-rose-600 hover:bg-white border border-slate-200/80'
          }`}
          title={inWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {product.category.name}
            </span>
          )}
          <Link
            to={`/products/${product.slug}`}
            className="text-sm font-semibold text-slate-900 hover:text-accent-600 transition line-clamp-1 block"
            title={product.name}
          >
            {product.name}
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Incl. all taxes</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : justAdded
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
            title={isOutOfStock ? 'Sold Out' : justAdded ? 'Added to Cart!' : 'Add to Cart'}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
