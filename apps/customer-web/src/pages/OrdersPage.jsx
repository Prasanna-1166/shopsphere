import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Calendar, CreditCard, Truck } from 'lucide-react';
import api from '../api/client';
import EmptyState from '../components/common/EmptyState';

const STATUS_BADGES = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-50 text-purple-800 border-purple-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await api.get('/orders/my-orders');
        if (res.data) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Orders</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track packages, view receipts, and manage your purchase history
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders placed yet"
          message="You haven't ordered anything yet. Discover our collection of kitchen essentials, audio accessories, and clothing!"
          actionLabel="Start Shopping"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const badgeClass = STATUS_BADGES[order.status] || 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">ORDER ID</span>
                      <span className="font-mono font-bold text-slate-900">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">ORDER DATE</span>
                      <span className="font-semibold text-slate-700">{dateStr}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">TOTAL</span>
                      <span className="font-bold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${badgeClass}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">
                        {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="font-semibold text-slate-900">
                        ₹{item.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {order.status === 'DELIVERED'
                        ? 'Package delivered to your address'
                        : order.status === 'CANCELLED'
                        ? 'Order cancelled'
                        : 'Delivery in progress'}
                    </span>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-accent-600 transition"
                  >
                    <span>View Details & Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
