/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptionGreeks } from '../types/options';

// Cumulative normal distribution function
export function cdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// Probability density function of standard normal distribution
export function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculates option price and Greeks using Black-Scholes formula
 * @param S Current Spot Price
 * @param K Strike Price
 * @param T Time to expiry in years (e.g., 5/365)
 * @param r Risk-free interest rate (e.g. 0.07 for 7%)
 * @param v Implied Volatility (e.g. 0.14 for 14%)
 * @param isCall boolean true for Call, false for Put
 */
export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number = 0.068,
  v: number = 0.14,
  isCall: boolean = true
): { price: number; greeks: OptionGreeks } {
  // Edge-case safeguard
  const time = Math.max(T, 0.0001);
  const sigma = Math.max(v, 0.01);
  const sqrtT = Math.sqrt(time);

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * time) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const nd1 = cdf(d1);
  const nd2 = cdf(d2);
  const n_minus_d1 = cdf(-d1);
  const n_minus_d2 = cdf(-d2);
  const pdfD1 = pdf(d1);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  const discount = Math.exp(-r * time);

  if (isCall) {
    price = S * nd1 - K * discount * nd2;
    delta = nd1;
    // Theta in points per calendar day
    theta = (- (S * pdfD1 * sigma) / (2 * sqrtT) - r * K * discount * nd2) / 365;
    rho = (K * time * discount * nd2) / 100;
  } else {
    price = K * discount * n_minus_d2 - S * n_minus_d1;
    delta = nd1 - 1;
    theta = (- (S * pdfD1 * sigma) / (2 * sqrtT) + r * K * discount * n_minus_d2) / 365;
    rho = (-K * time * discount * n_minus_d2) / 100;
  }

  // Gamma and Vega are identical for Calls and Puts
  const gamma = pdfD1 / (S * sigma * sqrtT);
  // Vega per 1% change in volatility
  const vega = (S * sqrtT * pdfD1) / 100;

  return {
    price: Math.max(price, 0.05),
    greeks: {
      delta: Number(delta.toFixed(3)),
      gamma: Number(gamma.toFixed(5)),
      theta: Number(theta.toFixed(2)),
      vega: Number(vega.toFixed(2)),
      rho: Number(rho.toFixed(2)),
    },
  };
}

/**
 * Determine Buildup from price change and OI change
 */
export function determineBuildup(priceChange: number, oiChange: number): 'Long Buildup' | 'Short Buildup' | 'Long Unwinding' | 'Short Covering' {
  if (priceChange >= 0 && oiChange >= 0) return 'Long Buildup';
  if (priceChange < 0 && oiChange >= 0) return 'Short Buildup';
  if (priceChange < 0 && oiChange < 0) return 'Long Unwinding';
  return 'Short Covering';
}
