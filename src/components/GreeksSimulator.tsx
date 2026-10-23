/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StrikeRow, IndexSymbol, IndexConfig } from '../types/options';
import { calculateBlackScholes } from '../utils/blackScholes';
import { Calculator, Gauge, ArrowRight } from 'lucide-react';

interface GreeksSimulatorProps {
  symbol: IndexSymbol;
  config: IndexConfig;
  spotPrice: number;
  rows: StrikeRow[];
  theme: 'tablet' | 'dark';
}

export const GreeksSimulator: React.FC<GreeksSimulatorProps> = ({
  symbol,
  config,
  spotPrice,
  rows,
  theme,
}) => {
  const atmRow = rows.find((r) => r.isATM) || rows[Math.floor(rows.length / 2)];
  const [selectedStrike, setSelectedStrike] = useState<number>(atmRow ? atmRow.strikePrice : 25200);
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [spotOffset, setSpotOffset] = useState<number>(0); // -500 to +500 pts
  const [ivOffset, setIvOffset] = useState<number>(0); // -5% to +10%
  const [daysRemaining, setDaysRemaining] = useState<number>(6); // 1 to 30 days

  const simulatedSpot = spotPrice + spotOffset;
  const baseIV = config.vix / 100;
  const simulatedIV = Math.max(0.04, baseIV + ivOffset / 100);
  const T = Math.max(0.001, daysRemaining / 365);

  // Black-Scholes at simulated parameters
  const simResult = calculateBlackScholes(
    simulatedSpot,
    selectedStrike,
    T,
    0.068,
    simulatedIV,
    optionType === 'CE'
  );

  // Base price (at current spot, base IV, 6 days)
  const baseResult = calculateBlackScholes(
    spotPrice,
    selectedStrike,
    6 / 365,
    0.068,
    baseIV,
    optionType === 'CE'
  );

  const priceDiff = simResult.price - baseResult.price;
  const pChange = (priceDiff / baseResult.price) * 100;

  return (
    <div className={`p-4 md:p-6 rounded-xl border transition-colors ${
      theme === 'tablet'
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold">
              Option Greeks & Price Sensitivity Lab
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate what happens to {symbol} option premiums and Greeks under spot market shocks, volatility spikes, and time decay (Theta)
          </p>
        </div>

        {/* Option Strike and CE/PE selector */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex rounded-md border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setOptionType('CE')}
              className={`px-3 py-1 font-bold rounded ${
                optionType === 'CE' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              CALL (CE)
            </button>
            <button
              onClick={() => setOptionType('PE')}
              className={`px-3 py-1 font-bold rounded ${
                optionType === 'PE' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              PUT (PE)
            </button>
          </div>

          <select
            value={selectedStrike}
            onChange={(e) => setSelectedStrike(Number(e.target.value))}
            className={`font-mono font-bold text-xs py-1.5 px-3 rounded-lg border ${
              theme === 'tablet' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
            }`}
          >
            {rows.map((r) => (
              <option key={r.strikePrice} value={r.strikePrice}>
                Strike {r.strikePrice} {r.isATM ? '(ATM)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Slider 1: Spot Price Shock */}
        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Underlying Spot Move</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {spotOffset >= 0 ? '+' : ''}{spotOffset} pts ({simulatedSpot.toFixed(0)})
            </span>
          </div>
          <input
            type="range"
            min={-config.strikeStep * 8}
            max={config.strikeStep * 8}
            step={config.strikeStep / 2}
            value={spotOffset}
            onChange={(e) => setSpotOffset(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>-{(config.strikeStep * 8)} pts</span>
            <span>Current: {spotPrice.toFixed(0)}</span>
            <span>+{(config.strikeStep * 8)} pts</span>
          </div>
        </div>

        {/* Slider 2: Volatility (IV) Shock */}
        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Implied Volatility Shift</span>
            <span className="font-mono font-bold text-amber-500">
              {ivOffset >= 0 ? '+' : ''}{ivOffset}% ({(simulatedIV * 100).toFixed(1)}% IV)
            </span>
          </div>
          <input
            type="range"
            min={-6}
            max={15}
            step={0.5}
            value={ivOffset}
            onChange={(e) => setIvOffset(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>-6% (IV Crush)</span>
            <span>Normal: {(baseIV * 100).toFixed(1)}%</span>
            <span>+15% (Spike)</span>
          </div>
        </div>

        {/* Slider 3: Days to Expiry (Theta Decay) */}
        <div className={`p-4 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Time to Expiry</span>
            <span className="font-mono font-bold text-rose-500">
              {daysRemaining} Day{daysRemaining === 1 ? '' : 's'} Remaining
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={30}
            step={0.5}
            value={daysRemaining}
            onChange={(e) => setDaysRemaining(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>0 DTE (Expiry Day)</span>
            <span>7 Days</span>
            <span>30 Days</span>
          </div>
        </div>
      </div>

      {/* Comparison Outcome Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Theoretical Price */}
        <div className={`p-3.5 rounded-lg border col-span-2 ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-medium">Estimated Theoretical Premium</div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              ₹{simResult.price.toFixed(2)}
            </span>
            <div className={`flex items-center text-xs font-mono font-bold ${
              priceDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              <span>{priceDiff >= 0 ? '+' : ''}₹{priceDiff.toFixed(2)} ({priceDiff >= 0 ? '+' : ''}{pChange.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Baseline Price: ₹{baseResult.price.toFixed(2)} (Per Lot ₹{(simResult.price * config.lotSize).toFixed(0)})
          </div>
        </div>

        {/* Delta */}
        <div className={`p-3 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Delta (Δ)</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-indigo-600 dark:text-indigo-400">
            {simResult.greeks.delta}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Moves ₹{Math.abs(simResult.greeks.delta * 10).toFixed(1)} per 10 pt spot
          </div>
        </div>

        {/* Gamma */}
        <div className={`p-3 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Gamma (Γ)</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-slate-700 dark:text-slate-200">
            {simResult.greeks.gamma}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Rate of delta acceleration
          </div>
        </div>

        {/* Theta */}
        <div className={`p-3 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Theta (Θ)</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-rose-500">
            {simResult.greeks.theta}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Decay: ₹{Math.abs(simResult.greeks.theta * config.lotSize).toFixed(0)}/day per lot
          </div>
        </div>

        {/* Vega */}
        <div className={`p-3 rounded-lg border ${
          theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Vega (ν)</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-amber-500">
            {simResult.greeks.vega}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Impact per 1% IV shift
          </div>
        </div>
      </div>
    </div>
  );
};
