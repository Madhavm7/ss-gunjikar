/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IndexSymbol, StrikeRow, StrategyLeg, PaperTradePosition } from './types/options';
import { INDEX_CONFIGS, AVAILABLE_EXPIRIES, generateOptionChain, simulateMarketTick } from './utils/optionsData';
import { Header } from './components/Header';
import { MarketMetricsBanner } from './components/MarketMetricsBanner';
import { OptionChainTable } from './components/OptionChainTable';
import { OIAnalyticsChart } from './components/OIAnalyticsChart';
import { StrategyBuilder } from './components/StrategyBuilder';
import { GreeksSimulator } from './components/GreeksSimulator';
import { PositionsManager } from './components/PositionsManager';
import { TradeModal } from './components/TradeModal';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const [symbol, setSymbol] = useState<IndexSymbol>('NIFTY');
  const [expiry, setExpiry] = useState<string>(AVAILABLE_EXPIRIES[0]);
  const [theme, setTheme] = useState<'tablet' | 'dark'>('tablet');
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics' | 'strategy' | 'greeks' | 'positions'>('matrix');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const config = INDEX_CONFIGS[symbol];
  const [spotPrice, setSpotPrice] = useState<number>(config.spotPrice);
  const [rows, setRows] = useState<StrikeRow[]>(() =>
    generateOptionChain(symbol, config.spotPrice, expiry)
  );

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };


  // Strategy Builder State
  const [strategyLegs, setStrategyLegs] = useState<StrategyLeg[]>([]);

  // Paper Trading Positions State
  const [positions, setPositions] = useState<PaperTradePosition[]>([
    {
      id: 'pos-init-1',
      symbol: 'NIFTY',
      strike: 25200,
      type: 'CE',
      action: 'BUY',
      quantity: 50,
      entryPrice: 124.50,
      currentPrice: 132.80,
      pnl: 415.00,
      timestamp: '09:21:14',
    },
  ]);

  // Trade Modal State
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    strike: number;
    optionType: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    price: number;
  }>({
    isOpen: false,
    strike: 25200,
    optionType: 'CE',
    action: 'BUY',
    price: 130,
  });

  // Re-generate option chain when symbol or expiry changes
  useEffect(() => {
    const newConfig = INDEX_CONFIGS[symbol];
    setSpotPrice(newConfig.spotPrice);
    setRows(generateOptionChain(symbol, newConfig.spotPrice, expiry));
  }, [symbol, expiry]);

  // Live Market Tick Interval (Simulates real Indian exchange updates every 1.5s)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setRows((prevRows) => {
        const { updatedRows, newSpotPrice } = simulateMarketTick(prevRows, spotPrice, symbol, expiry);
        setSpotPrice(newSpotPrice);
        return updatedRows;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLive, spotPrice, symbol, expiry]);

  // Handlers
  const handleRefresh = () => {
    setRows(generateOptionChain(symbol, spotPrice, expiry));
  };

  const handleOpenTrade = (strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => {
    setTradeModal({
      isOpen: true,
      strike,
      optionType: type,
      action,
      price,
    });
  };

  const handleAddToStrategy = (strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => {
    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}`,
      symbol,
      expiry,
      strike,
      type,
      action,
      lots: 1,
      lotSize: config.lotSize,
      price,
      iv: 13.5,
      greeks: { delta: 0.5, gamma: 0.001, theta: -12, vega: 14, rho: 0.5 },
    };
    setStrategyLegs((prev) => [...prev, newLeg]);
    setActiveTab('strategy');
  };

  const handleExecuteTrade = (newPosition: PaperTradePosition) => {
    setPositions((prev) => [newPosition, ...prev]);
  };

  // Calculate live portfolio PnL for mobile BottomNav badge
  const totalPositionsPnL = positions.reduce((acc, pos) => {
    const row = rows.find((r) => r.strikePrice === pos.strike);
    let liveLTP = pos.currentPrice;
    if (row) {
      liveLTP = pos.type === 'CE' ? row.call.ltp : row.put.ltp;
    }
    const mult = pos.action === 'BUY' ? 1 : -1;
    return acc + (liveLTP - pos.entryPrice) * pos.quantity * mult;
  }, 0);

  return (
    <div className={`min-h-[100dvh] flex flex-col font-sans transition-colors duration-150 select-none ${
      theme === 'tablet'
        ? 'bg-slate-100 text-slate-900'
        : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 1. Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        setIsLive={setIsLive}
        theme={theme}
        setTheme={setTheme}
        positionsCount={positions.length}
        onRefresh={handleRefresh}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        symbol={symbol}
        spotPrice={spotPrice}
        spotChange={config.change}
      />

      {/* 2. Market Metrics Ticker Banner */}
      <MarketMetricsBanner
        config={config}
        spotPrice={spotPrice}
        rows={rows}
        theme={theme}
      />

      {/* 3. Main Workspace Area */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-1.5 sm:px-4 py-2 sm:py-3 pb-20 md:pb-6">
        {activeTab === 'matrix' && (
          <OptionChainTable
            rows={rows}
            spotPrice={spotPrice}
            symbol={symbol}
            setSymbol={setSymbol}
            expiry={expiry}
            setExpiry={setExpiry}
            theme={theme}
            onTradeSelect={handleOpenTrade}
            onAddToStrategy={handleAddToStrategy}
          />
        )}

        {activeTab === 'analytics' && (
          <OIAnalyticsChart
            rows={rows}
            spotPrice={spotPrice}
            symbol={symbol}
            theme={theme}
          />
        )}

        {activeTab === 'strategy' && (
          <StrategyBuilder
            symbol={symbol}
            config={config}
            spotPrice={spotPrice}
            rows={rows}
            expiry={expiry}
            theme={theme}
            legs={strategyLegs}
            setLegs={setStrategyLegs}
          />
        )}

        {activeTab === 'greeks' && (
          <GreeksSimulator
            symbol={symbol}
            config={config}
            spotPrice={spotPrice}
            rows={rows}
            theme={theme}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsManager
            positions={positions}
            setPositions={setPositions}
            rows={rows}
            theme={theme}
          />
        )}
      </main>

      {/* 4. Desktop Footer */}
      <footer className={`hidden md:block w-full border-t py-2.5 px-4 text-center text-xs transition-colors ${
        theme === 'tablet'
          ? 'bg-slate-200/70 border-slate-300 text-slate-600'
          : 'bg-slate-950 border-slate-800 text-slate-500'
      }`}>
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-300">OptiChain Terminal</span>
            <span className="text-slate-400">·</span>
            <span>Real-time NSE Index & Equity Derivatives Matrix</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>STRIKE RANGE: {config.strikeStep} pt intervals</span>
            <span>DATA SOURCE: NSE Live Simulated Feed</span>
            <span>EXPIRY: {expiry}</span>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Sticky Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        positionsCount={positions.length}
        totalPnL={totalPositionsPnL}
        theme={theme}
      />

      {/* Trade Execution Modal */}
      <TradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal((prev) => ({ ...prev, isOpen: false }))}
        symbol={symbol}
        config={config}
        strike={tradeModal.strike}
        optionType={tradeModal.optionType}
        action={tradeModal.action}
        price={tradeModal.price}
        theme={theme}
        onExecuteTrade={handleExecuteTrade}
      />
    </div>
  );
}
