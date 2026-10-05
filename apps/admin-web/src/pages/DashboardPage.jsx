import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Boxes,
} from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/common/StatCard';

const STATUS_PILLS = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard/metrics');
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time server aggregated operational summary
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Catalog</span>
          </Link>
          <button
            onClick={loadMetrics}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(overview.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Settled paid transactions"
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Total Orders"
          value={overview.totalOrders || 0}
          subtitle="All lifetime orders"
          icon={ShoppingCart}
          color="admin"
        />

        <StatCard
          title="Active Customers"
          value={overview.totalCustomers || 0}
          subtitle="Registered customer accounts"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Catalog Products"
          value={overview.totalProducts || 0}
          subtitle="Active catalog items"
          icon={Package}
          color="amber"
        />
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Orders Alert */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</div>
              <div className="text-xl font-bold text-white">{overview.pendingOrders || 0} orders</div>
            </div>
          </div>
          <Link
            to="/orders?status=PENDING"
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs rounded-lg border border-amber-500/30 transition flex items-center gap-1.5"
          >
            <span>View Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Low Stock Products Alert */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Inventory</div>
              <div className="text-xl font-bold text-white">{overview.lowStockProductsCount || 0} items</div>
            </div>
          </div>
          <Link
            to="/inventory"
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs rounded-lg border border-rose-500/30 transition flex items-center gap-1.5"
          >
            <span>Manage Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2-Column Section: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white tracking-tight">Recent Orders</h2>
            <Link to="/orders" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <th className="pb-2.5">Order ID</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Total</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No customer orders placed yet. Orders will appear here automatically once customers checkout.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono font-medium text-slate-300">
                        #{ord.id.slice(0, 10)}...
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">{ord.user?.name}</div>
                        <div className="text-[10px] text-slate-500">{ord.user?.email}</div>
                      </td>
                      <td className="py-3 font-bold text-white">
                        ₹{ord.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                            STATUS_PILLS[ord.status] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/orders?search=${ord.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Top Products</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={p.productId || idx}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                      {p.productName}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      ₹{p.totalRevenue?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>SKU: {p.sku}</span>
                    <span>{p.totalUnitsSold} units sold</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
