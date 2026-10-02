import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  Plus,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, summary, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MOCK_CARD');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    async function loadCheckoutData() {
      try {
        setInitialLoading(true);
        const addrRes = await api.get('/addresses');
        if (addrRes.data && addrRes.data.addresses) {
          const list = addrRes.data.addresses;
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setShowNewAddressForm(true);
          }
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadCheckoutData();
  }, [isAuthenticated, navigate]);

  const handleCreateNewAddress = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/addresses', newAddress);
      if (res.data && res.data.address) {
        setAddresses((prev) => [res.data.address, ...prev]);
        setSelectedAddressId(res.data.address.id);
        setShowNewAddressForm(false);
        showToast('Delivery address saved.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Could not save address.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !showNewAddressForm) {
      showToast('Please select or enter a delivery address.', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('Your shopping bag is empty.', 'error');
      navigate('/cart');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        paymentMethod,
      };

      if (selectedAddressId) {
        payload.addressId = selectedAddressId;
      } else {
        payload.shippingAddress = newAddress;
      }

      const res = await api.post('/orders/checkout', payload);
      if (res.data && res.data.order) {
        await refreshCart();
        showToast('Order placed successfully!', 'success');
        navigate(`/order-success/${res.data.order.id}`);
      }
    } catch (err) {
      showToast(err.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading checkout details...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Your bag is empty</h2>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-brand-500 text-slate-950 font-bold rounded-xl">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-brand-400" />
            <span>256-bit SSL Encrypted Transaction</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Shipping Address Selection */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-white">Delivery Address</h2>
              </div>

              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm && (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                        isSelected
                          ? 'bg-slate-850 border-brand-500 ring-2 ring-brand-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-brand-500/20 text-brand-400 text-[10px] font-bold rounded">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">
                          {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">
                          {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-1">Phone: {addr.phone}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline New Address Form */}
            {showNewAddressForm && (
              <form onSubmit={handleCreateNewAddress} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 9876543210"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Street Name"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Landmark, Area"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl ml-auto"
                  >
                    Save & Use Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 2. Payment Method (Mock Payment Provider) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Payment Method</h2>
                <span className="text-[11px] text-amber-400 font-semibold block">
                  (Safe Mock Payment Gateway Mode — No Real Card Required)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Mock Card */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'MOCK_CARD'
                    ? 'bg-slate-850 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOCK_CARD"
                    checked={paymentMethod === 'MOCK_CARD'}
                    onChange={() => setPaymentMethod('MOCK_CARD')}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Credit / Debit Card (Simulated)</div>
                    <div className="text-xs text-slate-400">Instant test authorization (Visa/Mastercard)</div>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-slate-400" />
              </label>

              {/* Option 2: Mock UPI */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'MOCK_UPI'
                    ? 'bg-slate-850 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOCK_UPI"
                    checked={paymentMethod === 'MOCK_UPI'}
                    onChange={() => setPaymentMethod('MOCK_UPI')}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">UPI / Instant QR</div>
                    <div className="text-xs text-slate-400">GPay, PhonePe, Paytm simulated transfer</div>
                  </div>
                </div>
                <span className="text-xs font-black text-brand-400">UPI</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Place Order Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 sticky top-28 shadow-2xl">
            <h2 className="text-lg font-black text-white">Review Bag ({items.length} items)</h2>

            {/* Quick list preview */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center text-xs">
                  <img
                    src={item.product.images?.[0]?.url || ''}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-slate-950 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-slate-400">
                      Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    ₹{item.itemSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">₹{summary.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery</span>
                <span className="text-brand-400 font-medium">
                  {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}
                </span>
              </div>
              {summary.totalSavings > 0 && (
                <div className="flex justify-between text-brand-400 text-xs font-semibold">
                  <span>Savings</span>
                  <span>-₹{summary.totalSavings?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Grand Total</span>
                <span className="text-2xl font-black text-brand-400">
                  ₹{summary.finalTotal?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || (!selectedAddressId && !showNewAddressForm)}
              className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processing Transaction...</span>
              ) : (
                <>
                  <span>Pay & Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
