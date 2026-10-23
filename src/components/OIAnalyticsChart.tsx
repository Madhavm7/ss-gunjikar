/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StrikeRow, IndexSymbol } from '../types/options';
import { formatIndianNumber } from '../utils/optionsData';
import { BarChart3, TrendingUp, Filter, Info } from 'lucide-react';

interface OIAnalyticsChartProps {
  rows: StrikeRow[];
  spotPrice: number;
  symbol: IndexSymbol;
  theme: 'tablet' | 'dark';
}

export const OIAnalyticsChart: React.FC<OIAnalyticsChartProps> = ({
  rows,
  spotPrice,
  symbol,
  theme,
}) => {
  const [metric, setMetric] = useState<'totalOI' | 'changeOI'>('totalOI');
  const [hoveredStrike, setHoveredStrike] = useState<StrikeRow | null>(null);

  // Focus on 21 strikes centered on ATM
  const chartRows = useMemo(() => {
    const atmIndex = rows.findIndex((r) => r.isATM);
    if (atmIndex === -1) return rows.slice(0, 21);
    const start = Math.max(0, atmIndex - 10);
    const end = Math.min(rows.length, atmIndex + 11);
    return rows.slice(start, end);
  }, [rows]);

  // Max value calculation for chart scaling
  const maxVal = useMemo(() => {
    let max = 1;
    chartRows.forEach((r) => {
      if (metric === 'totalOI') {
        if (r.call.oi > max) max = r.call.oi;
        if (r.put.oi > max) max = r.put.oi;
      } else {
        const absCallChg = Math.abs(r.call.oiChange);
        const absPutChg = Math.abs(r.put.oiChange);
        if (absCallChg > max) max = absCallChg;
        if (absPutChg > max) max = absPutChg;
      }
    });
    return max * 1.15; // 15% headroom
  }, [chartRows, metric]);

  // Buildup breakdown counts
  const buildupStats = useMemo(() => {
    let lb = 0, sb = 0, sc = 0, lu = 0;
    rows.forEach(r => {
      [r.call.buildup, r.put.buildup].forEach(b => {
        if (b === 'Long Buildup') lb++;
        else if (b === 'Short Buildup') sb++;
        else if (b === 'Short Covering') sc++;
        else if (b === 'Long Unwinding') lu++;
      });
    });
    return { lb, sb, sc, lu, total: lb + sb + sc + lu };
  }, [rows]);

  return (
    <div className={`p-4 md:p-6 rounded-xl border transition-colors ${
      theme === 'tablet'
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
    }`}>
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold">
              {symbol} Strike-Wise Open Interest Distribution
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare Call OI (Resistance / Call Writing) against Put OI (Support / Put Writing) across active strikes
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setMetric('totalOI')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                metric === 'totalOI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Cumulative Open Interest
            </button>
            <button
              onClick={() => setMetric('changeOI')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                metric === 'changeOI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Day's Change in OI
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Quick Tooltip preview */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs font-medium pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300">Call OI (Resistance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">Put OI (Support)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-700 dark:text-slate-300">ATM Strike Marker</span>
          </div>
        </div>

        {hoveredStrike && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[11px] bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-800">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Strike: {hoveredStrike.strikePrice}
            </span>
            <span className="text-rose-500">
              CE: {formatIndianNumber(hoveredStrike.call.oi)}
            </span>
            <span className="text-emerald-500">
              PE: {formatIndianNumber(hoveredStrike.put.oi)}
            </span>
            <span className="text-slate-500">
              PCR: {(hoveredStrike.put.oi / Math.max(1, hoveredStrike.call.oi)).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Primary SVG Dual Bar Chart with horizontal touch scroll */}
      <div className="w-full overflow-x-auto touch-pan-x pb-2">
        <div className="min-w-[620px] sm:min-w-[760px] h-72 sm:h-96 relative flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartRows.length * 40} 260`}>
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = 220 - pct * 190;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartRows.length * 40}
                  y2={y}
                  stroke={theme === 'tablet' ? '#e2e8f0' : '#1e293b'}
                  strokeDasharray="3 3"
                />
                <text
                  x="0"
                  y={y - 4}
                  fontSize="9"
                  fill={theme === 'tablet' ? '#94a3b8' : '#64748b'}
                  className="font-mono"
                >
                  {formatIndianNumber(maxVal * pct)}
                </text>
              </g>
            );
          })}

          {/* Strike Bars */}
          {chartRows.map((r, i) => {
            const xCenter = i * 40 + 20;
            const barWidth = 11;

            let callHeight = 0;
            let putHeight = 0;

            if (metric === 'totalOI') {
              callHeight = (r.call.oi / maxVal) * 190;
              putHeight = (r.put.oi / maxVal) * 190;
            } else {
              callHeight = (Math.abs(r.call.oiChange) / maxVal) * 190;
              putHeight = (Math.abs(r.put.oiChange) / maxVal) * 190;
            }

            const yBase = 220;
            const callY = yBase - callHeight;
            const putY = yBase - putHeight;

            const isATM = r.isATM;

            return (
              <g
                key={r.strikePrice}
                onMouseEnter={() => setHoveredStrike(r)}
                onMouseLeave={() => setHoveredStrike(null)}
                className="cursor-pointer group"
              >
                {/* Column Highlight Background on Hover or ATM */}
                <rect
                  x={xCenter - 18}
                  y={20}
                  width={36}
                  height={200}
                  fill={isATM ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}
                  className="group-hover:fill-indigo-500/10 transition-colors"
                  rx="3"
                />

                {/* Call Bar (Left, Red) */}
                <rect
                  x={xCenter - barWidth - 1}
                  y={callY}
                  width={barWidth}
                  height={Math.max(callHeight, 2)}
                  fill={metric === 'changeOI' && r.call.oiChange < 0 ? '#fb7185' : '#ef4444'}
                  rx="2"
                  className="transition-all duration-200 group-hover:brightness-110"
                />

                {/* Put Bar (Right, Green) */}
                <rect
                  x={xCenter + 1}
                  y={putY}
                  width={barWidth}
                  height={Math.max(putHeight, 2)}
                  fill={metric === 'changeOI' && r.put.oiChange < 0 ? '#34d399' : '#10b981'}
                  rx="2"
                  className="transition-all duration-200 group-hover:brightness-110"
                />

                {/* Strike Label below axis */}
                <text
                  x={xCenter}
                  y="238"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isATM ? '700' : '500'}
                  fill={isATM ? '#6366f1' : theme === 'tablet' ? '#475569' : '#94a3b8'}
                  className="font-mono"
                >
                  {r.strikePrice}
                </text>

                {/* ATM marker pin */}
                {isATM && (
                  <circle
                    cx={xCenter}
                    cy="250"
                    r="3"
                    fill="#6366f1"
                  />
                )}
              </g>
            );
          })}
        </svg>
        </div>
      </div>

      {/* Buildup Breakdown Card */}
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Market Buildup Structure across Selected Strikes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">Long Buildup</div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
              {buildupStats.lb} Strikes
            </div>
            <div className="text-[11px] text-slate-500">Price Up + OI Inflow (Bullish)</div>
          </div>

          <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <div className="font-semibold text-cyan-600 dark:text-cyan-400">Short Covering</div>
            <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-300 mt-1">
              {buildupStats.sc} Strikes
            </div>
            <div className="text-[11px] text-slate-500">Price Up + OI Outflow (Bullish)</div>
          </div>

          <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10">
            <div className="font-semibold text-rose-600 dark:text-rose-400">Short Buildup</div>
            <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
              {buildupStats.sb} Strikes
            </div>
            <div className="text-[11px] text-slate-500">Price Down + OI Inflow (Bearish)</div>
          </div>

          <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <div className="font-semibold text-amber-600 dark:text-amber-400">Long Unwinding</div>
            <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
              {buildupStats.lu} Strikes
            </div>
            <div className="text-[11px] text-slate-500">Price Down + OI Outflow (Bearish)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
