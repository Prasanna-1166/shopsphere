import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  RotateCcw,
  X,
  Loader2,
} from 'lucide-react';

export default function PaymentSimulatorModal({
  isOpen,
  onClose,
  order,
  paymentIntent,
  paymentMethod,
  onExecuteScenario,
  loading,
}) {
  const [selectedScenario, setSelectedScenario] = useState('SUCCESS');
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !order) return null;

  const totalAmount = order.totalAmount || order.amount || 0;
  const orderId = order.id || order.orderId || '';

  const handleRun = async (scenario) => {
    setErrorMessage(null);
    try {
      await onExecuteScenario(scenario);
    } catch (err) {
      setErrorMessage(err.message || 'Simulated payment failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    ShopSphere Payment Simulator
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase rounded-md border border-purple-400/30">
                    Test Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Local offline sandbox — No real money or card is charged
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close simulator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Order Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Authoritative Order Total
              </span>
              <div className="text-2xl font-black text-slate-900">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Order ID: #{orderId.slice(-8).toUpperCase()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Simulated Method
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                <span>{paymentMethod || 'Simulated Card'}</span>
              </span>
            </div>
          </div>

          {/* Error Banner if scenario failed */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Simulated Transaction Declined</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Scenario Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Choose Test Scenario:
            </label>

            {/* Scenario 1: Approve / Success */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRun('SUCCESS')}
              className="w-full text-left p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-300 transition flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    1. Simulate Payment Success (Approve)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Approves transaction, marks order PAID & CONFIRMED, deducts stock once.
                  </p>
                </div>
              </div>
              {loading && selectedScenario === 'SUCCESS' ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>

            {/* Scenario 2: Card Decline / Failure */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRun('FAILURE')}
              className="w-full text-left p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 hover:border-rose-300 transition flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    2. Simulate Bank / Card Decline (Fail)
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Simulates bank decline, leaves stock untouched, allows retry.
                  </p>
                </div>
              </div>
              {loading && selectedScenario === 'FAILURE' ? (
                <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>

            {/* Scenario 3: Customer Cancellation */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRun('CANCEL')}
              className="w-full text-left p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-300 transition flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    3. Simulate Customer Cancellation
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Simulates user closing payment dialog, keeps order in retryable state.
                  </p>
                </div>
              </div>
              {loading && selectedScenario === 'CANCEL' ? (
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* Security & Disclaimer Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Server-Calculated Safe Transaction</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              Cancel & Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
