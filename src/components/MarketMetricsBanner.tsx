import React, { useState } from 'react';
import { IndexConfig, StrikeRow } from '../types/options';
import { formatIndianNumber } from '../utils/optionsData';
import { TrendingUp, TrendingDown, ShieldAlert, Target, Activity, Flame, ChevronDown, ChevronUp } from 'lucide-react';

interface MarketMetricsBannerProps {
  config: IndexConfig;
  spotPrice: number;
  rows: StrikeRow[];
  theme: 'tablet' | 'dark';
}

export const MarketMetricsBanner: React.FC<MarketMetricsBannerProps> = ({
  config,
  spotPrice,
  rows,
  theme,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  // Aggregate statistics
  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;
  let maxCallOIStrike = 0;
  let maxCallOIVal = 0;
  let maxPutOIStrike = 0;
  let maxPutOIVal = 0;
  let maxPainStrike = 0;

  rows.forEach((r) => {
    totalCallOI += r.call.oi;
    totalPutOI += r.put.oi;
    totalCallVol += r.call.volume;
    totalPutVol += r.put.volume;

    if (r.call.oi > maxCallOIVal) {
      maxCallOIVal = r.call.oi;
      maxCallOIStrike = r.strikePrice;
    }
    if (r.put.oi > maxPutOIVal) {
      maxPutOIVal = r.put.oi;
      maxPutOIStrike = r.strikePrice;
    }
    if (r.isMaxPain) {
      maxPainStrike = r.strikePrice;
    }
  });

  const pcrOI = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : 1.0;
  const pcrVol = totalCallVol > 0 ? Number((totalPutVol / totalCallVol).toFixed(2)) : 1.0;

  // Sentiment based on PCR
  let pcrSentiment = 'Neutral';
  let pcrColor = 'text-slate-500';
  if (pcrOI > 1.3) {
    pcrSentiment = 'Extremely Bullish';
    pcrColor = 'text-emerald-500';
  } else if (pcrOI > 1.05) {
    pcrSentiment = 'Bullish Bias';
    pcrColor = 'text-emerald-500';
  } else if (pcrOI < 0.75) {
    pcrSentiment = 'Extremely Bearish';
    pcrColor = 'text-rose-500';
  } else if (pcrOI < 0.95) {
    pcrSentiment = 'Bearish Bias';
    pcrColor = 'text-rose-500';
  }

  // Find ATM strike and ATM straddle price
  const atmRow = rows.find((r) => r.isATM);
  const straddlePrice = atmRow ? Number((atmRow.call.ltp + atmRow.put.ltp).toFixed(2)) : 0;
  const callPutOISum = totalCallOI + totalPutOI;
  const putRatio = callPutOISum > 0 ? (totalPutOI / callPutOISum) * 100 : 50;

  const isPositive = config.change >= 0;

  return (
    <div className={`w-full border-b transition-colors ${
      theme === 'tablet'
        ? 'bg-white border-slate-200 text-slate-900'
        : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      {/* Mobile Quick Ticker Strip (< md) */}
      <div className="md:hidden px-3 py-2 flex items-center justify-between gap-2 text-xs border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          {/* Spot */}
          <div className="shrink-0 flex items-baseline gap-1 font-mono">
            <span className="text-[10px] text-slate-500 font-sans">Spot:</span>
            <span className="font-bold text-xs">{spotPrice.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
            <span className={`text-[10px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}{config.pChange.toFixed(1)}%
            </span>
          </div>

          {/* PCR */}
          <div className="shrink-0 flex items-center gap-1 font-mono text-xs">
            <span className="text-[10px] text-slate-500 font-sans">PCR:</span>
            <span className={`font-bold ${pcrColor}`}>{pcrOI}</span>
          </div>

          {/* Max Pain */}
          <div className="shrink-0 flex items-center gap-1 font-mono text-xs">
            <span className="text-[10px] text-slate-500 font-sans">Pain:</span>
            <span className="font-bold text-amber-500">{maxPainStrike}</span>
          </div>

          {/* Straddle */}
          <div className="shrink-0 flex items-center gap-1 font-mono text-xs">
            <span className="text-[10px] text-slate-500 font-sans">Straddle:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{straddlePrice}</span>
          </div>
        </div>

        {/* Toggle full stats on mobile */}
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
            theme === 'tablet'
              ? 'bg-white border-slate-300 text-indigo-700'
              : 'bg-slate-900 border-slate-700 text-indigo-400'
          }`}
        >
          <span>{isMobileExpanded ? 'Hide' : 'Stats'}</span>
          {isMobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Grid: Always shown on md+, expandable on mobile */}
      <div className={`max-w-[1720px] mx-auto px-3 sm:px-4 py-2 sm:py-3 ${
        isMobileExpanded ? 'block' : 'hidden md:block'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 items-center text-xs">
          
          {/* 1. Underlying Spot Price */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>{config.name} SPOT</span>
              <span className="text-[10px] text-indigo-400 font-mono">Lot: {config.lotSize}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono tracking-tight">
                {spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`flex items-center gap-1 font-mono text-[11px] font-semibold mt-0.5 ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{config.change.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{config.pChange.toFixed(2)}%)</span>
            </div>
          </div>

          {/* 2. ATM & Straddle */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>ATM STRIKE</span>
              <Target className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {atmRow ? atmRow.strikePrice : '-'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex justify-between">
              <span>Straddle:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">₹{straddlePrice}</span>
            </div>
          </div>

          {/* 3. PCR (Put Call Ratio) */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>PUT-CALL RATIO (PCR)</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-lg font-bold font-mono ${pcrColor}`}>
                {pcrOI}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                Vol: {pcrVol}
              </span>
            </div>
            <div className="text-[11px] font-semibold mt-0.5 truncate text-slate-600 dark:text-slate-300">
              {pcrSentiment}
            </div>
          </div>

          {/* 4. Max Pain Strike */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>MAX PAIN</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {maxPainStrike}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Option Expiry Gravitation
            </div>
          </div>

          {/* 5. Key Resistance (Max Call OI) */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-900/50'
          }`}>
            <div className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center justify-between">
              <span>RESISTANCE (MAX CE)</span>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                {maxCallOIStrike}
              </span>
            </div>
            <div className="text-[11px] font-mono text-rose-600/80 dark:text-rose-400/80 mt-0.5 flex justify-between">
              <span>OI:</span>
              <span>{formatIndianNumber(maxCallOIVal)}</span>
            </div>
          </div>

          {/* 6. Key Support (Max Put OI) */}
          <div className={`p-2.5 rounded-lg border ${
            theme === 'tablet' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/50'
          }`}>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>SUPPORT (MAX PE)</span>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {maxPutOIStrike}
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 flex justify-between">
              <span>OI:</span>
              <span>{formatIndianNumber(maxPutOIVal)}</span>
            </div>
          </div>

          {/* 7. India VIX & OI Distribution Ratio */}
          <div className={`p-2.5 rounded-lg border col-span-2 sm:col-span-1 ${
            theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>INDIA VIX</span>
              <span className="text-slate-500 font-mono text-[10px]">
                {config.vixChange > 0 ? '+' : ''}{config.vixChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono">
                {config.vix.toFixed(2)}
              </span>
            </div>
            {/* Visual ratio bar: Calls (Red) vs Puts (Green) */}
            <div className="mt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                <span className="text-rose-500">CE: {formatIndianNumber(totalCallOI)}</span>
                <span className="text-emerald-500">PE: {formatIndianNumber(totalPutOI)}</span>
              </div>
              <div className="w-full h-1.5 bg-rose-500/30 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-rose-500" 
                  style={{ width: `${100 - putRatio}%` }} 
                  title={`Call OI: ${(100 - putRatio).toFixed(1)}%`}
                />
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${putRatio}%` }} 
                  title={`Put OI: ${putRatio.toFixed(1)}%`}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
