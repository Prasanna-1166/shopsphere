import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import api from '../api/client';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.data && res.data.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error('Error fetching placed order:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Celebration Icon */}
      <div className="relative inline-block">
        <div className="w-20 h-20 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto border border-brand-500/30 shadow-glow animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-brand-400" />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
          Payment Confirmed & Verified
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          We've received your order and our warehouse is preparing your shipment.
        </p>
      </div>

      {/* Order Summary Card */}
      {order && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-left space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Order Reference</span>
              <div className="font-mono text-base font-bold text-white">#{order.id}</div>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400">Total Paid</span>
              <div className="text-lg font-black text-brand-400">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Purchased Items
            </h3>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="text-white font-medium">
                    {item.productName} <span className="text-slate-500">× {item.quantity}</span>
                  </span>
                  <span className="text-slate-300 font-bold">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Delivering to:</span>
              <p className="text-white font-medium">{order.shippingAddress.fullName}</p>
              <p>
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to={`/orders/${id}`}
          className="w-full sm:w-auto px-6 py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm rounded-xl transition shadow-glow flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          to="/products"
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
