/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndexSymbol, IndexConfig, PaperTradePosition } from '../types/options';
import { X, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: IndexSymbol;
  config: IndexConfig;
  strike: number;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  price: number;
  theme: 'tablet' | 'dark';
  onExecuteTrade: (position: PaperTradePosition) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  symbol,
  config,
  strike,
  optionType,
  action,
  price,
  theme,
  onExecuteTrade,
}) => {
  const [lots, setLots] = useState<number>(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(price);
  const [targetPts, setTargetPts] = useState<number>(20);
  const [slPts, setSlPts] = useState<number>(10);

  if (!isOpen) return null;

  const lotSize = config.lotSize;
  const quantity = lots * lotSize;
  const execPrice = orderType === 'MARKET' ? price : limitPrice;
  const totalValue = execPrice * quantity;
  const requiredMargin = action === 'BUY' ? totalValue : totalValue * 4.5; // Indian margin for option selling is roughly 4.5x option premium

  const handleExecute = () => {
    const newPosition: PaperTradePosition = {
      id: `pos-${Date.now()}`,
      symbol,
      strike,
      type: optionType,
      action,
      quantity,
      entryPrice: execPrice,
      currentPrice: price,
      pnl: 0,
      timestamp: new Date().toLocaleTimeString(),
    };
    onExecuteTrade(newPosition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs safe-pb">
      <div className={`w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border p-4 sm:p-5 shadow-2xl transition-all ${
        theme === 'tablet'
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        {/* Mobile drag handle bar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
              action === 'BUY' ? 'bg-blue-600' : 'bg-rose-600'
            }`}>
              {action}
            </span>
            <span className="font-bold text-sm font-mono">
              {symbol} {strike} {optionType}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 text-xs">
          {/* Price & LTP summary */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="text-[11px] text-slate-400">Market LTP</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                ₹{price.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Lot Size</div>
              <div className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {lotSize} Qty
              </div>
            </div>
          </div>

          {/* Lots Input with Touch Steppers */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Order Quantity (Lots)
              </label>
              <span className="text-slate-400 font-mono text-[11px]">Total: {quantity} Contracts</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Stepper minus */}
              <button
                type="button"
                onClick={() => setLots(Math.max(1, lots - 1))}
                className={`w-9 h-8 flex items-center justify-center rounded-lg border font-bold text-sm select-none active:scale-95 ${
                  theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'
                }`}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={lots}
                onChange={(e) => setLots(Math.max(1, Number(e.target.value)))}
                className={`w-16 h-8 text-center rounded-lg border font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'tablet' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                }`}
              />
              {/* Stepper plus */}
              <button
                type="button"
                onClick={() => setLots(lots + 1)}
                className={`w-9 h-8 flex items-center justify-center rounded-lg border font-bold text-sm select-none active:scale-95 ${
                  theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'
                }`}
              >
                +
              </button>
              <div className="flex gap-1 ml-auto">
                {[1, 2, 5, 10].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLots(l)}
                    className={`px-2 py-1 rounded border text-xs font-semibold ${
                      lots === l
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : theme === 'tablet'
                          ? 'border-slate-300 hover:bg-slate-100'
                          : 'border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {l}L
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Order Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('MARKET')}
                className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                  orderType === 'MARKET'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : theme === 'tablet'
                      ? 'border-slate-300 text-slate-700'
                      : 'border-slate-700 text-slate-300'
                }`}
              >
                Market Order
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                  orderType === 'LIMIT'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : theme === 'tablet'
                      ? 'border-slate-300 text-slate-700'
                      : 'border-slate-700 text-slate-300'
                }`}
              >
                Limit Order
              </button>
            </div>
            {orderType === 'LIMIT' && (
              <div className="mt-2">
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className={`w-full px-3 py-1.5 rounded-lg border font-mono font-bold ${
                    theme === 'tablet' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Target & Stop Loss Optional Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-medium text-slate-500 block mb-1">Target (+Pts)</label>
              <input
                type="number"
                value={targetPts}
                onChange={(e) => setTargetPts(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                  theme === 'tablet' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                }`}
              />
              <span className="text-[10px] text-slate-400">Target: ₹{(execPrice + targetPts).toFixed(2)}</span>
            </div>
            <div>
              <label className="font-medium text-slate-500 block mb-1">Stop Loss (-Pts)</label>
              <input
                type="number"
                value={slPts}
                onChange={(e) => setSlPts(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                  theme === 'tablet' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                }`}
              />
              <span className="text-[10px] text-slate-400">SL: ₹{Math.max(0.05, execPrice - slPts).toFixed(2)}</span>
            </div>
          </div>

          {/* Summary / Margin Box */}
          <div className={`p-3 rounded-lg border flex items-center justify-between font-mono ${
            theme === 'tablet' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="text-[11px] text-slate-400 font-sans">
                {action === 'BUY' ? 'Premium Required' : 'Estimated Margin'}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ₹{requiredMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-sans">Execution</div>
              <div className="text-xs font-semibold text-emerald-500">
                Instant Paper Fill
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg border font-semibold text-xs transition-colors ${
              theme === 'tablet' ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className={`flex-1 py-2 rounded-lg font-bold text-xs text-white shadow-md transition-colors ${
              action === 'BUY' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Submit Paper Order
          </button>
        </div>
      </div>
    </div>
  );
};
