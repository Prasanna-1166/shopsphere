import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
} from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters from URL Search Params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [localSearch, setLocalSearch] = useState(search);

  // Fetch Categories once
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Fetch Products whenever search params change
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (category) queryParams.set('category', category);
      if (sortBy) queryParams.set('sortBy', sortBy);
      if (minPrice) queryParams.set('minPrice', minPrice);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);
      if (inStock) queryParams.set('inStock', 'true');
      queryParams.set('page', page);
      queryParams.set('limit', '12');

      const res = await api.get(`/products?${queryParams.toString()}`);
      if (res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, minPrice, maxPrice, inStock, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localMinPrice) params.set('minPrice', localMinPrice);
    else params.delete('minPrice');

    if (localMaxPrice) params.set('maxPrice', localMaxPrice);
    else params.delete('maxPrice');

    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', localSearch.trim());
  };

  const clearAllFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = search || category || minPrice || maxPrice || inStock || sortBy !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Explore Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">
            Showing {pagination.total} product(s) available in our store
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="bg-slate-900 text-sm font-medium text-slate-200 px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Alphabetical: A - Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-semibold uppercase mr-1">Active:</span>

          {search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg">
              Search: "{search}"
              <button onClick={() => { setLocalSearch(''); updateParam('search', ''); }}>
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
              </button>
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 rounded-lg">
              Category: {categories.find((c) => c.slug === category || c.id === category)?.name || category}
              <button onClick={() => updateParam('category', '')}>
                <X className="w-3.5 h-3.5 text-brand-400 hover:text-white" />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg">
              Price: ₹{minPrice || 0} - ₹{maxPrice || '∞'}
              <button
                onClick={() => {
                  setLocalMinPrice('');
                  setLocalMaxPrice('');
                  const params = new URLSearchParams(searchParams);
                  params.delete('minPrice');
                  params.delete('maxPrice');
                  setSearchParams(params);
                }}
              >
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
              </button>
            </span>
          )}

          {inStock && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 rounded-lg">
              In Stock Only
              <button onClick={() => updateParam('inStock', '')}>
                <X className="w-3.5 h-3.5 text-emerald-400 hover:text-white" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold ml-2 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Layout Grid: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters Desktop */}
        <aside className="hidden lg:block space-y-6 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 sticky top-28">
          {/* Keyword Search */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Filter by keyword
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Product name, SKU..."
                className="w-full bg-slate-950 text-xs text-slate-200 pl-8 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </form>
          </div>

          {/* Categories List */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => updateParam('category', '')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  !category
                    ? 'bg-brand-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <span>All Departments</span>
                <span>{categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)}</span>
              </button>
              {categories.map((cat) => {
                const isSelected = category === cat.slug || category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', isSelected ? '' : cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-brand-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] opacity-75">{cat._count?.products || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Price Range (₹)
            </h3>
            <form onSubmit={handleApplyPriceFilter} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
              >
                Apply Price
              </button>
            </form>
          </div>

          {/* Availability Toggle */}
          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900"
              />
              <span>In-stock items only</span>
            </label>
          </div>
        </aside>

        {/* Mobile Filter Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden overflow-y-auto bg-slate-950/90 backdrop-blur-md p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Filter Products</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => updateParam('category', isSelected ? '' : cat.slug)}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition ${
                          isSelected
                            ? 'bg-brand-500 border-brand-400 text-slate-950'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3.5 bg-brand-500 text-slate-950 font-bold rounded-xl"
              >
                Show {pagination.total} Results
              </button>
            </div>
          </div>
        )}

        {/* Products Grid Main Area */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <ProductSkeletonGrid count={9} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products matched your filters"
              description="Try clearing your search terms, expanding the price range, or selecting another category."
              actionText="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateParam('page', (pagination.page - 1).toString())}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-sm text-slate-400 font-medium">
                Page <span className="text-white font-bold">{pagination.page}</span> of{' '}
                <span className="text-white font-bold">{pagination.totalPages}</span>
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateParam('page', (pagination.page + 1).toString())}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
