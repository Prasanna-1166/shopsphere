import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  PieChart,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/common/StatCard';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const categoryBreakdown = data?.categoryBreakdown || [];
  const ordersByStatus = data?.ordersByStatus || [];
  const revenueTrends = data?.revenueTrends || [];
  const topProducts = data?.topProducts || [];

  const maxCatRevenue = Math.max(...categoryBreakdown.map((c) => c.revenue), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Business Intelligence & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Server-side aggregated financials, category sales volume, and customer trends
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Paid Revenue"
          value={`₹${summary.totalRevenue?.toLocaleString('en-IN')}`}
          subtitle="Lifetime settled revenue"
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Average Order Value"
          value={`₹${summary.averageOrderValue?.toLocaleString('en-IN')}`}
          subtitle="Revenue per paid order"
          icon={TrendingUp}
          color="admin"
        />

        <StatCard
          title="Fulfilled Orders"
          value={summary.totalPaidOrders || 0}
          subtitle="Successful checkouts"
          icon={ShoppingCart}
          color="blue"
        />

        <StatCard
          title="Customer Base"
          value={summary.totalCustomers || 0}
          subtitle="Registered customer profiles"
          icon={Users}
          color="amber"
        />
      </div>

      {/* 2-Column Grid: Category Breakdown & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sales by Category */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-admin-400" />
              <span>Sales by Category / Department</span>
            </h2>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const percent = Math.round((cat.revenue / maxCatRevenue) * 100);
              return (
                <div key={cat.categoryId} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-white">{cat.categoryName}</span>
                    <span className="text-emerald-400 font-mono">
                      ₹{cat.revenue.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-500 font-normal">({cat.unitsSold} units)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-admin-600 to-indigo-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-400" />
              <span>Orders by Status</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {ordersByStatus.map((st) => (
              <div
                key={st.status}
                className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs"
              >
                <span className="font-bold text-slate-200 uppercase tracking-wider">
                  {st.status}
                </span>
                <span className="font-mono font-bold text-white px-2.5 py-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  {st.count} order(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 30-Day Revenue Trend Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Daily Revenue Trends</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Orders Count</th>
                <th className="p-3.5">Settled Paid Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {revenueTrends.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-500">
                    No order transactions recorded in this period.
                  </td>
                </tr>
              ) : (
                revenueTrends.map((trend) => (
                  <tr key={trend.date} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-200">{trend.date}</td>
                    <td className="p-3.5 text-slate-300">{trend.ordersCount} order(s)</td>
                    <td className="p-3.5 font-mono font-black text-emerald-400">
                      ₹{trend.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
