/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  X, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal
} from 'lucide-react';

interface APKInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'tablet' | 'dark';
}

export const APKInstallModal: React.FC<APKInstallModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'manual' | 'cli'>('quick');

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md safe-pb animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border p-5 sm:p-6 shadow-2xl relative transition-all ${
          theme === 'tablet'
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App DP */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 opacity-60 blur-md" />
            <img 
              src="/app-dp.svg" 
              alt="OptiChain APK Icon"
              referrerPolicy="no-referrer"
              className="w-14 h-14 relative z-10 rounded-xl shadow-lg ring-1 ring-white/20 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight">OptiChain Terminal</h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Android APK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct Android WebAPK & Mobile App Installation
            </p>
          </div>
        </div>

        {/* Tabs for Methods */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 mb-4 bg-slate-100/70 dark:bg-slate-950 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1-Tap Install</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Android Steps</span>
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'cli'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Build .APK</span>
          </button>
        </div>

        {/* Tab 1: 1-Tap WebAPK Prompt */}
        {activeTab === 'quick' && (
          <div className="space-y-3 text-xs">
            {isInstalled ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-bold text-sm">App Already Installed!</div>
                  <div className="text-[11px] mt-0.5 opacity-90">
                    OptiChain is running as a standalone Android app with full screen matrix view.
                  </div>
                </div>
              </div>
            ) : isInstallable ? (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border ${
                  theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Android WebAPK Engine Ready
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click the button below to generate and install the official Android APK directly to your phone's home screen.
                  </p>
                </div>

                <button
                  onClick={handleDirectInstall}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install OptiChain APK Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border ${
                  theme === 'tablet' ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/30 border-indigo-900/50'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    Open on your Android Phone
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Android builds native WebAPKs automatically when you open this link in <strong>Google Chrome</strong> on your phone.
                  </p>
                </div>

                {/* Copy App Link Box */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">
                    App URL to open on Android:
                  </div>
                  <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 font-mono text-[11px] ${
                    theme === 'tablet' ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {currentUrl}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Benefits Strip */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>No Play Store needed</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Zero Storage bloat</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Auto live updates</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>Full screen touch mode</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Android Chrome Steps */}
        {activeTab === 'manual' && (
          <div className="space-y-3 text-xs">
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                How to Install APK via Chrome on Android:
              </div>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open this URL in <strong>Google Chrome</strong> or <strong>Brave</strong> on your Android phone.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>
                    Android automatically compiles an official <strong>WebAPK</strong> and places the OptiChain icon directly on your home screen and app drawer!
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyUrl}
              className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Link to Phone'}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Build Standalone .APK File with CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-3 text-xs">
            <div className={`p-3.5 rounded-xl border ${
              theme === 'tablet' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1">
                Generate Signed .APK / .AAB with Bubblewrap CLI:
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Google's official tool generates standalone Android Studio APK projects directly from our PWA manifest:
              </p>

              <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[10px] text-emerald-400 space-y-1 overflow-x-auto">
                <div># 1. Install Google Bubblewrap CLI</div>
                <div className="text-white">npm install -g @bubblewrap/cli</div>
                <div className="pt-1"># 2. Initialize Android APK from this URL</div>
                <div className="text-white">bubblewrap init --manifest={window.location.origin}/manifest.json</div>
                <div className="pt-1"># 3. Build release .apk package</div>
                <div className="text-white">bubblewrap build</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Alternatively, submit this app link to <strong>PWABuilder.com</strong> to download an instant Android APK package ready for sideloading or Play Store release.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl border text-xs font-semibold transition-colors ${
              theme === 'tablet' 
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100' 
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
