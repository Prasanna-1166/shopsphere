import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../api/client';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  useEffect(() => {
    // Fetch categories for navbar navigation
    api.get('/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Close menus when route changes or clicked outside
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-brand-950 via-slate-900 to-brand-950 border-b border-brand-500/20 py-1.5 px-4 text-center text-xs font-medium text-brand-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span>Free Express Delivery on all orders above ₹1,500 across India.</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition">
              <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-brand-400 transition">
                Shop<span className="text-brand-400">Sphere</span>
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                At the End of Your Streets
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative items-center mx-4"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, headphones, sneakers, watches..."
              className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-400 pl-11 pr-4 py-2.5 rounded-full border border-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/products" className="hover:text-brand-400 transition">
              Catalog
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center gap-1.5 hover:text-brand-400 transition py-2"
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-slate-500 uppercase px-3 py-1.5">
                    Browse Departments
                  </div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 transition"
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-slate-500">{cat._count?.products || 0}</span>
                    </Link>
                  ))}
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <Link
                      to="/products"
                      className="block px-3 py-2 text-xs font-semibold text-brand-400 hover:bg-slate-800 rounded-xl"
                    >
                      View All Products →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/about" className="hover:text-brand-400 transition">
              About
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-slate-300 hover:text-brand-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-slate-950 font-bold text-[11px] rounded-full flex items-center justify-center shadow-glow">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 text-slate-300 hover:text-brand-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-slate-950 font-bold text-[11px] rounded-full flex items-center justify-center shadow-glow animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sm font-medium transition"
                >
                  <span className="text-slate-200 hidden sm:inline max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-xs sm:text-sm font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 rounded-xl transition shadow-glow"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* User Dropdown */}
              {isAuthenticated && isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-slate-100 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 rounded-xl transition"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 rounded-xl transition"
                  >
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Addresses & Profile</span>
                  </Link>

                  <div className="border-t border-slate-800 my-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar & Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6 pt-2 border-t border-slate-800 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-900 text-sm text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </form>

            <div className="space-y-1">
              <Link
                to="/products"
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                All Products
              </Link>
              <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Categories</div>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="block px-5 py-1.5 text-sm text-slate-300 hover:text-brand-400"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/about"
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                About ShopSphere
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
