/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexConfig, IndexSymbol, OptionData, StrikeRow } from '../types/options';
import { calculateBlackScholes, determineBuildup } from './blackScholes';

export const INDEX_CONFIGS: Record<IndexSymbol, IndexConfig> = {
  NIFTY: {
    symbol: 'NIFTY',
    name: 'NIFTY 50',
    spotPrice: 25178.15,
    change: 64.20,
    pChange: 0.26,
    strikeStep: 50,
    lotSize: 25,
    vix: 13.42,
    vixChange: -0.38,
  },
  BANKNIFTY: {
    symbol: 'BANKNIFTY',
    name: 'BANK NIFTY',
    spotPrice: 52430.50,
    change: -112.40,
    pChange: -0.21,
    strikeStep: 100,
    lotSize: 15,
    vix: 14.15,
    vixChange: 0.22,
  },
  FINNIFTY: {
    symbol: 'FINNIFTY',
    name: 'FIN NIFTY',
    spotPrice: 24285.20,
    change: 35.80,
    pChange: 0.15,
    strikeStep: 50,
    lotSize: 40,
    vix: 13.10,
    vixChange: -0.15,
  },
  SENSEX: {
    symbol: 'SENSEX',
    name: 'BSE SENSEX',
    spotPrice: 81340.75,
    change: 210.60,
    pChange: 0.26,
    strikeStep: 100,
    lotSize: 10,
    vix: 13.50,
    vixChange: -0.28,
  },
  MIDCPNIFTY: {
    symbol: 'MIDCPNIFTY',
    name: 'MIDCAP NIFTY',
    spotPrice: 12850.40,
    change: 48.90,
    pChange: 0.38,
    strikeStep: 25,
    lotSize: 75,
    vix: 15.20,
    vixChange: -0.45,
  },
};

export const AVAILABLE_EXPIRIES: string[] = [
  '29 OCT 2026',
  '05 NOV 2026',
  '12 NOV 2026',
  '19 NOV 2026',
  '26 NOV 2026 (Monthly)',
  '31 DEC 2026 (Quarterly)',
];

/**
 * Get days to expiry based on selected expiry date string
 */
export function getDaysToExpiry(expiryStr: string): number {
  if (expiryStr.includes('29 OCT')) return 6;
  if (expiryStr.includes('05 NOV')) return 13;
  if (expiryStr.includes('12 NOV')) return 20;
  if (expiryStr.includes('19 NOV')) return 27;
  if (expiryStr.includes('26 NOV')) return 34;
  return 69;
}

/**
 * Generates initial realistic option chain data around the spot price
 */
