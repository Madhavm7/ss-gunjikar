/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, BarChart3, Layers, Calculator, Briefcase } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'matrix' | 'analytics' | 'strategy' | 'greeks' | 'positions';
  setActiveTab: (tab: 'matrix' | 'analytics' | 'strategy' | 'greeks' | 'positions') => void;
  positionsCount: number;
  totalPnL?: number;
  theme: 'tablet' | 'dark';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  positionsCount,
  totalPnL = 0,
  theme,
}) => {
  const tabs = [
    {
      id: 'matrix' as const,
      label: 'Chain',
      icon: Activity,
    },
    {
      id: 'analytics' as const,
      label: 'OI Chart',
      icon: BarChart3,
    },
    {
      id: 'strategy' as const,
      label: 'Strategy',
      icon: Layers,
    },
    {
      id: 'greeks' as const,
      label: 'Greeks',
      icon: Calculator,
    },
    {
      id: 'positions' as const,
      label: 'Positions',
      icon: Briefcase,
      badge: positionsCount > 0 ? positionsCount : null,
      sublabel: positionsCount > 0 ? `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(0)}` : null,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-lg transition-colors safe-pb ${
        theme === 'tablet'
          ? 'bg-white/95 border-slate-300 text-slate-700 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          : 'bg-slate-950/95 border-slate-800/90 text-slate-300 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full py-1 transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold font-mono bg-indigo-600 text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-0.5 tracking-tight line-clamp-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
