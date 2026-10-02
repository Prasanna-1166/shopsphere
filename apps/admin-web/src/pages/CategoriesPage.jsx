import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function CategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '',
    active: true,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      if (res.data) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategoryId(null);
    setForm({ name: '', description: '', image: '', active: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategoryId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      active: cat.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await api.put(`/admin/categories/${editingCategoryId}`, form);
        showToast('Category updated.', 'success');
      } else {
        await api.post('/admin/categories', form);
        showToast('Category created.', 'success');
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category.', 'error');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await api.patch(`/admin/categories/${id}/toggle`);
      showToast(res.message || 'Status updated.', 'success');
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Could not update category status.', 'error');
    }
  };

  const handleDelete = async (id, name, productCount) => {
    if (productCount > 0) {
      alert(`Cannot delete category "${name}" because it contains ${productCount} assigned product(s).`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await api.delete(`/admin/categories/${id}`);
      showToast(res.message || 'Category deleted.', 'info');
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Could not delete category.', 'error');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Department & Category Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize the storefront navigation and catalog hierarchy
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-admin-600 hover:bg-admin-500 text-white text-xs font-bold transition shadow-lg shadow-admin-600/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Search categories by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading departments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No categories found.
          </div>
        ) : (
          filtered.map((cat) => {
            const productCount = cat._count?.products || 0;
            return (
              <div
                key={cat.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{cat.name}</h3>
                      <button
                        onClick={() => handleToggleActive(cat.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          cat.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {cat.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Slug: {cat.slug}</span>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {productCount} product(s)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name, productCount)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategoryId ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Header Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-admin-600"
            />
            <span>Active on Storefront</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition"
            >
              {editingCategoryId ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