export function generateOptionChain(
  symbol: IndexSymbol,
  spotPrice: number,
  expiry: string
): StrikeRow[] {
  const config = INDEX_CONFIGS[symbol];
  const step = config.strikeStep;
  const dte = getDaysToExpiry(expiry);
  const T = dte / 365;
  const r = 0.068;
  const baseIV = config.vix / 100;

  // Round spot to closest strike step for ATM
  const atmStrike = Math.round(spotPrice / step) * step;

  // Generate strikes: 25 strikes below ATM to 25 strikes above ATM (51 strikes total)
  const strikeCountEachSide = 25;
  const strikes: number[] = [];
  for (let i = -strikeCountEachSide; i <= strikeCountEachSide; i++) {
    strikes.push(atmStrike + i * step);
  }

  // Pre-seed pseudo-realistic distribution with peak OI at resistance & support
  const maxCallOIStrike = atmStrike + step * 6; // Resistance, e.g. 25,450 / 25,500
  const maxPutOIStrike = atmStrike - step * 4;  // Support, e.g. 25,000

  const rows: StrikeRow[] = strikes.map((strike) => {
    const distFromATM = (strike - atmStrike) / step;
    
    // IV smile: slightly higher IV for OTM puts (skew) and far OTM calls
    const ivCall = baseIV + Math.max(0, (strike - spotPrice) / spotPrice) * 0.15 + (Math.abs(distFromATM) * 0.002);
    const ivPut = baseIV + Math.max(0, (spotPrice - strike) / spotPrice) * 0.28 + (Math.abs(distFromATM) * 0.002);

    const callBS = calculateBlackScholes(spotPrice, strike, T, r, ivCall, true);
    const putBS = calculateBlackScholes(spotPrice, strike, T, r, ivPut, false);

    // Call OI curve (higher on OTM calls above ATM)
    let callOIWeight = Math.exp(-Math.pow(strike - maxCallOIStrike, 2) / (2 * Math.pow(step * 4, 2)));
    callOIWeight = Math.max(0.08, callOIWeight + 0.15 * Math.exp(-Math.pow(distFromATM, 2) / 8));
    const callOI = Math.round((callOIWeight * 14500000 + 450000 + (Math.sin(strike) * 150000)) / config.lotSize) * config.lotSize;

    // Put OI curve (higher on OTM puts below ATM)
    let putOIWeight = Math.exp(-Math.pow(strike - maxPutOIStrike, 2) / (2 * Math.pow(step * 4, 2)));
    putOIWeight = Math.max(0.08, putOIWeight + 0.18 * Math.exp(-Math.pow(distFromATM, 2) / 8));
    const putOI = Math.round((putOIWeight * 16200000 + 520000 + (Math.cos(strike) * 180000)) / config.lotSize) * config.lotSize;

    // Daily OI change
    const callOIChange = Math.round((Math.sin(distFromATM * 0.8) * 850000 + (distFromATM > 0 ? 320000 : -210000)) / config.lotSize) * config.lotSize;
    const putOIChange = Math.round((Math.cos(distFromATM * 0.8) * 920000 + (distFromATM < 0 ? 410000 : -180000)) / config.lotSize) * config.lotSize;

    // Volume proportional to OI & proximity to ATM
    const proximity = Math.exp(-Math.pow(distFromATM, 2) / 14);
    const callVolume = Math.round((proximity * 28000000 + callOI * 0.65) / config.lotSize) * config.lotSize;
    const putVolume = Math.round((proximity * 31000000 + putOI * 0.72) / config.lotSize) * config.lotSize;

    const callPriceChange = Number((callBS.price * (config.change > 0 ? 0.08 : -0.06)).toFixed(2));
    const putPriceChange = Number((putBS.price * (config.change > 0 ? -0.07 : 0.09)).toFixed(2));

    const callData: OptionData = {
      ltp: Number(callBS.price.toFixed(2)),
      change: callPriceChange,
      pChange: Number(((callPriceChange / Math.max(1, callBS.price - callPriceChange)) * 100).toFixed(2)),
      oi: callOI,
      oiChange: callOIChange,
      oiPChange: Number(((callOIChange / Math.max(1, callOI - callOIChange)) * 100).toFixed(1)),
      volume: callVolume,
      iv: Number((ivCall * 100).toFixed(2)),
      greeks: callBS.greeks,
      buildup: determineBuildup(callPriceChange, callOIChange),
      bidPrice: Number((callBS.price * 0.998).toFixed(2)),
      askPrice: Number((callBS.price * 1.002).toFixed(2)),
      bidQty: Math.round(config.lotSize * (5 + Math.floor(Math.random() * 20))),
      askQty: Math.round(config.lotSize * (5 + Math.floor(Math.random() * 20))),
    };

    const putData: OptionData = {
      ltp: Number(putBS.price.toFixed(2)),
      change: putPriceChange,
      pChange: Number(((putPriceChange / Math.max(1, putBS.price - putPriceChange)) * 100).toFixed(2)),
      oi: putOI,
      oiChange: putOIChange,
      oiPChange: Number(((putOIChange / Math.max(1, putOI - putOIChange)) * 100).toFixed(1)),
      volume: putVolume,
      iv: Number((ivPut * 100).toFixed(2)),
      greeks: putBS.greeks,
      buildup: determineBuildup(putPriceChange, putOIChange),
      bidPrice: Number((putBS.price * 0.998).toFixed(2)),
      askPrice: Number((putBS.price * 1.002).toFixed(2)),
      bidQty: Math.round(config.lotSize * (5 + Math.floor(Math.random() * 20))),
      askQty: Math.round(config.lotSize * (5 + Math.floor(Math.random() * 20))),
    };

    return {
      strikePrice: strike,
      isATM: strike === atmStrike,
      isCallITM: strike < spotPrice,
      isPutITM: strike > spotPrice,
      isMaxCallOI: false, // Calculated after
      isMaxPutOI: false,  // Calculated after
      isMaxPain: false,   // Calculated after
      call: callData,
      put: putData,
    };
  });

  // Calculate Max Call OI and Max Put OI
  let maxCallOI = -1;
  let maxCallStrike = rows[0]?.strikePrice;
  let maxPutOI = -1;
  let maxPutStrike = rows[0]?.strikePrice;

  rows.forEach((r) => {
    if (r.call.oi > maxCallOI) {
      maxCallOI = r.call.oi;
      maxCallStrike = r.strikePrice;
    }
    if (r.put.oi > maxPutOI) {
      maxPutOI = r.put.oi;
      maxPutStrike = r.strikePrice;
    }
  });

  // Calculate Max Pain (strike with minimal cumulative writer loss)
  let minTotalLoss = Infinity;
  let maxPainStrike = atmStrike;

  rows.forEach((targetRow) => {
    const targetStrike = targetRow.strikePrice;
    let totalLoss = 0;

    rows.forEach((item) => {
      // Call writer loss if spot finishes at targetStrike
      if (targetStrike > item.strikePrice) {
        totalLoss += (targetStrike - item.strikePrice) * item.call.oi;
      }
      // Put writer loss if spot finishes at targetStrike
      if (targetStrike < item.strikePrice) {
        totalLoss += (item.strikePrice - targetStrike) * item.put.oi;
      }
    });

    if (totalLoss < minTotalLoss) {
      minTotalLoss = totalLoss;
      maxPainStrike = targetStrike;
    }
  });

  // Mark flags on rows
  rows.forEach((r) => {
    r.isMaxCallOI = r.strikePrice === maxCallStrike;
    r.isMaxPutOI = r.strikePrice === maxPutStrike;
    r.isMaxPain = r.strikePrice === maxPainStrike;
  });

  return rows;
}

