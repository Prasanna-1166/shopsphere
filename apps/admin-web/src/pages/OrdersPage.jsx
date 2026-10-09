import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

const STATUS_PILLS = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Inspection Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    if (key !== 'page') nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      });

      const res = await api.get(`/admin/orders?${query.toString()}`);
      if (res.data) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, status, paymentStatus, page]);

  const handleInspectOrder = async (orderId) => {
    try {
      setDetailLoading(true);
      setIsDetailModalOpen(true);
      const res = await api.get(`/admin/orders/${orderId}`);
      if (res.data && res.data.order) {
        setSelectedOrder(res.data.order);
        setTargetStatus('');
        setStatusNote('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch order details.', 'error');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    try {
      setUpdatingStatus(true);
      await api.patch(`/admin/orders/${selectedOrder.id}/status`, {
        status: targetStatus,
        note: statusNote,
      });

      showToast(`Order status updated to ${targetStatus}.`, 'success');
      setIsDetailModalOpen(false);
      await loadOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const allowedNextStatuses = selectedOrder ? VALID_TRANSITIONS[selectedOrder.status] || [] : [];
  const activePayment = selectedOrder?.payments?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-admin-400" />
            Order Fulfillment & Real Payment Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer orders, verify real Razorpay payment provider references, and manage logistics
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID, customer email..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => updateParam('paymentStatus', e.target.value)}
          className="bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
        >
          <option value="">All Payment States</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Refunded</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment & Gateway</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading orders from database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const pay = ord.payments?.[0];
                  return (
                    <tr key={ord.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-300">
                        #{ord.id.slice(0, 10)}...
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{ord.user?.name}</div>
                        <div className="text-[10px] text-slate-500">{ord.user?.email}</div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-bold text-white">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : ord.paymentStatus === 'REFUNDED'
                                ? 'bg-purple-500/20 text-purple-400'
                                : ord.paymentStatus === 'FAILED'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-300">
                            {pay?.provider || 'SIMULATOR'}
                          </span>
                          {pay?.provider === 'SIMULATOR' || pay?.provider === 'MOCK' ? (
                            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[9px] font-bold rounded">
                              TEST
                            </span>
                          ) : pay?.provider === 'RAZORPAY' ? (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold rounded">
                              GATEWAY
                            </span>
                          ) : null}
                        </div>
                        {pay?.providerReference && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={pay.providerReference}>
                            {pay.providerReference}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            STATUS_PILLS[ord.status] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleInspectOrder(ord.id)}
                          className="px-3 py-1.5 bg-admin-600 hover:bg-admin-500 text-white font-bold text-xs rounded-xl transition"
                        >
                          Inspect
                        </button>
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
              onClick={() => updateParam('page', (pagination.page - 1).toString())}
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
              onClick={() => updateParam('page', (pagination.page + 1).toString())}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Order Details & Workflow Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: #${selectedOrder?.id}`}
        maxWidth="max-w-4xl"
      >
        {detailLoading ? (
          <p className="text-xs text-slate-500 py-8 text-center">Loading full order & payment records...</p>
        ) : selectedOrder ? (
          <div className="space-y-6 text-xs">
            {/* Payment Information Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${
                    activePayment?.provider === 'SIMULATOR' || activePayment?.provider === 'MOCK'
                      ? 'text-purple-400'
                      : 'text-emerald-400'
                  }`} />
                  <span>
                    {activePayment?.provider === 'SIMULATOR' || activePayment?.provider === 'MOCK'
                      ? 'Local Simulator Payment Record (Test Sandbox — No Real Currency)'
                      : activePayment?.provider === 'COD'
                      ? 'Cash on Delivery (COD) Record'
                      : 'Real Gateway Payment Record (Razorpay Standard)'}
                  </span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    selectedOrder.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedOrder.paymentStatus === 'REFUNDED'
                      ? 'bg-purple-500/20 text-purple-400'
                      : selectedOrder.paymentStatus === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Payment Provider</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-slate-200">{activePayment?.provider || 'SIMULATOR'}</strong>
                    {activePayment?.provider === 'SIMULATOR' || activePayment?.provider === 'MOCK' ? (
                      <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded">
                        TEST
                      </span>
                    ) : activePayment?.provider === 'RAZORPAY' ? (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded">
                        GATEWAY
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">Provider Reference</span>
                  <strong className="text-slate-300 font-mono truncate block mt-0.5" title={activePayment?.providerReference || 'N/A'}>
                    {activePayment?.providerReference || 'Pending Init'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Payable Amount</span>
                  <strong className="text-white block mt-0.5">₹{selectedOrder.totalAmount.toLocaleString('en-IN')} INR</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Date</span>
                  <strong className="text-slate-300 block mt-0.5">
                    {new Date(activePayment?.createdAt || selectedOrder.createdAt).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {selectedOrder.paymentStatus !== 'PAID' && activePayment?.provider !== 'COD' && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Notice: Order payment is unverified ({selectedOrder.paymentStatus}). Fulfillment (dispatch/shipping) is locked until payment is verified as PAID.
                  </span>
                </div>
              )}
            </div>

            {/* Status Transition Form */}
            {allowedNextStatuses.length > 0 ? (
              <form
                onSubmit={handleUpdateStatus}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Update Status Workflow</span>
                  <span className="text-slate-400">
                    Current: <strong className="text-white uppercase">{selectedOrder.status}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Permitted Next Status *
                    </label>
                    <select
                      required
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500 cursor-pointer"
                    >
                      <option value="">Select Next Status</option>
                      {allowedNextStatuses.map((s) => (
                        <option key={s} value={s}>
                          Move to {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Audit Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatched with BlueDart AWB #9812456"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-admin-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={updatingStatus || !targetStatus}
                    className="px-4 py-2 bg-admin-600 hover:bg-admin-500 disabled:opacity-40 text-white font-bold rounded-xl transition"
                  >
                    {updatingStatus ? 'Updating...' : 'Commit Status Transition'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-center">
                This order is in terminal state <strong className="text-white uppercase">({selectedOrder.status})</strong>. No further status changes are permitted.
              </div>
            )}

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ordered Items ({selectedOrder.items?.length})
              </h3>
              <div className="divide-y divide-slate-800/80 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <div className="font-bold text-white">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        ₹{item.subtotal.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block mb-1">Customer Account</span>
                <p className="text-slate-200 font-bold">{selectedOrder.user?.name}</p>
                <p className="text-slate-400">{selectedOrder.user?.email}</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block mb-1">Shipping Destination</span>
                {selectedOrder.shippingAddress && (
                  <>
                    <p className="text-slate-200 font-bold">
                      {selectedOrder.shippingAddress.fullName}
                    </p>
                    <p className="text-slate-400">
                      {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p className="text-slate-400 font-mono">
                      Phone: {selectedOrder.shippingAddress.phone}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
