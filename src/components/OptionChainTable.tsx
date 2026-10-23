import React, { useState, useMemo } from 'react';
import { StrikeRow, IndexSymbol, OptionData, BuildupType } from '../types/options';
import { formatIndianNumber, AVAILABLE_EXPIRIES } from '../utils/optionsData';
import { ArrowUp, ArrowDown, Download, Eye, ChevronDown, ChevronUp, PlusCircle, Search, LayoutGrid, Table2, Layers, Filter } from 'lucide-react';

interface OptionChainTableProps {
  rows: StrikeRow[];
  spotPrice: number;
  symbol: IndexSymbol;
  setSymbol: (sym: IndexSymbol) => void;
  expiry: string;
  setExpiry: (exp: string) => void;
  theme: 'tablet' | 'dark';
  onTradeSelect: (strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => void;
  onAddToStrategy: (strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => void;
}

export const OptionChainTable: React.FC<OptionChainTableProps> = ({
  rows,
  spotPrice,
  symbol,
  setSymbol,
  expiry,
  setExpiry,
  theme,
  onTradeSelect,
  onAddToStrategy,
}) => {
  const [strikeRange, setStrikeRange] = useState<number>(20); // 20 strikes around ATM
  const [showGreeks, setShowGreeks] = useState<boolean>(false);
  const [showBuildup, setShowBuildup] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileView, setMobileView] = useState<'cards' | 'matrix' | 'ce' | 'pe'>('cards');
  const [expandedStrikes, setExpandedStrikes] = useState<Record<number, boolean>>({});


  // Find max OI in current rows to calibrate horizontal depth bars
  const { maxCallOI, maxPutOI, totalCallOI, totalPutOI, totalCallVol, totalPutVol, totalCallOIChange, totalPutOIChange } = useMemo(() => {
    let mCall = 1;
    let mPut = 1;
    let tCallOI = 0;
    let tPutOI = 0;
    let tCallVol = 0;
    let tPutVol = 0;
    let tCallOIChg = 0;
    let tPutOIChg = 0;

    rows.forEach((r) => {
      if (r.call.oi > mCall) mCall = r.call.oi;
      if (r.put.oi > mPut) mPut = r.put.oi;
      tCallOI += r.call.oi;
      tPutOI += r.put.oi;
      tCallVol += r.call.volume;
      tPutVol += r.put.volume;
      tCallOIChg += r.call.oiChange;
      tPutOIChg += r.put.oiChange;
    });

    return {
      maxCallOI: mCall,
      maxPutOI: mPut,
      totalCallOI: tCallOI,
      totalPutOI: tPutOI,
      totalCallVol: tCallVol,
      totalPutVol: tPutVol,
      totalCallOIChange: tCallOIChg,
      totalPutOIChange: tPutOIChg,
    };
  }, [rows]);

  // Filter strikes based on range around ATM and search
  const filteredRows = useMemo(() => {
    const atmIndex = rows.findIndex((r) => r.isATM);
    let slice = rows;
    if (atmIndex !== -1 && strikeRange > 0) {
      const half = Math.floor(strikeRange / 2);
      const start = Math.max(0, atmIndex - half);
      const end = Math.min(rows.length, atmIndex + half + 1);
      slice = rows.slice(start, end);
    }
    if (searchQuery.trim() !== '') {
      slice = slice.filter((r) => r.strikePrice.toString().includes(searchQuery.trim()));
    }
    return slice;
  }, [rows, strikeRange, searchQuery]);

  // Export Option Chain to CSV
  const handleExportCSV = () => {
    const headers = [
      'Call Buildup,Call OI,Call OI Chg,Call Vol,Call IV,Call LTP,Call Chg,STRIKE,Put Chg,Put LTP,Put IV,Put Vol,Put OI Chg,Put OI,Put Buildup'
    ];
    const data = filteredRows.map((r) => [
      r.call.buildup,
      r.call.oi,
      r.call.oiChange,
      r.call.volume,
      r.call.iv,
      r.call.ltp,
      r.call.change,
      r.strikePrice,
      r.put.change,
      r.put.ltp,
      r.put.iv,
      r.put.volume,
      r.put.oiChange,
      r.put.oi,
      r.put.buildup,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...data].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${symbol}_OptionChain_${expiry.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBuildupBadge = (buildup: BuildupType) => {
    switch (buildup) {
      case 'Long Buildup':
        return (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight" title="Long Buildup: Price Up, OI Up (Bullish)">
            LB
          </span>
        );
      case 'Short Buildup':
        return (
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 font-mono tracking-tight" title="Short Buildup: Price Down, OI Up (Bearish)">
            SB
          </span>
        );
      case 'Short Covering':
        return (
          <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight" title="Short Covering: Price Up, OI Down (Bullish)">
            SC
          </span>
        );
      case 'Long Unwinding':
        return (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono tracking-tight" title="Long Unwinding: Price Down, OI Down (Bearish)">
            LU
          </span>
        );
    }
  };

  return (
    <div className={`w-full flex flex-col transition-colors ${
      theme === 'tablet'
        ? 'bg-slate-100 text-slate-800'
        : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Control Toolbar */}
      <div className={`p-2.5 sm:p-3 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs ${
        theme === 'tablet'
          ? 'bg-white border-slate-300'
          : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Left: Instrument Selector & Expiry Dropdown */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Index Selector (Touch scrollable) */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-x-auto no-scrollbar max-w-[280px] sm:max-w-none">
            {(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'] as IndexSymbol[]).map((sym) => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  symbol === sym
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Expiry Selector */}
          <div className="relative">
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className={`appearance-none pl-2.5 pr-7 py-1.5 font-mono text-xs font-semibold rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                theme === 'tablet'
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            >
              {AVAILABLE_EXPIRIES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Mobile View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setMobileView('cards')}
              title="Dual Strike Cards View (Optimized for Mobile/Touch)"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                mobileView === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setMobileView('matrix')}
              title="Full Matrix Table View"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                mobileView === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Table2 className="w-3 h-3" />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setMobileView('ce')}
              title="Calls (CE) Only Table"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                mobileView === 'ce'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-500 hover:bg-rose-500/10'
              }`}
            >
              CE
            </button>
            <button
              onClick={() => setMobileView('pe')}
              title="Puts (PE) Only Table"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                mobileView === 'pe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-500 hover:bg-emerald-500/10'
              }`}
            >
              PE
            </button>
          </div>
        </div>

        {/* Right: Strike Range, Search & Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Strike Range Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-950">
              {[
                { label: '±5', val: 10 },
                { label: '±10', val: 20 },
                { label: '±15', val: 30 },
                { label: 'All', val: 0 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setStrikeRange(item.val)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    strikeRange === item.val
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strike Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Strike..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-20 sm:w-28 pl-6 pr-1.5 py-1 font-mono text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                theme === 'tablet'
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          {/* Toggles */}
          <button
            onClick={() => setShowGreeks(!showGreeks)}
            className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors hidden sm:inline-block ${
              showGreeks
                ? 'bg-indigo-600 text-white border-indigo-600'
                : theme === 'tablet'
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {showGreeks ? 'Greeks ON' : '+ Greeks'}
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors hidden sm:inline-block ${
              showHeatmap
                ? 'bg-indigo-600 text-white border-indigo-600'
                : theme === 'tablet'
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {showHeatmap ? 'Heatmap' : 'No Heat'}
          </button>

          <button
            onClick={handleExportCSV}
            title="Export to CSV"
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium border transition-colors ${
              theme === 'tablet'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Mobile Dual Strike Cards View */}
      {mobileView === 'cards' && (
        <div className="w-full p-2 sm:p-3 space-y-2">
          {/* Quick Header Summary */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-500 font-mono">
            <span className="text-rose-500 font-bold">CALL (CE)</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">STRIKE</span>
            <span className="text-emerald-500 font-bold">PUT (PE)</span>
          </div>

          <div className="space-y-2">
            {filteredRows.map((row) => {
              const isATM = row.isATM;
              const isExpanded = expandedStrikes[row.strikePrice];
              const callOIWidth = (row.call.oi / maxCallOI) * 100;
              const putOIWidth = (row.put.oi / maxPutOI) * 100;

              return (
                <div
                  key={row.strikePrice}
                  className={`rounded-xl border p-2.5 transition-all shadow-xs ${
                    isATM
                      ? theme === 'tablet'
                        ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400'
                        : 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                      : theme === 'tablet'
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Strike Header */}
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-slate-100">
                        {row.strikePrice}
                      </span>
                      {isATM && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white animate-pulse">
                          ATM
                        </span>
                      )}
                      {row.isMaxPain && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/40">
                          Max Pain
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStrikes((prev) => ({
                          ...prev,
                          [row.strikePrice]: !prev[row.strikePrice],
                        }))
                      }
                      className="text-[11px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Greeks & Depth'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-indigo-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dual Grid: CALL vs PUT */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* CALL (CE) SIDE */}
                    <div
                      className={`p-2 rounded-lg border relative overflow-hidden transition-colors ${
                        row.isCallITM
                          ? theme === 'tablet'
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-amber-950/20 border-amber-900/50'
                          : theme === 'tablet'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {showHeatmap && (
                        <div
                          className="absolute top-0 right-0 bottom-0 bg-blue-500/15 pointer-events-none transition-all duration-300"
                          style={{ width: `${callOIWidth}%` }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-rose-500 flex items-center gap-1">
                            CE {getBuildupBadge(row.call.buildup)}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            OI: {formatIndianNumber(row.call.oi)}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                            ₹{row.call.ltp.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              row.call.change >= 0
                                ? 'text-emerald-500'
                                : 'text-rose-500'
                            }`}
                          >
                            {row.call.change >= 0 ? '+' : ''}
                            {row.call.change.toFixed(1)}
                          </span>
                        </div>

                        {/* Trade Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              onTradeSelect(row.strikePrice, 'CE', 'BUY', row.call.ltp)
                            }
                            className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-transform"
                          >
                            BUY
                          </button>
                          <button
                            onClick={() =>
                              onTradeSelect(row.strikePrice, 'CE', 'SELL', row.call.ltp)
                            }
                            className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-transform"
                          >
                            SELL
                          </button>
                          <button
                            onClick={() =>
                              onAddToStrategy(row.strikePrice, 'CE', 'BUY', row.call.ltp)
                            }
                            title="Add to Strategy Builder"
                            className="p-1 rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-400"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PUT (PE) SIDE */}
                    <div
                      className={`p-2 rounded-lg border relative overflow-hidden transition-colors ${
                        row.isPutITM
                          ? theme === 'tablet'
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-amber-950/20 border-amber-900/50'
                          : theme === 'tablet'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {showHeatmap && (
                        <div
                          className="absolute top-0 right-0 bottom-0 bg-blue-500/15 pointer-events-none transition-all duration-300"
                          style={{ width: `${putOIWidth}%` }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-emerald-500 flex items-center gap-1">
                            PE {getBuildupBadge(row.put.buildup)}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            OI: {formatIndianNumber(row.put.oi)}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                            ₹{row.put.ltp.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              row.put.change >= 0
                                ? 'text-emerald-500'
                                : 'text-rose-500'
                            }`}
                          >
                            {row.put.change >= 0 ? '+' : ''}
                            {row.put.change.toFixed(1)}
                          </span>
                        </div>

                        {/* Trade Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              onTradeSelect(row.strikePrice, 'PE', 'BUY', row.put.ltp)
                            }
                            className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-transform"
                          >
                            BUY
                          </button>
                          <button
                            onClick={() =>
                              onTradeSelect(row.strikePrice, 'PE', 'SELL', row.put.ltp)
                            }
                            className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-transform"
                          >
                            SELL
                          </button>
                          <button
                            onClick={() =>
                              onAddToStrategy(row.strikePrice, 'PE', 'BUY', row.put.ltp)
                            }
                            title="Add to Strategy Builder"
                            className="p-1 rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-400"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details: Greeks & Volumes */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="space-y-1 bg-slate-100 dark:bg-slate-950/70 p-2 rounded-lg">
                        <div className="font-bold text-rose-500">CALL GREEKS & VOL</div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IV:</span>
                          <span className="font-semibold">{row.call.iv.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Delta:</span>
                          <span className="font-semibold">{row.call.greeks.delta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Theta:</span>
                          <span className="font-semibold">{row.call.greeks.theta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Volume:</span>
                          <span>{formatIndianNumber(row.call.volume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">OI Chg:</span>
                          <span className={row.call.oiChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {row.call.oiChange >= 0 ? '+' : ''}
                            {formatIndianNumber(row.call.oiChange)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 bg-slate-100 dark:bg-slate-950/70 p-2 rounded-lg">
                        <div className="font-bold text-emerald-500">PUT GREEKS & VOL</div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IV:</span>
                          <span className="font-semibold">{row.put.iv.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Delta:</span>
                          <span className="font-semibold">{row.put.greeks.delta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Theta:</span>
                          <span className="font-semibold">{row.put.greeks.theta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Volume:</span>
                          <span>{formatIndianNumber(row.put.volume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">OI Chg:</span>
                          <span className={row.put.oiChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {row.put.oiChange >= 0 ? '+' : ''}
                            {formatIndianNumber(row.put.oiChange)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CALLS ONLY (CE) Table View */}
      {mobileView === 'ce' && (
        <div className="overflow-x-auto w-full border-b border-slate-200 dark:border-slate-800 touch-pan-x">
          <table className="w-full text-xs border-collapse select-none">
            <thead>
              <tr className={`border-b text-center font-bold tracking-wider uppercase text-[11px] ${
                theme === 'tablet' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-950/30 border-rose-900/60 text-rose-400'
              }`}>
                <th colSpan={showGreeks ? 9 : 7} className="py-2 px-3 text-left">
                  CALL OPTIONS (CE) CHAIN
                </th>
                <th className="py-2 px-3 text-right">
                  UNDERLYING: ₹{spotPrice.toFixed(1)}
                </th>
              </tr>
              <tr className={`border-b text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${
                theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
              }`}>
                <th className="py-2 px-1 text-center w-8">B/S</th>
                <th className="py-2 px-2 text-center w-8">Type</th>
                <th className="py-2 px-3 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-200/50 dark:bg-slate-900/80">Strike</th>
                <th className="py-2 px-2 text-right">LTP (₹)</th>
                <th className="py-2 px-2 text-right">Chg%</th>
                <th className="py-2 px-2 text-right">OI</th>
                <th className="py-2 px-2 text-right">OI Chg</th>
                <th className="py-2 px-2 text-right">Volume</th>
                {showGreeks && <th className="py-2 px-1.5 text-right font-mono">Delta</th>}
                {showGreeks && <th className="py-2 px-1.5 text-right font-mono">Theta</th>}
                <th className="py-2 px-1.5 text-right">IV%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono text-[11px] tabular-nums">
              {filteredRows.map((row) => (
                <tr
                  key={row.strikePrice}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    row.isATM ? (theme === 'tablet' ? 'bg-indigo-50 border-y-2 border-indigo-400 font-bold' : 'bg-indigo-950/40 border-y-2 border-indigo-500 font-bold') : row.isCallITM ? (theme === 'tablet' ? 'bg-amber-100/40' : 'bg-amber-950/15') : ''
                  }`}
                >
                  <td className="py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'CE', 'BUY', row.call.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white"
                      >
                        B
                      </button>
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'CE', 'SELL', row.call.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white"
                      >
                        S
                      </button>
                    </div>
                  </td>
                  <td className="py-1.5 px-1 text-center">{getBuildupBadge(row.call.buildup)}</td>
                  <td className="py-1.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-200/40 dark:bg-slate-900/60">
                    {row.strikePrice}
                    {row.isATM && <span className="ml-1 text-[9px] text-indigo-400">ATM</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{row.call.ltp.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-semibold ${row.call.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.call.change >= 0 ? '+' : ''}{row.call.pChange}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatIndianNumber(row.call.oi)}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${row.call.oiChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.call.oiChange >= 0 ? '+' : ''}{formatIndianNumber(row.call.oiChange)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">{formatIndianNumber(row.call.volume)}</td>
                  {showGreeks && <td className="py-1.5 px-1.5 text-right">{row.call.greeks.delta}</td>}
                  {showGreeks && <td className="py-1.5 px-1.5 text-right">{row.call.greeks.theta}</td>}
                  <td className="py-1.5 px-1.5 text-right text-slate-400">{row.call.iv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. PUTS ONLY (PE) Table View */}
      {mobileView === 'pe' && (
        <div className="overflow-x-auto w-full border-b border-slate-200 dark:border-slate-800 touch-pan-x">
          <table className="w-full text-xs border-collapse select-none">
            <thead>
              <tr className={`border-b text-center font-bold tracking-wider uppercase text-[11px] ${
                theme === 'tablet' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-400'
              }`}>
                <th colSpan={showGreeks ? 9 : 7} className="py-2 px-3 text-left">
                  PUT OPTIONS (PE) CHAIN
                </th>
                <th className="py-2 px-3 text-right">
                  UNDERLYING: ₹{spotPrice.toFixed(1)}
                </th>
              </tr>
              <tr className={`border-b text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${
                theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
              }`}>
                <th className="py-2 px-1 text-center w-8">B/S</th>
                <th className="py-2 px-2 text-center w-8">Type</th>
                <th className="py-2 px-3 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-200/50 dark:bg-slate-900/80">Strike</th>
                <th className="py-2 px-2 text-right">LTP (₹)</th>
                <th className="py-2 px-2 text-right">Chg%</th>
                <th className="py-2 px-2 text-right">OI</th>
                <th className="py-2 px-2 text-right">OI Chg</th>
                <th className="py-2 px-2 text-right">Volume</th>
                {showGreeks && <th className="py-2 px-1.5 text-right font-mono">Delta</th>}
                {showGreeks && <th className="py-2 px-1.5 text-right font-mono">Theta</th>}
                <th className="py-2 px-1.5 text-right">IV%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono text-[11px] tabular-nums">
              {filteredRows.map((row) => (
                <tr
                  key={row.strikePrice}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    row.isATM ? (theme === 'tablet' ? 'bg-indigo-50 border-y-2 border-indigo-400 font-bold' : 'bg-indigo-950/40 border-y-2 border-indigo-500 font-bold') : row.isPutITM ? (theme === 'tablet' ? 'bg-amber-100/40' : 'bg-amber-950/15') : ''
                  }`}
                >
                  <td className="py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'PE', 'BUY', row.put.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white"
                      >
                        B
                      </button>
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'PE', 'SELL', row.put.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white"
                      >
                        S
                      </button>
                    </div>
                  </td>
                  <td className="py-1.5 px-1 text-center">{getBuildupBadge(row.put.buildup)}</td>
                  <td className="py-1.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-200/40 dark:bg-slate-900/60">
                    {row.strikePrice}
                    {row.isATM && <span className="ml-1 text-[9px] text-indigo-400">ATM</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{row.put.ltp.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-semibold ${row.put.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.put.change >= 0 ? '+' : ''}{row.put.pChange}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatIndianNumber(row.put.oi)}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${row.put.oiChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.put.oiChange >= 0 ? '+' : ''}{formatIndianNumber(row.put.oiChange)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">{formatIndianNumber(row.put.volume)}</td>
                  {showGreeks && <td className="py-1.5 px-1.5 text-right">{row.put.greeks.delta}</td>}
                  {showGreeks && <td className="py-1.5 px-1.5 text-right">{row.put.greeks.theta}</td>}
                  <td className="py-1.5 px-1.5 text-right text-slate-400">{row.put.iv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Complete Dual Matrix Table (Classic Desktop & Tablet View) */}
      {mobileView === 'matrix' && (
      <div className="overflow-x-auto w-full border-b border-slate-200 dark:border-slate-800 touch-pan-x">
        <table className="w-full text-xs border-collapse select-none">
          {/* Table Header Row 1: CALLS vs PUTS Banner */}
          <thead>
            <tr className={`border-b text-center font-bold tracking-wider uppercase text-[11px] ${
              theme === 'tablet' ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              <th colSpan={showGreeks ? 10 : 7} className="py-1.5 text-rose-600 dark:text-rose-400 border-r border-slate-300 dark:border-slate-800">
                CALL OPTIONS (CE)
              </th>
              <th className="py-1.5 px-4 text-indigo-600 dark:text-indigo-400 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">
                STRIKE PRICE
              </th>
              <th colSpan={showGreeks ? 10 : 7} className="py-1.5 text-emerald-600 dark:text-emerald-400">
                PUT OPTIONS (PE)
              </th>
            </tr>

            {/* Table Header Row 2: Detailed Column Titles */}
            <tr className={`border-b text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${
              theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              {/* CALL HEADERS */}
              <th className="py-2 px-1.5 text-center w-8">B/S</th>
              {showBuildup && <th className="py-2 px-2 text-center w-9">Build</th>}
              <th className="py-2 px-2 text-right">OI</th>
              <th className="py-2 px-2 text-right">Chg in OI</th>
              <th className="py-2 px-2 text-right">Volume</th>
              <th className="py-2 px-1.5 text-right">IV%</th>
              {showGreeks && (
                <>
                  <th className="py-2 px-1.5 text-right font-mono">Delta</th>
                  <th className="py-2 px-1.5 text-right font-mono">Theta</th>
                  <th className="py-2 px-1.5 text-right font-mono">Vega</th>
                </>
              )}
              <th className="py-2 px-3 text-right border-r border-slate-300 dark:border-slate-800">LTP (₹)</th>

              {/* CENTER STRIKE HEADER */}
              <th className="py-2 px-6 text-center font-bold text-slate-800 dark:text-slate-100 border-r border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/80">
                Strike
              </th>

              {/* PUT HEADERS */}
              <th className="py-2 px-3 text-left border-r border-slate-300 dark:border-slate-800">LTP (₹)</th>
              {showGreeks && (
                <>
                  <th className="py-2 px-1.5 text-left font-mono">Delta</th>
                  <th className="py-2 px-1.5 text-left font-mono">Theta</th>
                  <th className="py-2 px-1.5 text-left font-mono">Vega</th>
                </>
              )}
              <th className="py-2 px-1.5 text-left">IV%</th>
              <th className="py-2 px-2 text-left">Volume</th>
              <th className="py-2 px-2 text-left">Chg in OI</th>
              <th className="py-2 px-2 text-left">OI</th>
              {showBuildup && <th className="py-2 px-2 text-center w-9">Build</th>}
              <th className="py-2 px-1.5 text-center w-8">B/S</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono text-[11px] tabular-nums">
            {filteredRows.map((row) => {
              const isATM = row.isATM;
              const callOIWidth = (row.call.oi / maxCallOI) * 100;
              const putOIWidth = (row.put.oi / maxPutOI) * 100;

              // Shading:
              // For Call side: ITM if strike < spot
              // For Put side: ITM if strike > spot
              const callITMBg = row.isCallITM
                ? theme === 'tablet'
                  ? 'bg-amber-100/40 dark:bg-amber-950/20'
                  : 'bg-amber-950/15'
                : '';

              const putITMBg = row.isPutITM
                ? theme === 'tablet'
                  ? 'bg-amber-100/40 dark:bg-amber-950/20'
                  : 'bg-amber-950/15'
                : '';

              const atmRowBg = isATM
                ? theme === 'tablet'
                  ? 'bg-indigo-50 border-y-2 border-indigo-400 font-bold'
                  : 'bg-indigo-950/40 border-y-2 border-indigo-500 font-bold'
                : '';

              return (
                <tr
                  key={row.strikePrice}
                  className={`group hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors ${atmRowBg}`}
                >
                  {/* CALL: Quick Action Buttons */}
                  <td className={`py-1.5 px-1 text-center ${callITMBg}`}>
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'CE', 'BUY', row.call.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                        title="Buy Call"
                      >
                        B
                      </button>
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'CE', 'SELL', row.call.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white hover:bg-rose-700"
                        title="Sell Call"
                      >
                        S
                      </button>
                    </div>
                  </td>

                  {/* CALL: Buildup */}
                  {showBuildup && (
                    <td className={`py-1.5 px-1 text-center ${callITMBg}`}>
                      {getBuildupBadge(row.call.buildup)}
                    </td>
                  )}

                  {/* CALL: Open Interest (with horizontal bar fill matching photo!) */}
                  <td className={`py-1.5 px-2 text-right relative overflow-hidden ${callITMBg}`}>
                    {showHeatmap && (
                      <div
                        className="absolute top-0 right-0 bottom-0 bg-blue-400/20 dark:bg-blue-500/20 pointer-events-none transition-all duration-300"
                        style={{ width: `${callOIWidth}%` }}
                      />
                    )}
                    <span className="relative z-10 font-semibold text-slate-800 dark:text-slate-200">
                      {formatIndianNumber(row.call.oi)}
                    </span>
                  </td>

                  {/* CALL: Change in OI */}
                  <td className={`py-1.5 px-2 text-right ${callITMBg} ${
                    row.call.oiChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span>{row.call.oiChange >= 0 ? '+' : ''}{formatIndianNumber(row.call.oiChange)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({row.call.oiPChange >= 0 ? '+' : ''}{row.call.oiPChange}%)
                    </span>
                  </td>

                  {/* CALL: Volume */}
                  <td className={`py-1.5 px-2 text-right text-slate-600 dark:text-slate-300 ${callITMBg}`}>
                    {formatIndianNumber(row.call.volume)}
                  </td>

                  {/* CALL: IV */}
                  <td className={`py-1.5 px-1.5 text-right text-slate-500 dark:text-slate-400 ${callITMBg}`}>
                    {row.call.iv.toFixed(1)}
                  </td>

                  {/* CALL: Greeks (if enabled) */}
                  {showGreeks && (
                    <>
                      <td className={`py-1.5 px-1.5 text-right text-slate-600 dark:text-slate-300 ${callITMBg}`}>
                        {row.call.greeks.delta}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-rose-500 ${callITMBg}`}>
                        {row.call.greeks.theta}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-slate-500 ${callITMBg}`}>
                        {row.call.greeks.vega}
                      </td>
                    </>
                  )}

                  {/* CALL: LTP & Net Change */}
                  <td className={`py-1.5 px-3 text-right border-r border-slate-300 dark:border-slate-800 ${callITMBg}`}>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{row.call.ltp.toFixed(2)}
                    </div>
                    <div className={`text-[10px] ${
                      row.call.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {row.call.change >= 0 ? '+' : ''}{row.call.change.toFixed(2)} ({row.call.pChange.toFixed(1)}%)
                    </div>
                  </td>

                  {/* CENTER: Strike Price (with highlighted badges matching user's tablet) */}
                  <td className={`py-2 px-4 text-center border-r border-slate-300 dark:border-slate-800 ${
                    isATM
                      ? 'bg-indigo-600 text-white font-extrabold shadow-inner'
                      : theme === 'tablet'
                        ? 'bg-slate-200/70 text-slate-900 font-bold'
                        : 'bg-slate-900 text-slate-100 font-bold'
                  }`}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs tracking-wider">
                        {row.strikePrice}
                      </div>

                      {/* Prominent ATM badge as seen on the tablet photo! */}
                      {isATM && (
                        <div className="text-[10px] font-sans font-bold bg-white text-indigo-800 px-1.5 py-0.2 rounded mt-0.5 tracking-tight shadow-xs">
                          ATM • Spot {spotPrice.toFixed(0)}
                        </div>
                      )}

                      {/* Resistance Badge */}
                      {row.isMaxCallOI && !isATM && (
                        <div className="text-[9px] font-sans font-semibold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 px-1 rounded mt-0.5">
                          Major Res (Max CE)
                        </div>
                      )}

                      {/* Support Badge */}
                      {row.isMaxPutOI && !isATM && (
                        <div className="text-[9px] font-sans font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 px-1 rounded mt-0.5">
                          Major Sup (Max PE)
                        </div>
                      )}

                      {/* Max Pain Badge */}
                      {row.isMaxPain && !isATM && !row.isMaxCallOI && !row.isMaxPutOI && (
                        <div className="text-[9px] font-sans font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 px-1 rounded mt-0.5">
                          Max Pain
                        </div>
                      )}
                    </div>
                  </td>

                  {/* PUT: LTP & Net Change */}
                  <td className={`py-1.5 px-3 text-left border-r border-slate-300 dark:border-slate-800 ${putITMBg}`}>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{row.put.ltp.toFixed(2)}
                    </div>
                    <div className={`text-[10px] ${
                      row.put.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {row.put.change >= 0 ? '+' : ''}{row.put.change.toFixed(2)} ({row.put.pChange.toFixed(1)}%)
                    </div>
                  </td>

                  {/* PUT: Greeks (if enabled) */}
                  {showGreeks && (
                    <>
                      <td className={`py-1.5 px-1.5 text-left text-slate-600 dark:text-slate-300 ${putITMBg}`}>
                        {row.put.greeks.delta}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-rose-500 ${putITMBg}`}>
                        {row.put.greeks.theta}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-slate-500 ${putITMBg}`}>
                        {row.put.greeks.vega}
                      </td>
                    </>
                  )}

                  {/* PUT: IV */}
                  <td className={`py-1.5 px-1.5 text-left text-slate-500 dark:text-slate-400 ${putITMBg}`}>
                    {row.put.iv.toFixed(1)}
                  </td>

                  {/* PUT: Volume */}
                  <td className={`py-1.5 px-2 text-left text-slate-600 dark:text-slate-300 ${putITMBg}`}>
                    {formatIndianNumber(row.put.volume)}
                  </td>

                  {/* PUT: Change in OI */}
                  <td className={`py-1.5 px-2 text-left ${putITMBg} ${
                    row.put.oiChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span>{row.put.oiChange >= 0 ? '+' : ''}{formatIndianNumber(row.put.oiChange)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({row.put.oiPChange >= 0 ? '+' : ''}{row.put.oiPChange}%)
                    </span>
                  </td>

                  {/* PUT: Open Interest (with horizontal bar fill matching photo!) */}
                  <td className={`py-1.5 px-2 text-left relative overflow-hidden ${putITMBg}`}>
                    {showHeatmap && (
                      <div
                        className="absolute top-0 left-0 bottom-0 bg-emerald-400/20 dark:bg-emerald-500/20 pointer-events-none transition-all duration-300"
                        style={{ width: `${putOIWidth}%` }}
                      />
                    )}
                    <span className="relative z-10 font-semibold text-slate-800 dark:text-slate-200">
                      {formatIndianNumber(row.put.oi)}
                    </span>
                  </td>

                  {/* PUT: Buildup */}
                  {showBuildup && (
                    <td className={`py-1.5 px-1 text-center ${putITMBg}`}>
                      {getBuildupBadge(row.put.buildup)}
                    </td>
                  )}

                  {/* PUT: Quick Action Buttons */}
                  <td className={`py-1.5 px-1 text-center ${putITMBg}`}>
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'PE', 'BUY', row.put.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                        title="Buy Put"
                      >
                        B
                      </button>
                      <button
                        onClick={() => onTradeSelect(row.strikePrice, 'PE', 'SELL', row.put.ltp)}
                        className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white hover:bg-rose-700"
                        title="Sell Put"
                      >
                        S
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer: Totals Row with highlighted blocks matching the photo! */}
          <tfoot>
            <tr className={`border-t-2 font-bold text-xs ${
              theme === 'tablet'
                ? 'bg-slate-200 border-slate-300 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}>
              <td className="py-3 px-1 text-center"></td>
              {showBuildup && <td className="py-3 px-1 text-center"></td>}
              
              {/* Boxed Total Call OI */}
              <td className="py-3 px-2 text-right">
                <div className={`p-1.5 rounded border inline-block text-right ${
                  theme === 'tablet' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="text-[10px] text-slate-400 font-sans">Total Call OI</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatIndianNumber(totalCallOI)}
                  </div>
                </div>
              </td>

              {/* Total Call OI Change */}
              <td className="py-3 px-2 text-right text-slate-500">
                <span className={totalCallOIChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {totalCallOIChange >= 0 ? '+' : ''}{formatIndianNumber(totalCallOIChange)}
                </span>
              </td>

              {/* Total Call Volume */}
              <td className="py-3 px-2 text-right text-slate-500">
                {formatIndianNumber(totalCallVol)}
              </td>

              <td className="py-3 px-1.5 text-right text-slate-400">-</td>
              {showGreeks && <td colSpan={3} className="py-3 text-right text-slate-400">-</td>}
              <td className="py-3 px-3 text-right border-r border-slate-300 dark:border-slate-800 text-slate-400">-</td>

              {/* Center TOTAL block */}
              <td className="py-3 px-4 text-center border-r border-slate-300 dark:border-slate-800 bg-slate-300/60 dark:bg-slate-800/80">
                <div className="font-extrabold tracking-wider text-sm text-indigo-700 dark:text-indigo-400">
                  TOTAL
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  PCR: {(totalPutOI / Math.max(1, totalCallOI)).toFixed(2)}
                </div>
              </td>

              <td className="py-3 px-3 text-left border-r border-slate-300 dark:border-slate-800 text-slate-400">-</td>
              {showGreeks && <td colSpan={3} className="py-3 text-left text-slate-400">-</td>}
              <td className="py-3 px-1.5 text-left text-slate-400">-</td>

              {/* Total Put Volume */}
              <td className="py-3 px-2 text-left text-slate-500">
                {formatIndianNumber(totalPutVol)}
              </td>

              {/* Total Put OI Change */}
              <td className="py-3 px-2 text-left text-slate-500">
                <span className={totalPutOIChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {totalPutOIChange >= 0 ? '+' : ''}{formatIndianNumber(totalPutOIChange)}
                </span>
              </td>

              {/* Boxed Total Put OI */}
              <td className="py-3 px-2 text-left">
                <div className={`p-1.5 rounded border inline-block text-left ${
                  theme === 'tablet' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="text-[10px] text-slate-400 font-sans">Total Put OI</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIndianNumber(totalPutOI)}
                  </div>
                </div>
              </td>

              {showBuildup && <td className="py-3 px-1 text-center"></td>}
              <td className="py-3 px-1 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}
    </div>
  );
};
