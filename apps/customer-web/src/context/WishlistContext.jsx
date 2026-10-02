import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      if (res.data) {
        setWishlistItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your wishlist.', 'info');
      return;
    }

    try {
      const res = await api.post('/wishlist/toggle', { productId });
      if (res.data) {
        if (res.data.inWishlist) {
          showToast('Added to wishlist!', 'success');
        } else {
          showToast('Removed from wishlist.', 'info');
        }
        await fetchWishlist();
      }
    } catch (err) {
      showToast(err.message || 'Could not update wishlist.', 'error');
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
      showToast('Removed from wishlist.', 'info');
    } catch (err) {
      showToast(err.message || 'Could not remove item.', 'error');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        itemCount: wishlistItems.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
