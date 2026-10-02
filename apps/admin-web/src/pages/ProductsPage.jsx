import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function ProductsPage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Selection for bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: 10,
    categoryId: '',
    active: true,
    images: [''],
  });

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvImportResult, setCsvImportResult] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // Fetch Categories
  useEffect(() => {
    api.get('/admin/categories')
      .then((res) => {
        if (res.data) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (category) query.set('category', category);
      if (stockStatus !== 'all') query.set('stockStatus', stockStatus);
      if (activeFilter !== 'all') query.set('active', activeFilter);
      query.set('page', page);
      query.set('limit', '15');

      const res = await api.get(`/admin/products?${query.toString()}`);
      if (res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, stockStatus, activeFilter, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      sku: `PROD-${Date.now().toString(36).toUpperCase()}`,
      description: '',
      price: '',
      discountPrice: '',
      stockQuantity: 20,
      categoryId: categories[0]?.id || '',
      active: true,
      images: [''],
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      description: prod.description,
      price: prod.price,
      discountPrice: prod.discountPrice || '',
      stockQuantity: prod.stockQuantity,
      categoryId: prod.categoryId,
      active: prod.active,
      images: prod.images && prod.images.length > 0 ? prod.images.map((img) => img.url) : [''],
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        discountPrice: productForm.discountPrice ? parseFloat(productForm.discountPrice) : null,
        stockQuantity: parseInt(productForm.stockQuantity, 10),
        images: productForm.images.filter((url) => url && url.trim().length > 0),
      };

      if (editingProductId) {
        await api.put(`/admin/products/${editingProductId}`, payload);
        showToast('Product updated successfully.', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('New product created.', 'success');
      }

      setIsProductModalOpen(false);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await api.patch(`/admin/products/${id}/toggle`);
      showToast(res.message || 'Product status updated.', 'success');
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Could not toggle product.', 'error');
    }
  };

  const handleBulkToggle = async (targetActive) => {
    if (selectedProductIds.length === 0) return;
    try {
      const res = await api.post('/admin/products/bulk-toggle', {
        productIds: selectedProductIds,
        active: targetActive,
      });
      showToast(res.message || 'Bulk updated.', 'success');
      setSelectedProductIds([]);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Bulk action failed.', 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${name}"?`)) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      showToast(res.message || 'Product removed.', 'info');
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Could not delete product.', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await api.get('/admin/products/export/csv');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shopsphere_products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Products exported to CSV.', 'success');
    } catch (err) {
      showToast('Failed to export CSV.', 'error');
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    try {
      setCsvLoading(true);
      const res = await api.post('/admin/products/import/csv', { csvData: csvText });
      setCsvImportResult(res.data);
      showToast(res.message || 'CSV Import complete.', 'success');
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'CSV Import failed.', 'error');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Product Catalog Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total {pagination.total} catalog item(s) in system
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-300 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setCsvImportResult(null);
              setCsvText(
                'name,sku,price,stock,category\nSample Urban Hoodie,SMP-HOD-099,2999,50,Fashion & Apparel'
              );
              setIsCsvModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-300 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-admin-600 hover:bg-admin-500 text-white text-xs font-bold transition shadow-lg shadow-admin-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search name, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Status */}
        <select
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="all">All Stock Statuses</option>
          <option value="in_stock">In Stock (&gt; 5)</option>
          <option value="low_stock">Low Stock (1 - 5)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
        </select>

        {/* Active Status */}
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="all">All Visibility (Active / Inactive)</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Bulk Action Banner */}
      {selectedProductIds.length > 0 && (
        <div className="p-3 bg-admin-500/10 border border-admin-500/30 rounded-2xl flex items-center justify-between animate-in fade-in">
          <span className="text-xs font-bold text-admin-300">
            {selectedProductIds.length} product(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkToggle(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
            >
              Bulk Activate
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition"
            >
              Bulk Deactivate
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 && selectedProductIds.length === products.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-admin-600"
                  />
                </th>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading product records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isLow = p.stockQuantity <= 5 && p.stockQuantity > 0;
                  const isOut = p.stockQuantity === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-850/50 transition ${
                        isSelected ? 'bg-admin-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(p.id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-admin-600"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.images?.[0]?.url ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'
                            }
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-950 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate max-w-[200px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Slug: {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-300">{p.sku}</td>
                      <td className="p-4 text-slate-300">{p.category?.name}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                        {p.discountPrice && (
                          <div className="text-[10px] text-brand-400">
                            Discount: ₹{p.discountPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider transition ${
                            p.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {p.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete / Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-slate-400">
              Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong>
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductId ? 'Edit Product Details' : 'Create New Catalog Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })
                }
                className="w-full bg-slate-950 font-mono text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Discount Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.discountPrice}
                onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={productForm.stockQuantity}
                onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Department / Category *</label>
              <select
                required
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.active}
                  onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-admin-600"
                />
                <span>Active for Customer Storefront</span>
              </label>
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Product Image URLs</label>
              <button
                type="button"
                onClick={() => setProductForm({ ...productForm, images: [...productForm.images, ''] })}
                className="text-[11px] text-admin-400 font-bold hover:underline"
              >
                + Add Another Image URL
              </button>
            </div>
            <div className="space-y-2">
              {productForm.images.map((url, idx) => (
                <input
                  key={idx}
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={url}
                  onChange={(e) => {
                    const newImages = [...productForm.images];
                    newImages[idx] = e.target.value;
                    setProductForm({ ...productForm, images: newImages });
                  }}
                  className="w-full bg-slate-950 text-xs text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition"
            >
              {editingProductId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Products via CSV"
      >
        <form onSubmit={handleImportCSV} className="space-y-4">
          <p className="text-xs text-slate-400">
            Paste valid CSV data below. Required columns: <code>name</code>, <code>sku</code>, <code>price</code>. Optional: <code>stock</code>, <code>category</code>.
          </p>

          <textarea
            required
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
          />

          {csvImportResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-emerald-400 block">
                Imported / Updated: {csvImportResult.importedCount} products
              </span>
              {csvImportResult.errors && csvImportResult.errors.length > 0 && (
                <div className="text-rose-400 pt-1">
                  <span className="font-bold block">Warnings/Errors:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {csvImportResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={csvLoading}
              className="px-5 py-2.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition"
            >
              {csvLoading ? 'Validating & Importing...' : 'Run CSV Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
