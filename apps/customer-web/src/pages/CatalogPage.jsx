import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ShoppingBasket,
  ChevronDown,
  Check,
} from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹299', min: '', max: '299' },
  { label: '₹300 – ₹699', min: '300', max: '699' },
  { label: '₹700 – ₹1,499', min: '700', max: '1499' },
  { label: '₹1,500 & Above', min: '1500', max: '' },
];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters from URL Search Params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Fetch Categories
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (category) queryParams.set('category', category);
      if (sortBy) queryParams.set('sortBy', sortBy);
      if (minPrice) queryParams.set('minPrice', minPrice);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);
      if (inStock) queryParams.set('inStock', 'true');
      queryParams.set('page', page);
      queryParams.set('limit', 12);

      const res = await api.get(`/products?${queryParams.toString()}`);
      if (res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
      setFetchError(err.message || 'Unable to connect to product catalog server.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, minPrice, maxPrice, inStock, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  const updateFilter = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    if (!updates.page) {
      nextParams.set('page', 1);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setLocalSearch('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter({ search: localSearch.trim() });
  };

  const activeCategoryObj = categories.find((c) => c.slug === category || c.id === category);

  const hasActiveFilters = Boolean(search || category || minPrice || maxPrice || inStock || sortBy !== 'newest');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-900 transition">
          Store Catalog
        </Link>
        {activeCategoryObj && (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-900">{activeCategoryObj.name}</span>
          </>
        )}
      </nav>

      {/* 2. Header Banner & Category Title */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCategoryObj ? activeCategoryObj.name : search ? `Search: "${search}"` : 'Store Catalog'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              {activeCategoryObj?.description ||
                'Browse 106+ high-quality products across everyday grocery, cookware, tech, and lifestyle.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'} Available
            </span>
          </div>
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => updateFilter({ category: '' })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
              !category
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>
          {categories.map((cat) => {
            const isSelected = category === cat.slug || category === cat.id;
            const isGrocery = cat.slug === 'grocery-daily-needs';
            return (
              <button
                key={cat.id}
                onClick={() => updateFilter({ category: cat.slug })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? isGrocery
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : isGrocery
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isGrocery && <ShoppingBasket className="w-3.5 h-3.5" />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Controls & Active Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {/* Active Filter Chips */}
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold shadow-2xs">
              <span>Keyword: "{search}"</span>
              <button onClick={() => updateFilter({ search: '' })} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold shadow-2xs">
              <span>{activeCategoryObj?.name || category}</span>
              <button onClick={() => updateFilter({ category: '' })} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold shadow-2xs">
              <span>Price: ₹{minPrice || '0'} - ₹{maxPrice || 'Above'}</span>
              <button onClick={() => updateFilter({ minPrice: '', maxPrice: '' })} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {inStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold shadow-2xs">
              <span>In Stock Only</span>
              <button onClick={() => updateFilter({ inStock: '' })} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-accent-600 hover:text-accent-700 font-bold ml-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="sort-select" className="text-slate-500 shrink-0 hidden sm:inline">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => updateFilter({ sortBy: e.target.value })}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Alphabetical: A to Z</option>
          </select>
        </div>
      </div>

      {/* 4. Main Layout: Compact Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Desktop Compact Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Refine Catalog</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-accent-600 hover:text-accent-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Department
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => updateFilter({ category: '' })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                  !category ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Departments</span>
                {!category && <Check className="w-3.5 h-3.5" />}
              </button>
              {categories.map((cat) => {
                const isSelected = category === cat.slug || category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter({ category: cat.slug })}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Price Range
            </h3>
            <div className="space-y-1.5">
              {PRICE_RANGES.map((range, idx) => {
                const isChecked = minPrice === range.min && maxPrice === range.max;
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="radio"
                      name="priceRangeDesktop"
                      checked={isChecked}
                      onChange={() => updateFilter({ minPrice: range.min, maxPrice: range.max })}
                      className="text-slate-900 focus:ring-slate-900 rounded border-slate-300"
                    />
                    <span>{range.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateFilter({ inStock: e.target.checked ? 'true' : '' })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area (Dominates screen) */}
        <main className="lg:col-span-9 space-y-6">
          {/* API Error Banner with Retry */}
          {fetchError && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Unable to load products right now</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{fetchError}</p>
              <button
                onClick={fetchProducts}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !fetchError && <ProductSkeletonGrid count={12} />}

          {/* Empty Catalog State */}
          {!loading && !fetchError && products.length === 0 && (
            <EmptyState
              icon={ShoppingBag}
              title="No products match your criteria"
              description="Try clearing some filter tags, adjusting the price range, or searching for a different keyword."
              actionLabel="Reset All Filters"
              onAction={clearAllFilters}
            />
          )}

          {/* Product Grid */}
          {!loading && !fetchError && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !fetchError && pagination.totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
              <button
                onClick={() => updateFilter({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateFilter({ page: p })}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      p === pagination.page
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => updateFilter({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 5. Mobile Filter Drawer Slide-over */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white h-full p-5 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Filters & Refinement</span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Department
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => updateFilter({ category: '' })}
                    className={`w-full text-left p-2 rounded-lg text-xs font-medium ${
                      !category ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All Departments
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter({ category: cat.slug })}
                      className={`w-full text-left p-2 rounded-lg text-xs font-medium ${
                        category === cat.slug || category === cat.id
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Price Range
                </h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, idx) => {
                    const isChecked = minPrice === range.min && maxPrice === range.max;
                    return (
                      <label key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="radio"
                          name="priceRangeMobile"
                          checked={isChecked}
                          onChange={() => updateFilter({ minPrice: range.min, maxPrice: range.max })}
                        />
                        <span>{range.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* In-stock */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => updateFilter({ inStock: e.target.checked ? 'true' : '' })}
                  />
                  <span>In-Stock Items Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={clearAllFilters}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
