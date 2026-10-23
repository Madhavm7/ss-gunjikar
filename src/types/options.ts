/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'MIDCPNIFTY';

export type BuildupType = 'Long Buildup' | 'Short Buildup' | 'Long Unwinding' | 'Short Covering';

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionData {
  ltp: number;
  change: number;
  pChange: number;
  oi: number;
  oiChange: number;
  oiPChange: number;
  volume: number;
  iv: number;
  greeks: OptionGreeks;
  buildup: BuildupType;
  bidPrice: number;
  askPrice: number;
  bidQty: number;
  askQty: number;
}

export interface StrikeRow {
  strikePrice: number;
  isATM: boolean;
  isCallITM: boolean;
  isPutITM: boolean;
  isMaxCallOI: boolean;
  isMaxPutOI: boolean;
  isMaxPain: boolean;
  call: OptionData;
  put: OptionData;
}

export interface IndexConfig {
  symbol: IndexSymbol;
  name: string;
  spotPrice: number;
  change: number;
  pChange: number;
  strikeStep: number;
  lotSize: number;
  vix: number;
  vixChange: number;
}

export interface StrategyLeg {
  id: string;
  symbol: IndexSymbol;
  expiry: string;
  strike: number;
  type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  lots: number;
  lotSize: number;
  price: number;
  iv: number;
  greeks: OptionGreeks;
}

export interface PaperTradePosition {
  id: string;
  symbol: IndexSymbol;
  strike: number;
  type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  timestamp: string;
}
