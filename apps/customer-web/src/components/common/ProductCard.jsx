import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * Extracts pack size / weight from product name if enclosed in parentheses
 * Example: "India Gate Basmati Rice (5 kg)" -> "5 kg"
 */
function extractPackSize(name) {
  if (!name) return null;
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

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
    setTimeout(() => setJustAdded(false), 1400);
  };

  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const packSize = extractPackSize(product.name);
  const isGrocery = product.categoryId === 'cat_grocery_daily_needs' || product.category?.slug === 'grocery-daily-needs';

  const imgUrl =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 flex flex-col justify-between">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link to={`/products/${product.slug}`} className="block w-full h-full" aria-label={`View details of ${product.name}`}>
          <img
            src={imgUrl}
            alt={product.images?.[0]?.altText || product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Discount & Pack Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[11px] rounded-md shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="px-2 py-0.5 bg-slate-800 text-white font-medium text-[10px] rounded-md shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 bg-amber-500 text-white font-medium text-[10px] rounded-md shadow-sm">
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
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105'
              : 'bg-white/95 text-slate-500 hover:text-rose-600 hover:bg-white border border-slate-200/90'
          }`}
          aria-label={inWish ? `Remove ${product.name} from Wishlist` : `Add ${product.name} to Wishlist`}
          title={inWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWish ? 'fill-current text-rose-500' : ''}`} />
        </button>

        {/* Quick Pack Size Indicator (Bottom of Image) */}
        {packSize && (
          <div className="absolute bottom-2 left-2.5 z-10">
            <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white font-medium text-[10px] rounded">
              {packSize}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {product.category.name}
              </span>
              {isGrocery && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                  Grocery
                </span>
              )}
            </div>
          )}
          <Link
            to={`/products/${product.slug}`}
            className="text-sm font-semibold text-slate-900 hover:text-accent-600 transition line-clamp-2 block leading-snug"
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
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
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
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm shrink-0 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : justAdded
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white active:scale-95'
            }`}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : justAdded ? `Added ${product.name} to cart` : `Add ${product.name} to cart`}
            title={isOutOfStock ? 'Sold Out' : justAdded ? 'Added to Cart!' : 'Add to Cart'}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added ✓</span>
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
