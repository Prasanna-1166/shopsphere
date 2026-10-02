import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, ShoppingBag, Eye, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function CustomersPage() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      query.set('page', page);
      query.set('limit', '15');

      const res = await api.get(`/admin/customers?${query.toString()}`);
      if (res.data) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleInspectCustomer = async (id) => {
    try {
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      const res = await api.get(`/admin/customers/${id}`);
      if (res.data) {
        setSelectedCustomer(res.data.customer);
      }
    } catch (err) {
      showToast('Could not load customer details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change account status to ${nextStatus}?`)) return;

    try {
      await api.patch(`/admin/customers/${id}/status`, { status: nextStatus });
      showToast(`Customer account status updated to ${nextStatus}.`, 'success');
      await loadCustomers();
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer({ ...selectedCustomer, status: nextStatus });
      }
    } catch (err) {
      showToast(err.message || 'Could not update customer status.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered customer accounts, lifetime order history, and account standing
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Search customer by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-4">Customer</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.email}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 font-bold text-white">{c.totalOrders} order(s)</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleInspectCustomer(c.id)}
                          className="px-3 py-1 bg-admin-600 hover:bg-admin-500 text-white font-bold rounded-xl transition"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                            c.status === 'ACTIVE'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title={c.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Customer Profile Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        maxWidth="max-w-3xl"
      >
        {detailLoading ? (
          <p className="text-xs text-slate-500 py-8 text-center">Loading customer details...</p>
        ) : selectedCustomer ? (
          <div className="space-y-6 text-xs">
            {/* Overview */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-500">Name</span>
                <div className="font-bold text-white text-sm">{selectedCustomer.name}</div>
              </div>
              <div>
                <span className="text-slate-500">Email</span>
                <div className="font-mono text-white text-xs">{selectedCustomer.email}</div>
              </div>
              <div>
                <span className="text-slate-500">Total Spent</span>
                <div className="font-bold text-emerald-400 text-sm">
                  ₹{selectedCustomer.totalSpent?.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                <div className="font-bold text-white uppercase">{selectedCustomer.status}</div>
              </div>
            </div>

            {/* Orders History */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Past Orders ({selectedCustomer.orders?.length || 0})
              </h3>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {selectedCustomer.orders?.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No orders placed by this customer.</p>
                ) : (
                  selectedCustomer.orders?.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-200">
                          #{ord.id.slice(0, 12)}...
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">
                          ₹{ord.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-brand-400 block uppercase">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
