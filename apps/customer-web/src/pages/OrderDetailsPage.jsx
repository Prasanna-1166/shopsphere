import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  CheckCheck,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';

const TIMELINE_STEPS = [
  { status: 'PENDING', label: 'Order Placed', icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'PROCESSING', label: 'Preparing', icon: Package },
  { status: 'SHIPPED', label: 'In Transit', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCheck },
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.data && res.data.order) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      if (res.data) {
        showToast('Order has been cancelled.', 'info');
        setIsCancelModalOpen(false);
        await loadOrder();
      }
    } catch (err) {
      showToast(err.message || 'Could not cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 animate-pulse">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Package}
          title="Order Not Found"
          description={error || 'Unable to locate the specified order.'}
          actionText="Back to Orders"
          actionLink="/orders"
        />
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.status);
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Order #{order.id}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          {isCancellable && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition self-start sm:self-auto"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Visual Status Timeline */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Fulfillment Status
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">This order has been cancelled</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                All charges have been refunded and inventory has been restored.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Progress Bar */}
            <div className="grid grid-cols-5 gap-2 relative z-10">
              {TIMELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-lg ${
                        isCurrent
                          ? 'bg-brand-500 text-slate-950 ring-4 ring-brand-500/20 shadow-glow'
                          : isPassed
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                          : 'bg-slate-950 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isCurrent
                          ? 'text-brand-400'
                          : isPassed
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Grid: Items + Shipping/Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Order Items ({order.items?.length})
            </h3>

            <div className="divide-y divide-slate-800/80">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                  <img
                    src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover bg-slate-950 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.productName}</h4>
                    <span className="text-xs text-slate-400 font-mono">SKU: {item.sku}</span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      ₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right font-black text-sm text-white">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span className="text-brand-400 font-medium">
                  {order.shippingAmount === 0 ? 'FREE' : `₹${order.shippingAmount}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Paid</span>
                <span className="text-brand-400">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="md:col-span-5 space-y-6">
          {/* Shipping Address */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>Shipping Address</span>
            </div>
            {order.shippingAddress && (
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white text-sm">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p className="text-slate-400 font-mono pt-1">Phone: {order.shippingAddress.phone}</p>
              </div>
            )}
          </div>

          {/* Payment Status Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <CreditCard className="w-4 h-4 text-brand-400" />
              <span>Payment Details</span>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-medium text-white">
                  {order.payments?.[0]?.metadata?.paymentMethod || 'Simulated Card / UPI'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {order.payments?.[0]?.providerReference || 'MOCK-TXN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Cancel Order?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, full refund is initiated and
              inventory is restored.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Incorrect shipping address entered">Incorrect shipping address</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
