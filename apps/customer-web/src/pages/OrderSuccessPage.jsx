import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Home, Truck, ShieldCheck } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
      {/* Success Badge */}
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Order Confirmed
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          We've received your order and our fulfillment team is packaging your shipment.
        </p>
      </div>

      {/* Order Summary Card */}
      {order && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Order Number</span>
              <div className="font-mono text-sm font-bold text-slate-900">#{order.id}</div>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Total Amount</span>
              <div className="text-base font-extrabold text-slate-900">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ordered Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-1.5 divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                  <span className="text-slate-800 font-medium">
                    {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="text-slate-900 font-bold">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-0.5">
              <span className="font-bold text-slate-800 block text-xs">Shipping Address:</span>
              <p className="font-medium text-slate-900">{order.shippingAddress.fullName}</p>
              <p>
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              </p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to={`/orders/${id}`}
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Package className="w-4 h-4" />
          <span>Track Order Progress</span>
        </Link>
        <Link
          to="/products"
          className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
