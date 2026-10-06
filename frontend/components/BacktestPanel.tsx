"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import { api, BacktestResult } from "../lib/api";
import { ActionButton, EmptyState, Metric, SectionTitle, Skeleton } from "./ui";
import { EquityChart, UnderwaterChart } from "./charts";
import { cn } from "../lib/cn";

const METRIC_LABELS: Record<string, string> = {
  sharpe: "Sharpe", sortino: "Sortino", max_dd: "Max DD %", profit_factor: "Profit factor",
  win_rate: "Win rate %", total_return: "Total return %", cagr: "CAGR %", var95: "VaR 95%",
  trades: "Trades", avg_win: "Avg win", avg_loss: "Avg loss", exposure: "Avg exposure %",
};

export function BacktestPanel() {
  const [strategy, setStrategy] = useState("futures_ema_kronos");
  const [symbol, setSymbol] = useState("BTC-PERP");
  const [days, setDays] = useState(90);
  const [capital, setCapital] = useState(100000);
  const [costs, setCosts] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await api.runBacktest({
        strategy_id: strategy, symbol, days, capital,
        costs: costs ? { spread_bps: 3, slippage_bps: 2, funding_bps_per_8h: 1 } : null,
      });
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const metrics = result?.metrics ?? {};

  return (
    <section className="space-y-3 animate-fadeUp">
      <div className="panel p-4">
        <SectionTitle>Backtest terminal</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 items-end">
          <label className="block">
            <span className="label">Strategy</span>
            <input value={strategy} onChange={(e) => setStrategy(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-up/50" />
          </label>
          <label className="block">
            <span className="label">Symbol</span>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-up/50" />
          </label>
          <label className="block">
            <span className="label">Days</span>
            <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-up/50" />
          </label>
          <label className="block">
            <span className="label">Capital $</span>
            <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-up/50" />
          </label>
          <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
            <button
              onClick={() => setCosts(!costs)}
              className={cn("relative h-5 w-9 rounded-full transition-colors", costs ? "bg-up/70" : "bg-panel2 border border-line")}
            >
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", costs ? "left-[18px]" : "left-0.5")} />
            </button>
            <span className="text-[12px] font-semibold text-zinc-300">Costs on</span>
          </label>
          <ActionButton tone="up" onClick={run} disabled={running} className="justify-center py-2">
            <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Run backtest"}
          </ActionButton>
        </div>
        {error && <div className="mt-3 rounded-lg border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">{error}</div>}
      </div>

      {running && (
        <div className="panel p-4 space-y-3">
          <Skeleton className="h-[220px]" />
          <div className="grid grid-cols-4 gap-2"><Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" /></div>
        </div>
      )}

      {result && !running && (
        <div className="space-y-3">
          <div className="panel p-4">
            <SectionTitle right={<span className="font-mono text-[11px] text-zinc-500">{strategy} · {symbol} · {days}d</span>}>
              Equity vs benchmark
            </SectionTitle>
            <EquityChart equity={result.equity} benchmark={result.benchmark} height={260} />
            {result.equity && (result as any).drawdown && (
              <div className="mt-2"><UnderwaterChart drawdown={(result as any).drawdown} height={90} /></div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {Object.entries(metrics).slice(0, 12).map(([k, v]) => (
              <Metric key={k} label={METRIC_LABELS[k] ?? k} value={typeof v === "number" ? v.toFixed(2) : String(v)}
                tone={k === "max_dd" ? "down" : k === "sharpe" && (v as number) >= 1 ? "up" : "neutral"} />
            ))}
          </div>
        </div>
      )}

      {!result && !running && (
        <div className="panel"><EmptyState title="No backtest yet" hint="Pick a strategy and hit Run. Costs (spread, slippage, funding) stay on by default so the numbers aren't fantasy." /></div>
      )}
    </section>
  );
}
