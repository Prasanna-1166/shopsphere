import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import { GENERIC_PRODUCT_FALLBACK_IMAGE, handleImageError } from '../utils/imageFallback';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Sign in to view your wishlist"
          message="Save your favorite products and access them across all your devices."
          actionLabel="Sign In to ShopSphere"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  if (wishlistItems.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Your wishlist is empty"
          message="Tap the heart icon on any product card to save items you'd love to buy later."
          actionLabel="Explore Catalog"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const handleMoveToCart = async (productId) => {
    const success = await addToCart(productId, 1);
    if (success) {
      await removeFromWishlist(productId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Wishlist</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {wishlistItems.length} product(s) saved for future purchase
        </p>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {wishlistItems.map((item) => {
          const prod = item.product;
          if (!prod) return null;

          const isOutOfStock = prod.stockQuantity <= 0;
          const currentPrice = prod.discountPrice !== null ? prod.discountPrice : prod.price;
          const imgUrl = prod.images?.[0]?.url || GENERIC_PRODUCT_FALLBACK_IMAGE;

          return (
            <div
              key={item.id}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <Link to={`/products/${prod.slug}`} className="block w-full h-full">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </Link>
                <button
                  onClick={() => removeFromWishlist(prod.id)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white transition shadow-sm border border-slate-200"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {prod.category?.name || 'Department'}
                  </span>
                  <Link
                    to={`/products/${prod.slug}`}
                    className="text-xs font-semibold text-slate-900 hover:text-accent-600 transition line-clamp-1 mt-0.5 block"
                  >
                    {prod.name}
                  </Link>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => handleMoveToCart(prod.id)}
                  disabled={isOutOfStock}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Move to Cart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
