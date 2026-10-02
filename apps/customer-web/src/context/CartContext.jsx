import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    totalSavings: 0,
    shipping: 0,
    finalTotal: 0,
    totalQuantity: 0,
    isFreeShipping: false,
  });
  const [loading, setLoading] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSummary({ subtotal: 0, totalSavings: 0, shipping: 0, finalTotal: 0, totalQuantity: 0, isFreeShipping: false });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart.', 'info');
      return false;
    }

    try {
      const res = await api.post('/cart/add', { productId, quantity });
      if (res.data) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
        showToast('Added to bag!', 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Could not add item to bag.', 'error');
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      if (res.data) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      showToast(err.message || 'Could not update quantity.', 'error');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      if (res.data) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
        showToast('Item removed from bag.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Could not remove item.', 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setItems([]);
      setSummary({ subtotal: 0, totalSavings: 0, shipping: 0, finalTotal: 0, totalQuantity: 0, isFreeShipping: false });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        loading,
        itemCount: summary.totalQuantity || 0,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
