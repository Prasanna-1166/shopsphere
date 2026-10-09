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
  QrCode,
  Banknote,
  Building2,
  Loader2,
  FlaskConical,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PaymentSimulatorModal from '../components/common/PaymentSimulatorModal';

// Helper to load Razorpay Standard Checkout script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, summary, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState(null);

  // Simulator Modal State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [pendingSimOrder, setPendingSimOrder] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [lastPaymentError, setLastPaymentError] = useState(null);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: '+91 98765 43210',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
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

        // Fetch addresses & payment config in parallel
        const [addrRes, cfgRes] = await Promise.allSettled([
          api.get('/addresses'),
          api.get('/payments/config'),
        ]);

        if (addrRes.status === 'fulfilled' && addrRes.value?.data?.addresses) {
          const list = addrRes.value.data.addresses;
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setShowNewAddressForm(true);
          }
        }

        if (cfgRes.status === 'fulfilled' && cfgRes.value?.data) {
          const cfg = cfgRes.value.data;
          setPaymentConfig(cfg);
          if (!cfg.isSimulated && cfg.provider === 'RAZORPAY') {
            loadRazorpayScript();
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to load delivery addresses', 'error');
      } finally {
        setInitialLoading(false);
      }
    }
    loadCheckoutData();
  }, [isAuthenticated, navigate, showToast]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (
      !newAddress.fullName ||
      !newAddress.phone ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.postalCode
    ) {
      showToast('Please fill all required address fields.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/addresses', newAddress);
      if (res.data && res.data.address) {
        const created = res.data.address;
        setAddresses((prev) => [created, ...prev]);
        setSelectedAddressId(created.id);
        setShowNewAddressForm(false);
        showToast('Delivery address saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast('Your shopping cart is empty.', 'error');
      navigate('/products');
      return;
    }

    if (!selectedAddressId && !showNewAddressForm) {
      showToast('Please select or add a delivery address.', 'error');
      return;
    }

    setLastPaymentError(null);

    try {
      setLoading(true);

      let targetAddressId = selectedAddressId;
      if (showNewAddressForm) {
        const addrRes = await api.post('/addresses', newAddress);
        if (addrRes.data?.address) {
          targetAddressId = addrRes.data.address.id;
        }
      }

      const activeAddress = addresses.find((a) => a.id === targetAddressId) || newAddress;

      const orderPayload = {
        addressId: targetAddressId,
        paymentMethod: paymentMethod === 'COD' ? 'CASH_ON_DELIVERY' : paymentMethod,
      };

      // 1. Create Server Order & Payment Intent
      const res = await api.post('/orders', orderPayload);
      if (!res.data || !res.data.order) {
        throw new Error('Failed to create order.');
      }

      const createdOrder = res.data.order;
      const paymentIntent = res.data.paymentIntent;
      const paymentRequired = res.data.paymentRequired;

      // 2. If Cash On Delivery: Order is confirmed directly
      if (!paymentRequired || paymentMethod === 'COD') {
        await refreshCart();
        showToast('Order placed successfully with Cash on Delivery!', 'success');
        navigate(`/orders/success/${createdOrder.id}`);
        return;
      }

      // 3. If in Local Simulation Mode: Open interactive PaymentSimulatorModal
      if (paymentConfig?.isSimulated || paymentIntent?.provider === 'SIMULATOR' || paymentIntent?.provider === 'MOCK') {
        setPendingSimOrder({
          order: createdOrder,
          intent: paymentIntent,
          paymentMethod,
        });
        setSimulatorOpen(true);
        setLoading(false);
        return;
      }

      // 4. If Real Razorpay Standard Gateway
      if (paymentIntent && paymentIntent.provider === 'RAZORPAY') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          showToast('Failed to load Razorpay payment gateway script. Please check your network.', 'error');
          setLoading(false);
          return;
        }

        const options = {
          key: paymentIntent.keyId,
          amount: paymentIntent.amountPaise || Math.round(createdOrder.totalAmount * 100),
          currency: paymentIntent.currency || 'INR',
          name: 'ShopSphere',
          description: `Order #${createdOrder.id.slice(0, 8)}`,
          order_id: paymentIntent.razorpayOrderId || paymentIntent.providerReference,
          prefill: {
            name: user?.name || activeAddress?.fullName || '',
            email: user?.email || '',
            contact: activeAddress?.phone || '',
          },
          theme: {
            color: '#0f172a',
          },
          handler: async function (response) {
            try {
              setVerifying(true);
              const verifyRes = await api.post('/payments/verify', {
                orderId: createdOrder.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              await refreshCart();
              showToast('Payment verified successfully! Thank you for shopping with ShopSphere.', 'success');
              navigate(`/orders/success/${createdOrder.id}`);
            } catch (vErr) {
              setLastPaymentError(vErr.message || 'Payment verification failed at server.');
              showToast(vErr.message || 'Payment verification failed.', 'error');
            } finally {
              setVerifying(false);
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setLastPaymentError('Checkout window was dismissed. You can complete payment whenever ready.');
              showToast('Checkout window closed. You can retry payment anytime.', 'info');
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (resp) {
          setLastPaymentError(resp.error?.description || 'Payment declined by card issuing bank.');
          showToast(resp.error?.description || 'Payment failed at gateway.', 'error');
          setLoading(false);
        });

        razorpayInstance.open();
        return;
      }

      // Fallback
      await refreshCart();
      navigate(`/orders/success/${createdOrder.id}`);
    } catch (err) {
      setLastPaymentError(err.message || 'Failed to place order.');
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSimulationScenario = async (scenario) => {
    if (!pendingSimOrder) return;
    try {
      setSimLoading(true);
      const res = await api.post('/payments/verify', {
        orderId: pendingSimOrder.order.id,
        scenario,
        paymentMethod: pendingSimOrder.paymentMethod || paymentMethod,
        providerReference: pendingSimOrder.intent?.providerReference,
      });

      if (scenario === 'SUCCESS') {
        setSimulatorOpen(false);
        await refreshCart();
        showToast('Simulated payment approved successfully!', 'success');
        navigate(`/orders/success/${pendingSimOrder.order.id}`);
      } else if (scenario === 'CANCEL') {
        setSimulatorOpen(false);
        setLastPaymentError('Simulated checkout was cancelled. You can retry payment whenever ready.');
        showToast('Payment simulation cancelled by customer.', 'info');
      }
    } catch (err) {
      if (scenario === 'FAILURE') {
        setLastPaymentError(err.message || 'Simulated card decline (Insufficient funds / Bank rejection).');
        showToast('Simulated payment declined as requested.', 'error');
        throw err;
      } else {
        showToast(err.message || 'Verification error.', 'error');
        throw err;
      }
    } finally {
      setSimLoading(false);
    }
  };

  const quickFillAddress = () => {
    setNewAddress({
      fullName: user?.name || 'Aarav Sharma',
      phone: '+91 98201 45678',
      addressLine1: 'Flat 402, Sunshine Heights, Outer Ring Road',
      addressLine2: 'Bellandur Landmark Near EcoSpace',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      isDefault: true,
    });
  };

  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Preparing secure checkout session...</p>
      </div>
    );
  }

  const totalQty = summary?.totalQuantity ?? items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const subtotal = summary?.subtotal ?? items.reduce((acc, it) => {
    const p = it.product?.discountPrice ?? it.product?.price ?? 0;
    return acc + p * (it.quantity || 1);
  }, 0);
  const freeDeliveryThreshold = 1500;
  const deliveryFee = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : 99;
  const finalTotal = subtotal + deliveryFee;
  const isSim = paymentConfig?.isSimulated || paymentConfig?.provider === 'SIMULATOR';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isSim
              ? 'Local Payment Simulator Active — Test offline sandbox checkout flows'
              : '256-bit SSL encrypted & Razorpay PCI-DSS Level 1 compliant gateway'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>ShopSphere Buyer Protection</span>
        </div>
      </div>

      {/* Simulator Active Sandbox Notice */}
      {isSim && (
        <div className="p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                  Local Payment Simulator Active
                </h4>
                <span className="px-2 py-0.5 bg-purple-200/70 text-purple-800 text-[10px] font-bold rounded-md">
                  Sandbox
                </span>
              </div>
              <p className="text-xs text-purple-800 mt-0.5">
                No external merchant credentials required. When you click proceed, an interactive dialog allows testing <strong>Success</strong>, <strong>Failure</strong>, and <strong>Cancellation</strong> scenarios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Payment Error / Retry Banner */}
      {lastPaymentError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Payment Attempt Did Not Complete</p>
              <p className="mt-0.5 text-rose-700">{lastPaymentError}</p>
            </div>
          </div>
          {pendingSimOrder && (
            <button
              onClick={() => setSimulatorOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Payment Simulator</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Select Delivery Address</h3>
              </div>
              {!showNewAddressForm && addresses.length > 0 && (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Existing Addresses Radio Group */}
            {!showNewAddressForm && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_select"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5 w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                      />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-slate-600 font-medium">
                          {addr.city}, {addr.state} — {addr.postalCode}
                        </p>
                        <p className="text-slate-500 pt-0.5">Phone: {addr.phone}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* New Address Form */
              <form onSubmit={handleCreateAddress} className="space-y-4 pt-1">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Testing quick delivery?</span>
                  <button
                    type="button"
                    onClick={quickFillAddress}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700"
                  >
                    1-Click Auto-Fill Demo Address
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      placeholder="Receiver's name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (for delivery updates) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flat / House No. / Building / Street *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    placeholder="e.g. Flat 402, Sunshine Heights, Outer Ring Road"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Bengaluru"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="Karnataka"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      6-Digit PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="560103"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Save & Deliver Here
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                {isSim ? (
                  <>
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                    <span>Local Simulator Active</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Razorpay Standard Gateway</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* UPI / QR Option */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'UPI'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-slate-700" />
                    <span>Instant UPI / QR / Apps</span>
                  </p>
                  <p className="text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'CARD'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <span>Credit / Debit Card</span>
                  </p>
                  <p className="text-slate-500">Visa, MasterCard, RuPay, Diners</p>
                </div>
              </div>

              {/* NetBanking */}
              <div
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'NET_BANKING'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === 'NET_BANKING'}
                  onChange={() => setPaymentMethod('NET_BANKING')}
                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>Net Banking</span>
                  </p>
                  <p className="text-slate-500">HDFC, ICICI, SBI, Axis & 50+ Banks</p>
                </div>
              </div>

              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'COD'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-slate-700" />
                    <span>Cash on Delivery</span>
                  </p>
                  <p className="text-slate-500">Pay via cash or UPI at delivery doorstep</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary ({totalQty} items)
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => {
                const prod = item.product || {};
                const price = Number(prod.discountPrice ?? prod.price ?? item.unitPrice ?? 0);
                const qty = Number(item.quantity || 1);
                const name = prod.name || item.productName || 'Product';
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {qty}x
                      </span>
                      <span className="text-slate-800 truncate font-medium">{name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{(price * qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Applicable Taxes & GST</span>
                <span className="text-slate-400">Included in prices</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span>Final Payable Amount</span>
                <span className="text-slate-950">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Place Order / Pay CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || verifying || items.length === 0}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading || verifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{verifying ? 'Verifying Payment...' : 'Connecting Gateway...'}</span>
                </span>
              ) : (
                <>
                  {isSim && paymentMethod !== 'COD' ? (
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>
                    {paymentMethod === 'COD'
                      ? `Place COD Order (₹${finalTotal.toLocaleString('en-IN')})`
                      : isSim
                      ? `Simulate Payment (₹${finalTotal.toLocaleString('en-IN')})`
                      : `Pay ₹${finalTotal.toLocaleString('en-IN')} via Razorpay`}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center space-y-1">
            <p>
              {isSim
                ? '🧪 Local Payment Simulator: No real money is transferred.'
                : '🔒 100% Secure Payment processed by Razorpay.'}
            </p>
            <p className="text-[10px] text-slate-400">
              ShopSphere never stores your raw card numbers, CVVs, or UPI PINs.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        order={pendingSimOrder?.order}
        paymentIntent={pendingSimOrder?.intent}
        paymentMethod={pendingSimOrder?.paymentMethod || paymentMethod}
        onExecuteScenario={handleExecuteSimulationScenario}
        loading={simLoading}
      />
    </div>
  );
}
