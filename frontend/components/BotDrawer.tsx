"use client";
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Skull, X } from "lucide-react";
import { api, BotMetrics, BotSummary, TradeRow } from "../lib/api";
import { fmtPct, fmtSignedUSD, fmtUSD, fmtUptime, pnlClass } from "../lib/format";
import { useTerminal } from "../lib/store";
import { cn } from "../lib/cn";
import { EquityChart, UnderwaterChart } from "./charts";
import { ActionButton, Badge, EmptyState, Metric, Skeleton } from "./ui";

export function BotDrawer() {
  const { selectedBot, setSelectedBot, bots, refresh, pushEvent } = useTerminal();
  const bot: BotSummary | undefined = bots.find((b) => b.id === selectedBot);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [tab, setTab] = useState<"overview" | "trades" | "logs">("overview");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMetrics(null);
    setTab("overview");
    if (!selectedBot) return;
    api.botMetrics(selectedBot).then(setMetrics).catch(() => setMetrics(null));
  }, [selectedBot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedBot(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedBot]);

  if (!selectedBot || !bot) return null;

  const action = async (a: "pause" | "resume" | "kill" | "restart") => {
    setBusy(true);
    try {
      await api.botAction(bot.id, a);
      pushEvent({ id: `ev-${Date.now()}`, ts: Date.now(), severity: a === "kill" ? "risk" : "info", source: bot.id, message: `${bot.name || bot.id} → ${a}` });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const m = metrics;
  const trades: TradeRow[] = m?.trades ?? [];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setSelectedBot(null)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-line bg-ink animate-slideIn flex flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className={cn("h-2.5 w-2.5 rounded-full", bot.status === "running" ? "bg-up animate-pulseDot" : "bg-zinc-500")} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[15px] font-bold text-zinc-100 truncate">{bot.name || bot.id}</div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {[bot.venue, bot.timeframe, bot.uptime_sec != null ? `up ${fmtUptime(bot.uptime_sec)}` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
          <Badge tone={bot.status === "running" ? "up" : bot.status === "paused" ? "warn" : "down"}>{bot.status.toUpperCase()}</Badge>
          <button onClick={() => setSelectedBot(null)} className="rounded-lg border border-line p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* controls */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          {bot.status === "running" ? (
            <ActionButton tone="warn" onClick={() => action("pause")} disabled={busy}><Pause className="h-3.5 w-3.5" /> Pause</ActionButton>
          ) : (
            <ActionButton tone="up" onClick={() => action("resume")} disabled={busy}><Play className="h-3.5 w-3.5" /> Resume</ActionButton>
          )}
          <ActionButton onClick={() => action("restart")} disabled={busy}><RotateCcw className="h-3.5 w-3.5" /> Restart</ActionButton>
          <ActionButton tone="danger" onClick={() => action("kill")} disabled={busy}><Skull className="h-3.5 w-3.5" /> Kill</ActionButton>
          <div className="flex-1" />
          <div className={cn("font-mono text-[20px] font-bold tabular", pnlClass(bot.pnl ?? 0))}>{fmtSignedUSD(bot.pnl ?? 0)}</div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b border-line px-5 pt-2">
          {(["overview", "trades", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-2 text-[12px] font-semibold capitalize border-b-2 -mb-px transition-colors",
                tab === t ? "border-up text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              {t}{t === "trades" && trades.length > 0 && <span className="ml-1.5 rounded-full bg-panel2 px-1.5 py-0.5 font-mono text-[10px]">{trades.length}</span>}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "overview" && (
            <>
              {!m ? (
                <div className="space-y-3">
                  <Skeleton className="h-[220px]" />
                  <div className="grid grid-cols-3 gap-2"><Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" /></div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeUp">
                  <div>
                    <div className="label mb-2">Equity vs benchmark</div>
                    <div className="panel p-2"><EquityChart equity={m.equity} benchmark={m.benchmark} /></div>
                  </div>
                  <div>
                    <div className="label mb-2">Underwater</div>
                    <div className="panel p-2"><UnderwaterChart drawdown={m.drawdown} height={100} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Metric label="Sharpe" value={(m.sharpe ?? 0).toFixed(2)} tone={(m.sharpe ?? 0) >= 1 ? "up" : "neutral"} />
                    <Metric label="Sortino" value={(m.sortino ?? 0).toFixed(2)} />
                    <Metric label="Max DD" value={fmtPct(m.max_dd ?? 0)} tone="down" />
                    <Metric label="VaR 95%" value={fmtUSD(m.var95 ?? 0, 0)} tone="warn" />
                    <Metric label="Profit factor" value={(m.profit_factor ?? bot.profit_factor ?? 0).toFixed(2)} />
                    <Metric label="Win rate" value={`${((m.win_rate ?? bot.win_rate ?? 0)).toFixed(0)}%`} />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "trades" && (
            trades.length === 0 ? (
              <EmptyState title="No trades yet" hint="Closed trades will appear here with slippage and funding breakdown." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-panel2 text-left">
                      {["Side", "Symbol", "Qty", "Entry", "Exit", "PnL", "Slip", "Funding"].map((h) => (
                        <th key={h} className="px-2.5 py-2 font-semibold text-zinc-500 text-[10.5px] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular">
                    {trades.map((t, i) => (
                      <tr key={i} className="border-t border-line/60 hover:bg-panel2/50 transition-colors">
                        <td className={cn("px-2.5 py-2 font-sans font-semibold", t.side === "long" || t.side === "buy" ? "text-up" : "text-down")}>
                          {(t.side ?? "—").toString().toUpperCase()}
                        </td>
                        <td className="px-2.5 py-2 text-zinc-300">{String(t.symbol ?? "—")}</td>
                        <td className="px-2.5 py-2 text-zinc-400">{String(t.qty ?? "—")}</td>
                        <td className="px-2.5 py-2 text-zinc-400">{t.entry != null ? fmtUSD(Number(t.entry)) : "—"}</td>
                        <td className="px-2.5 py-2 text-zinc-400">{t.exit != null ? fmtUSD(Number(t.exit)) : "—"}</td>
                        <td className={cn("px-2.5 py-2 font-semibold", pnlClass(Number(t.pnl ?? 0)))}>{t.pnl != null ? fmtSignedUSD(Number(t.pnl)) : "—"}</td>
                        <td className="px-2.5 py-2 text-zinc-500">{t.slippage_bps != null ? `${Number(t.slippage_bps).toFixed(1)}bp` : "—"}</td>
                        <td className="px-2.5 py-2 text-zinc-500">{t.funding != null ? fmtSignedUSD(Number(t.funding)) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "logs" && (
            <EmptyState title="Log stream" hint="Wire the backend log endpoint to stream this bot's stdout here." />
          )}
        </div>
      </aside>
    </div>
  );
}
