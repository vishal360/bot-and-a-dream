"use client";
import { useTerminal } from "../lib/store";
import { fmtPct, fmtSignedUSD, fmtUSD, pnlClass } from "../lib/format";
import { Metric, SectionTitle, Skeleton } from "./ui";
import { cn } from "../lib/cn";
import { TrendingDown, TrendingUp } from "lucide-react";

export function PortfolioHeader() {
  const { portfolio: p, loading } = useTerminal();

  if (loading || !p) {
    return (
      <section className="panel p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px]" />
          ))}
        </div>
      </section>
    );
  }

  const pnlToday = p.pnl_today ?? 0;
  const gross = p.gross_exposure ?? 0;
  const net = p.net_exposure ?? 0;
  const cash = p.cash ?? 0;
  const deployed = p.deployed ?? 0;
  const depPct = cash + deployed > 0 ? (deployed / (cash + deployed)) * 100 : 0;

  const Arrow = pnlToday >= 0 ? TrendingUp : TrendingDown;

  return (
    <section className="panel grid-bg p-4 animate-fadeUp">
      <SectionTitle
        right={
          <span className="font-mono text-[11px] text-zinc-500 tabular">
            AUM <span className="text-zinc-200 font-semibold">{fmtUSD(p.aum ?? 0, 0)}</span>
          </span>
        }
      >
        Portfolio
      </SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5">
        <div className="col-span-2 rounded-lg px-3 py-2.5 border border-line/60 bg-panel2/60">
          <div className="label mb-1">PnL Today</div>
          <div className={cn("flex items-center gap-2 font-mono text-[22px] font-bold tabular", pnlClass(pnlToday))}>
            <Arrow className="h-5 w-5" />
            {fmtSignedUSD(pnlToday)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 font-mono tabular">
            WTD <span className={pnlClass(p.pnl_wtd ?? 0)}>{fmtSignedUSD(p.pnl_wtd ?? 0)}</span>
            {"  ·  "}MTD <span className={pnlClass(p.pnl_mtd ?? 0)}>{fmtSignedUSD(p.pnl_mtd ?? 0)}</span>
          </div>
        </div>

        <Metric label="Gross Exposure" value={`${fmtPct(gross, 1).replace("+", "")}`} sub={`Net ${fmtPct(net, 1)}`} tone={gross > 300 ? "warn" : "neutral"} />
        <Metric label="Deployed" value={fmtUSD(deployed, 0)} sub={
          <span className="block mt-1.5 h-1.5 rounded-full bg-ink overflow-hidden">
            <span className="block h-full rounded-full bg-up/80" style={{ width: `${Math.min(100, depPct)}%` }} />
          </span>
        } />
        <Metric label="Cash" value={fmtUSD(cash, 0)} />
        <Metric label="Sharpe" value={(p.sharpe ?? 0).toFixed(2)} tone={(p.sharpe ?? 0) >= 1 ? "up" : (p.sharpe ?? 0) < 0 ? "down" : "neutral"} />
        <Metric label="Max Drawdown" value={fmtPct(p.max_dd ?? 0)} tone="down" />
        <Metric label="VaR 95%" value={fmtUSD(p.var95 ?? 0, 0)} tone="warn" />
      </div>
    </section>
  );
}
