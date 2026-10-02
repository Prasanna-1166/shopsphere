import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={Heart}
          title="Sign in to view your wishlist"
          description="Save your favorite pieces and access them across all your devices."
          actionText="Sign In to ShopSphere"
          actionLink="/login"
        />
      </div>
    );
  }

  if (wishlistItems.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product card to save items you'd love to buy later."
          actionText="Explore Catalog"
          actionLink="/products"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">Saved Wishlist</h1>
        <p className="text-sm text-slate-400 mt-1">
          {wishlistItems.length} curated product(s) saved for later
        </p>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistItems.map((item) => {
          const prod = item.product;
          if (!prod) return null;

          const isOutOfStock = prod.stockQuantity <= 0;
          const currentPrice = prod.discountPrice !== null ? prod.discountPrice : prod.price;
          const imgUrl =
            prod.images?.[0]?.url ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

          return (
            <div
              key={item.id}
              className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-slate-950 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => removeFromWishlist(prod.id)}
                  className="absolute top-3 right-3 p-2.5 rounded-xl bg-slate-900/80 text-rose-400 hover:bg-slate-900 transition shadow-lg"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block">
                    {prod.category?.name || 'Department'}
                  </span>
                  <Link
                    to={`/products/${prod.slug}`}
                    className="text-sm font-bold text-white hover:text-brand-300 transition line-clamp-1 mt-0.5 block"
                  >
                    {prod.name}
                  </Link>
                  <div className="text-base font-black text-white mt-1">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => handleMoveToCart(prod.id)}
                  disabled={isOutOfStock}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isOutOfStock
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-glow'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Move to Bag'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
