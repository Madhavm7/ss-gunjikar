/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Moon, 
  Sun, 
  Play, 
  Pause, 
  RefreshCw, 
  BarChart3, 
  Layers, 
  Calculator, 
  Briefcase, 
  Maximize, 
  Minimize,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Smartphone
} from 'lucide-react';
import { IndexSymbol } from '../types/options';
import { AppLogoDP } from './AppLogoDP';
import { APKInstallModal } from './APKInstallModal';

interface HeaderProps {
  activeTab: 'matrix' | 'analytics' | 'strategy' | 'greeks' | 'positions';
  setActiveTab: (tab: 'matrix' | 'analytics' | 'strategy' | 'greeks' | 'positions') => void;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  theme: 'tablet' | 'dark';
  setTheme: (theme: 'tablet' | 'dark') => void;
  positionsCount: number;
  onRefresh: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  symbol: IndexSymbol;
  spotPrice: number;
  spotChange: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isLive,
  setIsLive,
  theme,
  setTheme,
  positionsCount,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
  symbol,
  spotPrice,
  spotChange,
}) => {
  const [showDPModal, setShowDPModal] = useState<boolean>(false);
  const [showAPKModal, setShowAPKModal] = useState<boolean>(false);
  const isPositive = spotChange >= 0;

  return (
    <header className={`w-full border-b sticky top-0 z-30 transition-colors duration-150 backdrop-blur-md safe-pt ${
      theme === 'tablet' 
        ? 'bg-slate-100/95 border-slate-300 text-slate-800' 
        : 'bg-slate-950/95 border-slate-800 text-slate-100'
    }`}>
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Wordmark & Attractive App DP */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AppLogoDP
            size="sm"
            onClick={() => setShowDPModal(true)}
            className="hover:scale-105 active:scale-95 transition-transform"
          />
          <div>
            <div 
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => setShowDPModal(true)}
              title="Click to view App DP"
            >
              <span className="text-sm sm:text-base font-bold tracking-tight whitespace-nowrap group-hover:text-indigo-500 transition-colors">
                OptiChain
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded hidden sm:inline-block ${
                theme === 'tablet' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
              }`}>
                NSE Live
              </span>
            </div>
            {/* Mobile Spot Ticker Subtitle */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono md:hidden leading-none mt-0.5">
              <span className="font-bold text-slate-900 dark:text-slate-100">{symbol}</span>
              <span>₹{spotPrice.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
              <span className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositive ? '+' : ''}{spotChange.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Hidden on mobile, uses BottomNav) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'matrix'
                ? theme === 'tablet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : theme === 'tablet'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Option Chain Matrix
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? theme === 'tablet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : theme === 'tablet'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            OI Distribution Chart
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'strategy'
                ? theme === 'tablet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : theme === 'tablet'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Strategy Payoff
          </button>

          <button
            onClick={() => setActiveTab('greeks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'greeks'
                ? theme === 'tablet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : theme === 'tablet'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Greeks Lab
          </button>

          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'positions'
                ? theme === 'tablet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : theme === 'tablet'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Paper Positions
            {positionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-mono">
                {positionsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Live Market Controls, Fullscreen & Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Ticks Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause live market ticks" : "Resume live market ticks"}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              isLive
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20'
            }`}
          >
            {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span className="hidden sm:inline">{isLive ? 'Live Ticking' : 'Ticks Paused'}</span>
            <span className="sm:hidden">{isLive ? 'Live' : 'Off'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Mobile Fullscreen Terminal"}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              isFullscreen
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                : theme === 'tablet'
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Exit Full</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>

          {/* APK Install Button */}
          <button
            onClick={() => setShowAPKModal(true)}
            title="Install Android APK / WebAPK"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-mono">APK</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Manual refresh prices"
            className={`p-1.5 rounded-md border transition-colors ${
              theme === 'tablet'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'tablet' ? 'dark' : 'tablet')}
            title={theme === 'tablet' ? "Switch to Pro Dark Matrix" : "Switch to Slate Tablet Theme"}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 text-xs font-medium rounded-md border transition-colors ${
              theme === 'tablet'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {theme === 'tablet' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* App DP & Profile Showcase Modal */}
      {showDPModal && (
        <div 
          onClick={() => setShowDPModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl relative overflow-hidden transition-all ${
              theme === 'tablet'
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setShowDPModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Hero DP Display */}
            <div className="my-3 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 opacity-70 blur-xl animate-pulse" />
                <img
                  src="/app-dp.svg"
                  alt="OptiChain Pro DP"
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 relative z-10 rounded-2xl shadow-2xl ring-2 ring-white/30 object-contain hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* Title & Branding */}
            <h3 className="text-xl font-extrabold tracking-tight mt-3 text-slate-900 dark:text-slate-100">
              OptiChain Pro
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold font-mono mt-0.5 tracking-wide">
              NSE Live Derivatives Terminal
            </p>
            <p className="text-xs text-slate-500 mt-2 px-1 leading-relaxed">
              Real-time options matrix terminal with live Greeks, PCR, Max Pain, and tick-by-tick paper execution.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-medium text-left">
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Simulated NSE Ticks</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mobile Fullscreen PWA</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Black-Scholes Greeks</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>OI Buildup Analytics</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <a
                href="/app-dp.svg"
                download="optichain_dp.svg"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Save DP</span>
              </a>
              <button
                onClick={() => setShowDPModal(false)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  theme === 'tablet' ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android APK & PWA Installation Modal */}
      <APKInstallModal
        isOpen={showAPKModal}
        onClose={() => setShowAPKModal(false)}
        theme={theme}
      />
    </header>
  );
};