/**
 * Simulate live market price tick
 */
export function simulateMarketTick(
  currentRows: StrikeRow[],
  spotPrice: number,
  symbol: IndexSymbol,
  expiry: string
): { updatedRows: StrikeRow[]; newSpotPrice: number; spotDelta: number } {
  const config = INDEX_CONFIGS[symbol];
  // Small random walk tick for spot: -0.04% to +0.04%
  const pctDelta = (Math.random() - 0.49) * 0.0006;
  const spotDelta = Number((spotPrice * pctDelta).toFixed(2));
  const newSpotPrice = Number((spotPrice + spotDelta).toFixed(2));

  const step = config.strikeStep;
  const atmStrike = Math.round(newSpotPrice / step) * step;
  const dte = getDaysToExpiry(expiry);
  const T = dte / 365;
  const r = 0.068;

  const updatedRows = currentRows.map((row) => {
    const isATM = row.strikePrice === atmStrike;
    const isCallITM = row.strikePrice < newSpotPrice;
    const isPutITM = row.strikePrice > newSpotPrice;

    // Small fluctuation in call and put prices
    const callBS = calculateBlackScholes(newSpotPrice, row.strikePrice, T, r, row.call.iv / 100, true);
    const putBS = calculateBlackScholes(newSpotPrice, row.strikePrice, T, r, row.put.iv / 100, false);

    // Minor OI and Volume tick
    const oiFluctCall = Math.random() > 0.6 ? (Math.random() > 0.4 ? 1 : -1) * config.lotSize * Math.floor(Math.random() * 4) : 0;
    const oiFluctPut = Math.random() > 0.6 ? (Math.random() > 0.4 ? 1 : -1) * config.lotSize * Math.floor(Math.random() * 4) : 0;

    const newCallOI = Math.max(config.lotSize, row.call.oi + oiFluctCall);
    const newPutOI = Math.max(config.lotSize, row.put.oi + oiFluctPut);

    const callChange = Number((callBS.price - (row.call.ltp - row.call.change)).toFixed(2));
    const putChange = Number((putBS.price - (row.put.ltp - row.put.change)).toFixed(2));

    const callPChange = Number(((callChange / Math.max(1, callBS.price - callChange)) * 100).toFixed(2));
    const putPChange = Number(((putChange / Math.max(1, putBS.price - putChange)) * 100).toFixed(2));

    const callOIChange = row.call.oiChange + oiFluctCall;
    const putOIChange = row.put.oiChange + oiFluctPut;

    return {
      ...row,
      isATM,
      isCallITM,
      isPutITM,
      call: {
        ...row.call,
        ltp: Number(callBS.price.toFixed(2)),
        change: callChange,
        pChange: callPChange,
        oi: newCallOI,
        oiChange: callOIChange,
        volume: row.call.volume + (Math.random() > 0.5 ? config.lotSize * Math.floor(Math.random() * 8) : 0),
        greeks: callBS.greeks,
        buildup: determineBuildup(callChange, callOIChange),
        bidPrice: Number((callBS.price * 0.999).toFixed(2)),
        askPrice: Number((callBS.price * 1.001).toFixed(2)),
      },
      put: {
        ...row.put,
        ltp: Number(putBS.price.toFixed(2)),
        change: putChange,
        pChange: putPChange,
        oi: newPutOI,
        oiChange: putOIChange,
        volume: row.put.volume + (Math.random() > 0.5 ? config.lotSize * Math.floor(Math.random() * 8) : 0),
        greeks: putBS.greeks,
        buildup: determineBuildup(putChange, putOIChange),
        bidPrice: Number((putBS.price * 0.999).toFixed(2)),
        askPrice: Number((putBS.price * 1.001).toFixed(2)),
      },
    };
  });

  return { updatedRows, newSpotPrice, spotDelta };
}

/**
 * Helper to format Indian currency figures into Cr / L / K
 */
export function formatIndianNumber(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}${abs.toLocaleString('en-IN')}`;
}
