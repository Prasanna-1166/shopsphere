import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
  Truck,
  ShieldCheck,
  Tag,
  ArrowRight,
  Sparkles,
  ShoppingBasket,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../api/client';
import { GENERIC_PRODUCT_FALLBACK_IMAGE, handleImageError } from '../../utils/imageFallback';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load categories
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Close menus on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsSuggestionsOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search suggestions with debounce
  const fetchSuggestions = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    setIsSearching(true);
    api.get(`/products/suggestions?q=${encodeURIComponent(query.trim())}`)
      .then((res) => {
        if (res.data && res.data.suggestions) {
          setSuggestions(res.data.suggestions);
          setIsSuggestionsOpen(res.data.suggestions.length > 0);
        }
      })
      .catch(() => {
        setSuggestions([]);
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 200);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSuggestionsOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectSuggestion = (slug) => {
    setIsSuggestionsOpen(false);
    setSearchQuery('');
    navigate(`/products/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      {/* Top Value Banner */}
      <div className="bg-slate-900 text-slate-200 py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-accent-500 shrink-0" />
            <span>Free delivery across India on orders above ₹499</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Genuine Products
            </span>
            <span>Easy 7-Day Returns</span>
            <span>Cash on Delivery Available</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4 md:gap-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-sm group-hover:bg-slate-800 transition">
              <span className="text-accent-500">S</span>S
            </div>
            <div>
              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 block leading-none">
                Shop<span className="text-accent-600">Sphere</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block -mt-0.5">
                At the end of your streets
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar with Live Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (suggestions.length > 0) setIsSuggestionsOpen(true);
                }}
                placeholder="Search for atta, basmati rice, earbuds, shirts, cookware..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Search
              </button>
            </form>

            {/* Live Autocomplete Suggestions Dropdown */}
            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden">
                <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Products & Suggestions
                </div>
                <div className="divide-y divide-slate-100">
                  {suggestions.map((item) => {
                    const price = item.discountPrice || item.price;
                    const thumb = item.images?.[0]?.url || GENERIC_PRODUCT_FALLBACK_IMAGE;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item.slug)}
                        className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition group"
                      >
                        <img
                          src={thumb}
                          alt={item.name}
                          onError={handleImageError}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-accent-600">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.category && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                {item.category.name}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-900">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <div className="px-3.5 pt-2 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
                  >
                    <span>View all results for "{searchQuery}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            {/* Quick Grocery Link */}
            <Link
              to="/products?category=grocery-daily-needs"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100/70 rounded-lg"
            >
              <ShoppingBasket className="w-4 h-4 text-emerald-600" />
              <span>Grocery & Essentials</span>
            </Link>

            <Link
              to="/products"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              All Products
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition flex items-center gap-1"
                aria-expanded={isCategoryDropdownOpen}
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Explore Departments
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug}`}
                        className="flex items-center justify-between px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <span>{cat.name}</span>
                        {cat.slug === 'grocery-daily-needs' && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Fresh & Pantry
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1.5 px-3.5">
                    <Link
                      to="/products"
                      className="block text-xs font-semibold text-accent-600 hover:text-accent-700"
                    >
                      Browse Entire Catalog →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative text-slate-700 hover:text-slate-900 transition p-2 hover:bg-slate-100 rounded-full"
              aria-label="Wishlist"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm"
              aria-label="Open shopping cart"
            >
              <ShoppingBag className="w-4 h-4 text-accent-400" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-accent-500 text-slate-900 text-xs font-bold">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu (NO Admin links exposed) */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition"
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-800 font-bold text-sm flex items-center justify-center">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>Wishlist</span>
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={logout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 px-3.5 py-2 rounded-lg transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions (Menu & Cart) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Directly below Header) */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search rice, atta, oil, tea, earphones..."
              className="w-full pl-9 pr-20 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Horizontal Category Strip for Instant Browsing */}
      <div className="bg-slate-50 border-t border-slate-200/80 overflow-x-auto scrollbar-none py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 text-xs font-semibold shrink-0">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold shrink-0 hidden sm:inline">
            Quick Shop:
          </span>
          <Link
            to="/products?category=grocery-daily-needs"
            className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition shrink-0 flex items-center gap-1"
          >
            <ShoppingBasket className="w-3.5 h-3.5" />
            <span>Grocery & Daily Needs</span>
          </Link>
          {categories
            .filter((c) => c.slug !== 'grocery-daily-needs')
            .map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 transition shrink-0"
              >
                {cat.name}
              </Link>
            ))}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-auto h-[calc(100vh-120px)] bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-base">Menu & Categories</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <p className="font-bold text-slate-900 text-sm">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/orders"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 text-center"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 text-center"
                  >
                    My Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-center font-semibold text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 bg-slate-100 text-slate-900 rounded-xl text-center font-semibold text-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Departments
              </p>
              <div className="grid grid-cols-1 gap-1">
                <Link
                  to="/products?category=grocery-daily-needs"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-semibold text-sm"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBasket className="w-4 h-4 text-emerald-600" />
                    <span>Grocery & Daily Needs</span>
                  </span>
                  <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Pantry
                  </span>
                </Link>
                {categories
                  .filter((c) => c.slug !== 'grocery-daily-needs')
                  .map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm block"
                    >
                      {cat.name}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Other links */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to="/wishlist"
                className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-700"
              >
                <span>Wishlist</span>
                <span className="text-xs font-bold text-rose-500">{wishlistCount} items</span>
              </Link>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="w-full text-left p-2 text-sm font-semibold text-rose-600"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
