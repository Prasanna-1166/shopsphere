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
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
        showToast(err.message || 'Failed to load delivery addresses', 'error');
      } finally {
        setInitialLoading(false);
      }
    }
    loadCheckoutData();
  }, [isAuthenticated, navigate, showToast]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
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

    try {
      setLoading(true);

      let targetAddressId = selectedAddressId;
      if (showNewAddressForm) {
        const addrRes = await api.post('/addresses', newAddress);
        if (addrRes.data?.address) {
          targetAddressId = addrRes.data.address.id;
        }
      }

      const orderPayload = {
        addressId: targetAddressId,
        paymentMethod: paymentMethod === 'COD' ? 'CASH_ON_DELIVERY' : paymentMethod,
      };

      const res = await api.post('/orders', orderPayload);
      if (res.data && res.data.order) {
        const createdOrder = res.data.order;
        await refreshCart();
        showToast('Order placed successfully!', 'success');
        navigate(`/orders/success/${createdOrder.id}`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
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
        <p className="text-xs text-slate-500 font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  const freeDeliveryThreshold = 499;
  const deliveryFee = summary.subtotal >= freeDeliveryThreshold ? 0 : 49;
  const finalTotal = summary.subtotal + deliveryFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            256-bit SSL encrypted & authenticated session
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>ShopSphere Buyer Protection</span>
        </div>
      </div>

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
                        className="mt-1 w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                      />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-slate-600 font-medium">
                          {addr.city}, {addr.state} — <strong>{addr.postalCode}</strong>
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
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900">Payment Option</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* UPI Option */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'UPI' ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200 hover:border-slate-300'
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
                    <span>UPI / QR / Apps</span>
                  </p>
                  <p className="text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setPaymentMethod('MOCK_CARD')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'MOCK_CARD' ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === 'MOCK_CARD'}
                  onChange={() => setPaymentMethod('MOCK_CARD')}
                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <span>Credit / Debit Card</span>
                  </p>
                  <p className="text-slate-500">Visa, MasterCard, RuPay</p>
                </div>
              </div>

              {/* NetBanking */}
              <div
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'NET_BANKING' ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200 hover:border-slate-300'
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
                  <p className="text-slate-500">HDFC, ICICI, SBI, Axis & all banks</p>
                </div>
              </div>

              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'COD' ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200 hover:border-slate-300'
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
                  <p className="text-slate-500">Pay via cash or UPI at delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Items in Order ({summary.totalQuantity})
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => {
                const prod = item.product;
                const price = prod.discountPrice || prod.price;
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {item.quantity}x
                      </span>
                      <span className="text-slate-800 truncate font-medium">{prod.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
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
                  ₹{summary.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST</span>
                <span className="text-slate-400">Included</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span>Total Amount</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order (₹{finalTotal.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center">
            By placing your order, you agree to ShopSphere's Terms of Sale and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
