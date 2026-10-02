import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import api from '../api/client';
import EmptyState from '../components/common/EmptyState';

const STATUS_BADGES = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">My Orders</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review historical purchases, monitor shipments, and track current statuses.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-900 rounded-3xl border border-slate-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders placed yet"
          description="You haven't ordered anything yet. Discover our trending categories and make your first order!"
          actionText="Browse Products"
          actionLink="/products"
        />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">#{order.id}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                        STATUS_BADGES[order.status] || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-base font-black text-white">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items Thumbnails */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0"
                      >
                        <img
                          src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900"
                        />
                        <div className="text-xs pr-2">
                          <p className="font-bold text-slate-200 truncate max-w-[140px]">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="p-3 bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-slate-200 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5 shadow"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
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
