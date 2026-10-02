import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  Plus,
  Minus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function InventoryPage() {
  const { showToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStockInput, setNewStockInput] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Stock replenishment / warehouse cycle count');

  // History Drawer / Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (lowStockOnly) query.set('lowStockOnly', 'true');
      query.set('page', page);
      query.set('limit', '20');

      const res = await api.get(`/admin/inventory?${query.toString()}`);
      if (res.data) {
        setInventory(res.data.inventory || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly, page]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenAdjustModal = (item) => {
    setSelectedProduct(item);
    setNewStockInput(item.stockQuantity);
    setAdjustReason('Stock replenishment / warehouse cycle count');
    setIsAdjustModalOpen(true);
  };

  const handleSaveStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const val = parseInt(newStockInput, 10);
    if (isNaN(val) || val < 0) {
      showToast('Inventory stock cannot be negative.', 'error');
      return;
    }

    try {
      await api.post('/admin/inventory/adjust', {
        productId: selectedProduct.id,
        newQuantity: val,
        reason: adjustReason,
      });

      showToast(`Stock for ${selectedProduct.name} updated to ${val}.`, 'success');
      setIsAdjustModalOpen(false);
      await loadInventory();
    } catch (err) {
      showToast(err.message || 'Could not adjust inventory.', 'error');
    }
  };

  const handleOpenHistory = async (productId = null) => {
    try {
      setIsHistoryModalOpen(true);
      setHistoryLoading(true);
      const url = productId
        ? `/admin/inventory/history?productId=${productId}&limit=50`
        : `/admin/inventory/history?limit=50`;
      const res = await api.get(url);
      if (res.data) {
        setHistoryLogs(res.data.transactions || []);
      }
    } catch (err) {
      showToast('Could not load transaction history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Warehouse & Inventory Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock auditing with immutable ledger transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenHistory(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-300 transition"
          >
            <History className="w-4 h-4 text-admin-400" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search stock by SKU or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer self-start sm:self-auto">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500"
          />
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Show Low Stock (≤ 5 units) Only</span>
          </span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-4">SKU</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Audit Counts</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Auditing stock records...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching inventory items.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isOut = item.stockQuantity === 0;
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= 5;

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-300">{item.sku}</td>
                      <td className="p-4 font-bold text-white">{item.name}</td>
                      <td className="p-4 text-slate-400">{item.category?.name}</td>
                      <td className="p-4">
                        <span
                          className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        ₹{item.price.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-slate-500">
                        {item._count?.inventoryTransactions || 0} ledger events
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition shadow"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => handleOpenHistory(item.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="View product ledger"
                          >
                            <History className="w-4 h-4" />
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

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between text-xs">
            <span className="text-slate-400">Current In Stock:</span>
            <span className="font-mono font-bold text-white">
              {selectedProduct?.stockQuantity} units
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">New Available Quantity *</label>
            <input
              type="number"
              min="0"
              required
              value={newStockInput}
              onChange={(e) => setNewStockInput(e.target.value)}
              className="w-full bg-slate-950 font-mono text-sm text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Adjustment Reason / Audit Note *</label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer mb-2"
            >
              <option value="Stock replenishment / warehouse cycle count">
                Stock replenishment / warehouse cycle count
              </option>
              <option value="Physical inventory discrepancy correction">
                Physical inventory discrepancy correction
              </option>
              <option value="Damaged / expired item write-off">
                Damaged / expired item write-off
              </option>
              <option value="Returned item inspected and restocked">
                Returned item inspected and restocked
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition"
            >
              Commit Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* History Ledger Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Inventory Transaction Audit Ledger"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {historyLoading ? (
            <p className="text-xs text-slate-500 py-8 text-center">Loading ledger history...</p>
          ) : historyLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No transactions recorded.</p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {historyLogs.map((tx) => (
                <div key={tx.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{tx.product?.name}</span>
                      <span className="font-mono text-slate-500 text-[10px]">({tx.product?.sku})</span>
                    </div>
                    <p className="text-slate-400">{tx.reason || 'No note specified'}</p>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Logged by: {tx.user?.name || 'System/Customer'}</span>
                      <span>•</span>
                      <span>{new Date(tx.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                        tx.quantityChange > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {tx.previousQuantity} → {tx.newQuantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
