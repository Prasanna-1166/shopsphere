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
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';

const TIMELINE_STEPS = [
  { status: 'PENDING', label: 'Order Placed', icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'PROCESSING', label: 'Packing', icon: Package },
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
      if (res.data && res.data.order) {
        setOrder(res.data.order);
        setIsCancelModalOpen(false);
        showToast('Order has been cancelled and refund initiated.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-40 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState
          title="Order Not Found"
          message="We couldn't retrieve the details for this order. It may belong to another account or have an invalid identifier."
          actionLabel="View All Orders"
          onAction={() => {}}
        />
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === order.status);
  const activeStepIdx = currentStepIndex !== -1 ? currentStepIndex : 0;
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Orders</span>
      </Link>

      {/* Top Details Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Order #{order.id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                isCancelled ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {orderDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* 5-Step Order Tracking Timeline */}
        {!isCancelled ? (
          <div className="py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Delivery Progress
            </h3>
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Connecting Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-slate-900 -z-0 transition-all duration-500"
                style={{ width: `${(activeStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
              />

              {TIMELINE_STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isCompleted = idx <= activeStepIdx;
                const isCurrent = idx === activeStepIdx;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                        isCompleted
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-slate-200' : ''}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-semibold block leading-tight ${
                        isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>This order was cancelled. Any processed payments have been queued for automatic refund.</span>
          </div>
        )}
      </div>

      {/* 2-Column Details: Items List & Shipping Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ordered Items List */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Ordered Items ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">{item.productName}</span>
                  <p className="text-slate-500">
                    SKU: {item.sku} | Unit Price: ₹{item.unitPrice.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-700 font-medium">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 block">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Address & Payment Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Delivery Address</span>
            </div>
            {order.shippingAddress ? (
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — <strong>{order.shippingAddress.postalCode}</strong>
                </p>
                <p className="pt-1 text-slate-500">Phone: {order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Address details unavailable.</p>
            )}
          </div>

          {/* Payment & Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment & Price Breakdown</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Items Total</span>
                <span className="font-semibold text-slate-900">
                  ₹{order.subtotal?.toLocaleString('en-IN') || order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-bold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total</span>
                <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Cancel Order #{order.id.slice(-8).toUpperCase()}?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you wish to cancel this order? If you have already paid, your refund will be automatically credited to your original payment method.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time too long">Delivery time too long</option>
                <option value="Need to change delivery address">Need to change delivery address</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
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
