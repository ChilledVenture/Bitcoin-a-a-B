"use client";
import React, { useMemo, useState, useEffect } from "react";

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const toNumber = (raw) => {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[$,%\s,]/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};
const fmtCurrency = (n, ccy) => n.toLocaleString(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 0 });
const pctOptions = Array.from({ length: 17 }, (_, i) => i * 5);
const currencyOptions = ["USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CHF", "NZD", "SGD"];

export default function App() {
  const [btcCount, setBtcCount] = useState(1);
  const [pricePerBTC, setPricePerBTC] = useState(110000);
  const [growthPct, setGrowthPct] = useState(30);
  const [drawdownPct, setDrawdownPct] = useState(10);
  const [ccy, setCcy] = useState("USD");

  useEffect(() => {
    let cancelled = false;

    const getPrice = async () => {
      try {
        const vs = ccy.toLowerCase();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${vs}`);
        const data = await res.json();
        const p = Number(data?.bitcoin?.[vs]);
        if (!cancelled && Number.isFinite(p)) {
          setPricePerBTC(p);
        }
      } catch {}
    };

    getPrice();
    const id = setInterval(getPrice, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ccy]);

  const startBalance = useMemo(() => toNumber(btcCount) * toNumber(pricePerBTC), [btcCount, pricePerBTC]);

  const rows = useMemo(() => {
    const g = clamp(toNumber(growthPct), 0, 200) / 100;
    const d = clamp(toNumber(drawdownPct), 0, 100) / 100;
    const results = [];
    let balance = startBalance;

    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        results.push({ year, afterGrowth: balance, gain: 0, drawdown: 0, balance });
        continue;
      }
      const prev = balance;
      const gain = prev * g;
      const afterGrowth = prev + gain;
      const drawdown = gain * d;
      const newBalance = afterGrowth - drawdown;
      results.push({ year, afterGrowth, gain, drawdown, balance: newBalance });
      balance = newBalance;
    }
    return results;
  }, [startBalance, growthPct, drawdownPct]);

  return (
    <>
      <style>{`
        :root {
          --btc-orange: #F7931A;
          --btc-yellow: #ECA427;
          --ink: #0f172a;
          --muted: #64748b;
          --card: #ffffff;
          --line: #e2e8f0;
        }
        body { background: var(--card); color: var(--ink); }
        .card { background: var(--card); border: 1px solid var(--line); border-radius: 1rem; }
        .editable { background: linear-gradient(0deg, rgba(247,147,26,0.06), rgba(247,147,26,0.06)); border-color: rgba(247,147,26,0.25); }
        .editable input, .editable select { background: #fff; border-color: #e2e8f0; }
        .editable input:focus, .editable select:focus { outline: none; box-shadow: 0 0 0 2px rgba(247,147,26,0.45); border-color: var(--btc-orange); }
        input[type=number].no-spin::-webkit-outer-spin-button,
        input[type=number].no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number].no-spin { -moz-appearance: textfield; appearance: textfield; }
      `}</style>

      <div className="min-h-screen bg-white text-[var(--ink)] p-6">
        <div className="max-w-5xl mx-auto grid gap-6">
          <header className="flex items-end justify-between">
            <h1 className="text-2xl font-semibold text-[var(--btc-orange)]">BTC CAGR + Drawdown Planner</h1>
            <p className="italic text-sm text-[var(--muted)]">Only the orange fields are editable. Everything else auto-calculates.</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4 card editable">
              <label className="text-sm font-medium text-[var(--ink)]">BTC amount <span className="ml-1 text-[var(--muted)]">(manual entry)</span></label>
              <input
                type="number"
                inputMode="decimal"
                className="no-spin mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--btc-orange)]"
                value={btcCount}
                onChange={(e) => setBtcCount(toNumber(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>

            <div className="rounded-2xl p-4 card editable">
              <label className="text-sm font-medium text-[var(--ink)]">Price per BTC</label>
              <div className="mt-2 flex gap-3 items-center">
                <select
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--btc-orange)] cursor-pointer w-20 text-center"
                  value={ccy}
                  onChange={(e) => setCcy(e.target.value)}
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--btc-orange)] text-right w-32"
                  value={pricePerBTC}
                  onChange={(e) => setPricePerBTC(toNumber(e.target.value))}
                  min={0}
                  step={1}
                />
              </div>
            </div>

            <div className="rounded-2xl p-4 card editable">
              <label className="text-sm font-medium text-[var(--ink)]">Annual Growth</label>
              <select
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--btc-orange)]"
                value={growthPct}
                onChange={(e) => setGrowthPct(toNumber(e.target.value))}
              >
                {pctOptions.map((p) => (
                  <option key={p} value={p}>{p}%</option>
                ))}
              </select>
              <div className="text-xs text-[var(--muted)] mt-1 italic">Pull down up/down 5% increments (0%…80%)</div>
            </div>

            <div className="rounded-2xl p-4 card editable">
              <label className="text-sm font-medium text-[var(--ink)]">Annual Drawdown</label>
              <select
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--btc-orange)]"
                value={drawdownPct}
                onChange={(e) => setDrawdownPct(toNumber(e.target.value))}
              >
                {pctOptions.map((p) => (
                  <option key={p} value={p}>{p}%</option>
                ))}
              </select>
              <div className="text-xs text-[var(--muted)] mt-1 italic">Pull down up/down 5% increments (0%…80%)</div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-[var(--line)] shadow-sm p-4">
              <div className="text-sm text-[var(--muted)]">Starting Balance</div>
              <div className="text-xl font-semibold text-[var(--ink)]">{fmtCurrency(startBalance, ccy)}</div>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--line)] shadow-sm p-4">
              <div className="text-sm text-[var(--muted)]">Growth Rate</div>
              <div className="text-xl font-semibold text-[var(--ink)]">{growthPct}%</div>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--line)] shadow-sm p-4">
              <div className="text-sm text-[var(--muted)]">Annual Drawdown</div>
              <div className="text-xl font-semibold text-[var(--ink)]">{drawdownPct}%</div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[var(--line)] shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 bg-[var(--btc-orange)] px-4 py-3 text-sm font-semibold text-white">
              <div>Year</div>
              <div>After Growth</div>
              <div>Drawdown (of gain)</div>
              <div>Balance</div>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {rows.map((r) => (
                <div key={r.year} className="grid grid-cols-4 px-4 py-3 text-sm">
                  <div className="font-medium text-[var(--ink)]">Year {r.year}</div>
                  <div>{fmtCurrency(r.afterGrowth, ccy)}</div>
                  <div>{fmtCurrency(r.drawdown, ccy)}</div>
                  <div className="font-semibold text-[var(--ink)]">{fmtCurrency(r.balance, ccy)}</div>
                </div>
              ))}
            </div>
          </section>

          <footer className="text-xs text-[var(--muted)] italic border-t border-[var(--line)] pt-3">
            Notes: Growth is applied to prior year balance, then drawdown is taken as a percentage of the annual gain. Only orange fields are editable; others auto-calculate.
          </footer>
        </div>
      </div>
    </>
  );
}
