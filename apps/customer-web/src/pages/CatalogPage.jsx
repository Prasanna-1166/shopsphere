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
} from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹499', min: '', max: '499' },
  { label: '₹500 – ₹999', min: '500', max: '999' },
  { label: '₹1,000 – ₹1,999', min: '1000', max: '1999' },
  { label: '₹2,000 & Above', min: '2000', max: '' },
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

  // Fetch Categories once
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });
  }, []);

  // Fetch Products whenever search params change
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
    // Reset to page 1 on filter changes unless explicit page update
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

  const selectedCategoryObj = categories.find((c) => c.slug === category || c.id === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Link to="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">
            {selectedCategoryObj ? selectedCategoryObj.name : 'All Products'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {selectedCategoryObj ? selectedCategoryObj.name : 'Store Catalog'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {loading
                ? 'Loading genuine products...'
                : fetchError
                ? 'Server connection issue'
                : `Showing ${products.length} of ${pagination.total} products with doorstep delivery`}
            </p>
          </div>

          {/* Mobile Filter Toggle & Sort Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => updateFilter({ sortBy: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
            >
              <option value="newest">Sort by: Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Product Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(search || category || minPrice || maxPrice || inStock) && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500">Active Filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md">
              Keyword: "{search}"
              <button onClick={() => updateFilter({ search: '' })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md">
              Category: {selectedCategoryObj?.name || category}
              <button onClick={() => updateFilter({ category: '' })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md">
              Price: ₹{minPrice || 0} - ₹{maxPrice || 'Any'}
              <button onClick={() => updateFilter({ minPrice: '', maxPrice: '' })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {inStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md">
              In Stock Only
              <button onClick={() => updateFilter({ inStock: '' })}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-accent-600 hover:text-accent-700 ml-auto flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Product Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          {/* Keyword Search Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5">
              Search Catalog
            </h4>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded hover:bg-slate-800"
              >
                Find
              </button>
            </form>
          </div>

          {/* Categories Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Departments
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => updateFilter({ category: '' })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  !category
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter({ category: cat.slug })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    category === cat.slug || category === cat.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Price Range
            </h4>
            <div className="space-y-1">
              {PRICE_RANGES.map((range, idx) => {
                const isSelected = minPrice === range.min && maxPrice === range.max;
                return (
                  <button
                    key={idx}
                    onClick={() => updateFilter({ minPrice: range.min, maxPrice: range.max })}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Availability
            </h4>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateFilter({ inStock: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>In-Stock items only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <ProductSkeletonGrid count={6} />
          ) : fetchError ? (
            <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Unable to load products right now</h3>
                <p className="text-xs text-slate-500 mt-1">{fetchError}</p>
              </div>
              <button
                onClick={fetchProducts}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products match your filters"
              message="We couldn't find any products matching your current category, price range, or search keyword. Try clearing or relaxing your filters."
              actionLabel="Clear All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => updateFilter({ page: page - 1 })}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-medium text-slate-600">
                    Page <span className="font-bold text-slate-900">{page}</span> of{' '}
                    <span className="font-bold text-slate-900">{pagination.totalPages}</span>
                  </span>

                  <button
                    onClick={() => updateFilter({ page: page + 1 })}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filters Slide-over Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Filter Products</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Departments</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { updateFilter({ category: '' }); setIsMobileFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs ${!category ? 'bg-slate-900 text-white font-bold' : 'text-slate-700'}`}
                  >
                    All Departments
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { updateFilter({ category: c.slug }); setIsMobileFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-xs ${category === c.slug ? 'bg-slate-900 text-white font-bold' : 'text-slate-700'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Price Range</h4>
                <div className="space-y-1">
                  {PRICE_RANGES.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { updateFilter({ minPrice: r.min, maxPrice: r.max }); setIsMobileFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-xs ${minPrice === r.min && maxPrice === r.max ? 'bg-slate-100 font-bold' : 'text-slate-700'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
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
