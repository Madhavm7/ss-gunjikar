/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppLogoDPProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AppLogoDP: React.FC<AppLogoDPProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none group ${className}`}
      title="OptiChain Pro Terminal"
    >
      {/* Outer ambient glow */}
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-300" />
      )}

      {/* Main Image Avatar */}
      <img
        src="/app-dp.svg"
        alt="OptiChain App DP"
        referrerPolicy="no-referrer"
        className={`${sizeMap[size]} relative z-10 rounded-xl object-contain shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200`}
      />

      {/* Online indicator dot */}
      <span className="absolute -top-0.5 -right-0.5 z-20 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-slate-900" />
      </span>
    </div>
  );
};
