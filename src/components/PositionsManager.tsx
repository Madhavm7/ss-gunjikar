/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PaperTradePosition, StrikeRow } from '../types/options';
import { formatIndianNumber } from '../utils/optionsData';
import { Briefcase, CheckCircle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface PositionsManagerProps {
  positions: PaperTradePosition[];
  setPositions: React.Dispatch<React.SetStateAction<PaperTradePosition[]>>;
  rows: StrikeRow[];
  theme: 'tablet' | 'dark';
}

export const PositionsManager: React.FC<PositionsManagerProps> = ({
  positions,
  setPositions,
  rows,
  theme,
}) => {
  // Update live prices and PnL for active positions
  const enrichedPositions = positions.map((pos) => {
    const row = rows.find((r) => r.strikePrice === pos.strike);
    let liveLTP = pos.currentPrice;
    if (row) {
      liveLTP = pos.type === 'CE' ? row.call.ltp : row.put.ltp;
    }
    const mult = pos.action === 'BUY' ? 1 : -1;
    const pnl = (liveLTP - pos.entryPrice) * pos.quantity * mult;

    return {
      ...pos,
      currentPrice: liveLTP,
      pnl: Number(pnl.toFixed(2)),
    };
  });

  const totalUnrealizedPnL = enrichedPositions.reduce((acc, p) => acc + p.pnl, 0);

  const squareOff = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  const squareOffAll = () => {
    setPositions([]);
  };

  return (
    <div className={`p-4 md:p-6 rounded-xl border transition-colors ${
      theme === 'tablet'
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold">
              Active Paper Trading Positions & Live P&L
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test options trading strategies and evaluate real-time tick-by-tick performance without capital risk
          </p>
        </div>

        {positions.length > 0 && (
          <button
            onClick={squareOffAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Square-off All Positions
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-medium">Net Unrealized P&L</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${
            totalUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}₹{totalUnrealizedPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {positions.length} open position{positions.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-medium">Total Capital Deployed</div>
          <div className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-slate-100">
            ₹{enrichedPositions.reduce((acc, p) => acc + p.entryPrice * p.quantity, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Simulated Indian Options Margin
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-medium">Winning Trades Ratio</div>
          <div className="text-2xl font-bold font-mono mt-1 text-indigo-600 dark:text-indigo-400">
            {positions.length > 0
              ? `${((enrichedPositions.filter((p) => p.pnl > 0).length / positions.length) * 100).toFixed(0)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {enrichedPositions.filter((p) => p.pnl > 0).length} profitable of {positions.length}
          </div>
        </div>
      </div>

      {/* Positions Table (Desktop) & Cards (Mobile) */}
      {enrichedPositions.length === 0 ? (
        <div className={`p-10 text-center rounded-lg border border-dashed ${
          theme === 'tablet' ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-950/40'
        }`}>
          <CheckCircle className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Active Paper Positions
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click the 'B' (Buy) or 'S' (Sell) buttons in the Option Chain table to simulate trades with real market ticks.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Position Cards */}
          <div className="md:hidden space-y-2.5">
            {enrichedPositions.map((pos) => {
              const isProfit = pos.pnl >= 0;
              return (
                <div
                  key={pos.id}
                  className={`p-3 rounded-xl border transition-all ${
                    theme === 'tablet'
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        pos.action === 'BUY' ? 'bg-blue-600' : 'bg-rose-600'
                      }`}>
                        {pos.action}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {pos.symbol} {pos.strike} {pos.type}
                      </span>
                    </div>

                    <button
                      onClick={() => squareOff(pos.id)}
                      className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 border border-rose-500/30 text-[11px] font-semibold transition-colors"
                    >
                      Exit
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans">Qty</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{pos.quantity}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans">Avg Entry</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">₹{pos.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans">Live LTP</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">₹{pos.currentPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800/40 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 font-sans">{pos.timestamp}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-400 font-sans">P&L:</span>
                      <span className={`font-bold text-sm ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfit ? '+' : ''}₹{pos.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Positions Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b text-[11px] font-semibold text-slate-500 ${
                  theme === 'tablet' ? 'bg-slate-100' : 'bg-slate-950'
                }`}>
                  <th className="py-2.5 px-3 text-left">Instrument & Strike</th>
                  <th className="py-2.5 px-3 text-left">Side</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Entry Price</th>
                  <th className="py-2.5 px-3 text-right">Live LTP</th>
                  <th className="py-2.5 px-3 text-right">P&L (₹)</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px] tabular-nums">
                {enrichedPositions.map((pos) => {
                  const isProfit = pos.pnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {pos.symbol} {pos.strike} {pos.type}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          pos.action === 'BUY' ? 'bg-blue-600' : 'bg-rose-600'
                        }`}>
                          {pos.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {pos.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        ₹{pos.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{pos.currentPrice.toFixed(2)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        isProfit ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isProfit ? '+' : ''}₹{pos.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                        {pos.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => squareOff(pos.id)}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-600 hover:text-white transition-colors text-[10px] font-semibold"
                        >
                          Exit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
