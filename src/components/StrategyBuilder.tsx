/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StrategyLeg, IndexSymbol, IndexConfig, StrikeRow } from '../types/options';
import { calculateBlackScholes } from '../utils/blackScholes';
import { formatIndianNumber } from '../utils/optionsData';
import { Trash2, Plus, Zap, Shield, HelpCircle } from 'lucide-react';

interface StrategyBuilderProps {
  symbol: IndexSymbol;
  config: IndexConfig;
  spotPrice: number;
  rows: StrikeRow[];
  expiry: string;
  theme: 'tablet' | 'dark';
  legs: StrategyLeg[];
  setLegs: React.Dispatch<React.SetStateAction<StrategyLeg[]>>;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  symbol,
  config,
  spotPrice,
  rows,
  expiry,
  theme,
  legs,
  setLegs,
}) => {
  const atmRow = rows.find((r) => r.isATM) || rows[Math.floor(rows.length / 2)];
  const atmStrike = atmRow ? atmRow.strikePrice : 25200;
  const step = config.strikeStep;

  // Apply Pre-Built Strategy Template
  const loadTemplate = (strategyName: string) => {
    const lotSize = config.lotSize;
    let newLegs: StrategyLeg[] = [];

    const findPrice = (strike: number, type: 'CE' | 'PE'): number => {
      const r = rows.find((row) => row.strikePrice === strike);
      if (!r) return 100;
      return type === 'CE' ? r.call.ltp : r.put.ltp;
    };

    const findGreeks = (strike: number, type: 'CE' | 'PE') => {
      const r = rows.find((row) => row.strikePrice === strike);
      if (!r) return { delta: 0.5, gamma: 0.001, theta: -10, vega: 15, rho: 0.5 };
      return type === 'CE' ? r.call.greeks : r.put.greeks;
    };

    switch (strategyName) {
      case 'Short Straddle': // Sell ATM CE + Sell ATM PE (Popular Indian Expiry strategy)
        newLegs = [
          {
            id: 'leg-1',
            symbol,
            expiry,
            strike: atmStrike,
            type: 'CE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike, 'CE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike, 'CE'),
          },
          {
            id: 'leg-2',
            symbol,
            expiry,
            strike: atmStrike,
            type: 'PE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike, 'PE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike, 'PE'),
          },
        ];
        break;

      case 'Bull Call Spread': // Buy ATM CE + Sell OTM CE
        newLegs = [
          {
            id: 'leg-1',
            symbol,
            expiry,
            strike: atmStrike,
            type: 'CE',
            action: 'BUY',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike, 'CE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike, 'CE'),
          },
          {
            id: 'leg-2',
            symbol,
            expiry,
            strike: atmStrike + step * 2,
            type: 'CE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike + step * 2, 'CE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike + step * 2, 'CE'),
          },
        ];
        break;

      case 'Bear Put Spread': // Buy ATM PE + Sell OTM PE
        newLegs = [
          {
            id: 'leg-1',
            symbol,
            expiry,
            strike: atmStrike,
            type: 'PE',
            action: 'BUY',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike, 'PE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike, 'PE'),
          },
          {
            id: 'leg-2',
            symbol,
            expiry,
            strike: atmStrike - step * 2,
            type: 'PE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike - step * 2, 'PE'),
            iv: 13.5,
            greeks: findGreeks(atmStrike - step * 2, 'PE'),
          },
        ];
        break;

      case 'Iron Condor': // 4 legs
        newLegs = [
          {
            id: 'leg-1',
            symbol,
            expiry,
            strike: atmStrike - step * 4,
            type: 'PE',
            action: 'BUY',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike - step * 4, 'PE'),
            iv: 14.5,
            greeks: findGreeks(atmStrike - step * 4, 'PE'),
          },
          {
            id: 'leg-2',
            symbol,
            expiry,
            strike: atmStrike - step * 2,
            type: 'PE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike - step * 2, 'PE'),
            iv: 14.0,
            greeks: findGreeks(atmStrike - step * 2, 'PE'),
          },
          {
            id: 'leg-3',
            symbol,
            expiry,
            strike: atmStrike + step * 2,
            type: 'CE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike + step * 2, 'CE'),
            iv: 13.2,
            greeks: findGreeks(atmStrike + step * 2, 'CE'),
          },
          {
            id: 'leg-4',
            symbol,
            expiry,
            strike: atmStrike + step * 4,
            type: 'CE',
            action: 'BUY',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike + step * 4, 'CE'),
            iv: 13.8,
            greeks: findGreeks(atmStrike + step * 4, 'CE'),
          },
        ];
        break;

      case 'Short Strangle': // Sell OTM Put + Sell OTM Call
        newLegs = [
          {
            id: 'leg-1',
            symbol,
            expiry,
            strike: atmStrike - step * 3,
            type: 'PE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike - step * 3, 'PE'),
            iv: 14.2,
            greeks: findGreeks(atmStrike - step * 3, 'PE'),
          },
          {
            id: 'leg-2',
            symbol,
            expiry,
            strike: atmStrike + step * 3,
            type: 'CE',
            action: 'SELL',
            lots: 1,
            lotSize,
            price: findPrice(atmStrike + step * 3, 'CE'),
            iv: 13.3,
            greeks: findGreeks(atmStrike + step * 3, 'CE'),
          },
        ];
        break;
    }

    setLegs(newLegs);
  };

  // Add Leg
  const addDefaultLeg = () => {
    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}`,
      symbol,
      expiry,
      strike: atmStrike,
      type: 'CE',
      action: 'BUY',
      lots: 1,
      lotSize: config.lotSize,
      price: atmRow ? atmRow.call.ltp : 150,
      iv: 13.5,
      greeks: atmRow ? atmRow.call.greeks : { delta: 0.5, gamma: 0.001, theta: -10, vega: 15, rho: 0.5 },
    };
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter((l) => l.id !== id));
  };

  const toggleAction = (id: string) => {
    setLegs(
      legs.map((l) => (l.id === id ? { ...l, action: l.action === 'BUY' ? 'SELL' : 'BUY' } : l))
    );
  };

  const toggleType = (id: string) => {
    setLegs(
      legs.map((l) => {
        if (l.id !== id) return l;
        const newType = l.type === 'CE' ? 'PE' : 'CE';
        const r = rows.find((row) => row.strikePrice === l.strike);
        const newPrice = r ? (newType === 'CE' ? r.call.ltp : r.put.ltp) : l.price;
        return { ...l, type: newType, price: newPrice };
      })
    );
  };

  // Calculate Payoff Curve across Spot Price spectrum (±6% around spot)
  const { payoffPoints, minPayoff, maxPayoff, netPremium, netDelta, netTheta, netVega } = useMemo(() => {
    if (legs.length === 0) {
      return { payoffPoints: [], minPayoff: 0, maxPayoff: 0, netPremium: 0, netDelta: 0, netTheta: 0, netVega: 0 };
    }

    const rangePct = 0.05; // ±5%
    const minSpot = spotPrice * (1 - rangePct);
    const maxSpot = spotPrice * (1 + rangePct);
    const numPoints = 80;
    const stepSize = (maxSpot - minSpot) / (numPoints - 1);

    let netPrem = 0;
    let nDelta = 0;
    let nTheta = 0;
    let nVega = 0;

    legs.forEach((leg) => {
      const qty = leg.lots * leg.lotSize;
      const mult = leg.action === 'BUY' ? -1 : 1;
      netPrem += leg.price * qty * mult;

      const greekMult = leg.action === 'BUY' ? 1 : -1;
      nDelta += leg.greeks.delta * qty * greekMult;
      nTheta += leg.greeks.theta * qty * greekMult;
      nVega += leg.greeks.vega * qty * greekMult;
    });

    const points: { spot: number; pnl: number }[] = [];
    let minPnl = Infinity;
    let maxPnl = -Infinity;

    for (let i = 0; i < numPoints; i++) {
      const s = minSpot + i * stepSize;
      let totalPnl = 0;

      legs.forEach((leg) => {
        const qty = leg.lots * leg.lotSize;
        let intrinsic = 0;
        if (leg.type === 'CE') {
          intrinsic = Math.max(0, s - leg.strike);
        } else {
          intrinsic = Math.max(0, leg.strike - s);
        }

        if (leg.action === 'BUY') {
          totalPnl += (intrinsic - leg.price) * qty;
        } else {
          totalPnl += (leg.price - intrinsic) * qty;
        }
      });

      points.push({ spot: s, pnl: totalPnl });
      if (totalPnl < minPnl) minPnl = totalPnl;
      if (totalPnl > maxPnl) maxPnl = totalPnl;
    }

    return {
      payoffPoints: points,
      minPayoff: minPnl,
      maxPayoff: maxPnl,
      netPremium: netPrem,
      netDelta: Number(nDelta.toFixed(1)),
      netTheta: Number(nTheta.toFixed(1)),
      netVega: Number(nVega.toFixed(1)),
    };
  }, [legs, spotPrice]);

  // Compute Breakeven points
  const breakevens = useMemo(() => {
    const bes: number[] = [];
    for (let i = 0; i < payoffPoints.length - 1; i++) {
      const p1 = payoffPoints[i];
      const p2 = payoffPoints[i + 1];
      if ((p1.pnl <= 0 && p2.pnl >= 0) || (p1.pnl >= 0 && p2.pnl <= 0)) {
        const frac = Math.abs(p1.pnl) / (Math.abs(p1.pnl) + Math.abs(p2.pnl));
        bes.push(Math.round(p1.spot + frac * (p2.spot - p1.spot)));
      }
    }
    return bes;
  }, [payoffPoints]);

  return (
    <div className={`p-4 md:p-6 rounded-xl border transition-colors ${
      theme === 'tablet'
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
    }`}>
      {/* Strategy Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold">
              {symbol} Options Strategy Architect & Payoff Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model multi-leg Indian option spreads, analyze risk-to-reward ratio, and view expiry payoff diagram
          </p>
        </div>

        {/* 1-Click Templates */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-1">
          {['Short Straddle', 'Bull Call Spread', 'Bear Put Spread', 'Iron Condor', 'Short Strangle'].map((st) => (
            <button
              key={st}
              onClick={() => loadTemplate(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                theme === 'tablet'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Legs Table (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Strategy Position Legs ({legs.length})
            </h3>
            <button
              onClick={addDefaultLeg}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Leg
            </button>
          </div>

          {legs.length === 0 ? (
            <div className={`p-8 text-center rounded-lg border border-dashed ${
              theme === 'tablet' ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-950/40'
            }`}>
              <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No active strategy legs
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Pick a template above or click "B" / "S" next to any strike on the Option Chain to populate your strategy.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-semibold text-slate-500 ${
                    theme === 'tablet' ? 'bg-slate-100' : 'bg-slate-950'
                  }`}>
                    <th className="py-2 px-3 text-left">Action</th>
                    <th className="py-2 px-3 text-left">Type</th>
                    <th className="py-2 px-3 text-left">Strike</th>
                    <th className="py-2 px-3 text-right">Lots</th>
                    <th className="py-2 px-3 text-right">Entry (₹)</th>
                    <th className="py-2 px-3 text-right">Premium (₹)</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px] tabular-nums">
                  {legs.map((leg) => (
                    <tr key={leg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3">
                        <button
                          onClick={() => toggleAction(leg.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            leg.action === 'BUY'
                              ? 'bg-blue-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {leg.action}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => toggleType(leg.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            leg.type === 'CE'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {leg.type}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {leg.strike}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span>{leg.lots} ({leg.lots * leg.lotSize} qty)</span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        ₹{leg.price.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${
                        leg.action === 'SELL' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {leg.action === 'SELL' ? '+' : '-'}₹{(leg.price * leg.lots * leg.lotSize).toFixed(0)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeLeg(leg.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove leg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Key Metrics KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-2">
            <div className={`p-2.5 rounded-lg border ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 font-sans">Net Cashflow / Prem</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${
                netPremium >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {netPremium >= 0 ? '+' : ''}₹{Math.abs(netPremium).toFixed(0)} {netPremium >= 0 ? 'Cr.' : 'Dr.'}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 font-sans">Max Profit / Max Loss</div>
              <div className="text-xs font-bold font-mono mt-0.5">
                <span className="text-emerald-500">
                  {maxPayoff > 500000 ? 'Unlimited' : `₹${maxPayoff.toFixed(0)}`}
                </span>
                {' / '}
                <span className="text-rose-500">
                  {minPayoff < -500000 ? 'Unlimited' : `₹${Math.abs(minPayoff).toFixed(0)}`}
                </span>
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 font-sans">Breakevens</div>
              <div className="text-xs font-bold font-mono mt-0.5 text-indigo-600 dark:text-indigo-400">
                {breakevens.length > 0 ? breakevens.join(' & ') : 'None'}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 font-sans">Daily Theta Decay</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${
                netTheta >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {netTheta >= 0 ? '+' : ''}₹{netTheta.toFixed(0)}/day
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Payoff Diagram SVG (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Expiry Payoff Diagram
          </h3>

          <div className={`h-72 w-full rounded-lg border p-3 flex flex-col relative ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            {payoffPoints.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Add legs to calculate strategy payoff curve
              </div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 200">
                {/* Horizontal Zero PnL line */}
                {(() => {
                  const pnlSpan = Math.max(Math.abs(minPayoff), Math.abs(maxPayoff), 1000);
                  const zeroY = 100;

                  // Transform coordinate
                  const getY = (pnl: number) => {
                    const scaled = (pnl / pnlSpan) * 80;
                    return Math.max(15, Math.min(185, 100 - scaled));
                  };

                  const getX = (index: number) => {
                    return (index / (payoffPoints.length - 1)) * 280 + 10;
                  };

                  // Build path
                  const pathData = payoffPoints.map((pt, idx) => {
                    const x = getX(idx);
                    const y = getY(pt.pnl);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');

                  // Current spot vertical marker
                  const minS = payoffPoints[0].spot;
                  const maxS = payoffPoints[payoffPoints.length - 1].spot;
                  const spotX = ((spotPrice - minS) / (maxS - minS)) * 280 + 10;

                  return (
                    <>
                      {/* Zero line */}
                      <line x1="5" y1={zeroY} x2="295" y2={zeroY} stroke="#94a3b8" strokeDasharray="2 2" />
                      <text x="10" y={zeroY - 4} fontSize="8" fill="#94a3b8" className="font-mono">₹0 P&L</text>

                      {/* Current Spot Line */}
                      <line x1={spotX} y1="15" x2={spotX} y2="185" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x={spotX} y="12" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700" className="font-mono">
                        Spot {spotPrice.toFixed(0)}
                      </text>

                      {/* Payoff Curve */}
                      <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                    </>
                  );
                })()}
              </svg>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Net Delta: {netDelta}</span>
              <span>Net Theta: ₹{netTheta}/d</span>
              <span>Net Vega: ₹{netVega}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
