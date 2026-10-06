"use client";
import { AlertTriangle, Pause, Play } from "lucide-react";
import { BotSummary } from "../lib/api";
import { fmtPct, fmtSignedUSD, fmtUptime, pnlClass } from "../lib/format";
import { Sparkline } from "./charts";
import { Badge } from "./ui";
import { cn } from "../lib/cn";
import { useTerminal } from "../lib/store";

const statusTone: Record<string, "up" | "warn" | "down" | "neutral"> = {
  running: "up",
  paused: "warn",
  killed: "down",
};

export function BotCard({ bot }: { bot: BotSummary }) {
  const { setSelectedBot } = useTerminal();
  const tone = statusTone[bot.status] ?? "neutral";
  const winRate = bot.win_rate ?? (bot.trades_won != null && bot.trades_lost != null && bot.trades_won + bot.trades_lost > 0
    ? (bot.trades_won / (bot.trades_won + bot.trades_lost)) * 100
    : 0);
  const trades = (bot.trades_won ?? 0) + (bot.trades_lost ?? 0);
  const spark = bot.sparkline ?? bot.equity ?? [];

  return (
    <button
      onClick={() => setSelectedBot(bot.id)}
      className="panel panel-hover p-4 text-left animate-fadeUp w-full"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full shrink-0", bot.status === "running" ? "bg-up animate-pulseDot" : tone === "warn" ? "bg-warn" : tone === "down" ? "bg-down" : "bg-zinc-500")} />
            <span className="font-mono text-[13px] font-bold text-zinc-100 truncate">{bot.name || bot.id}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500 font-mono">
            {[bot.venue, bot.timeframe].filter(Boolean).join(" · ") || bot.id}
          </div>
        </div>
        <Badge tone={tone} dot={bot.status === "running"}>{bot.status.toUpperCase()}</Badge>
      </div>

      {bot.risk_flag && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-[11px] font-semibold text-warn">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{bot.risk_flag}</span>
        </div>
      )}

      {/* pnl + sparkline */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="label mb-0.5">Net PnL</div>
          <div className={cn("font-mono text-[21px] font-bold tabular leading-none", pnlClass(bot.pnl ?? 0))}>
            {fmtSignedUSD(bot.pnl ?? 0)}
          </div>
          {bot.pnl_pct != null && (
            <div className={cn("mt-1 font-mono text-[11px] tabular", pnlClass(bot.pnl_pct))}>{fmtPct(bot.pnl_pct)}</div>
          )}
        </div>
        <Sparkline data={spark} width={112} height={40} />
      </div>

      {/* stats */}
      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line/70 pt-3">
        {[
          { l: "Win rate", v: `${winRate.toFixed(0)}%` },
          { l: "Trades", v: String(trades) },
          { l: "PF", v: (bot.profit_factor ?? 0).toFixed(2) },
          { l: "Uptime", v: bot.uptime_sec != null ? fmtUptime(bot.uptime_sec) : "—" },
        ].map((s) => (
          <div key={s.l}>
            <div className="text-[9.5px] uppercase tracking-wider text-zinc-600 font-semibold">{s.l}</div>
            <div className="font-mono text-[12px] text-zinc-300 tabular">{s.v}</div>
          </div>
        ))}
      </div>
    </button>
  );
}

export function BotGrid() {
  const { bots, loading } = useTerminal();
  if (loading) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {bots.map((b) => (
        <BotCard key={b.id} bot={b} />
      ))}
    </div>
  );
}

export function QuickControls({ bot }: { bot: BotSummary }) {
  const { refresh } = useTerminal();
  const act = async (a: "pause" | "resume") => {
    const { api } = await import("../lib/api");
    await api.botAction(bot.id, a).catch(() => {});
    refresh();
  };
  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {bot.status === "running" ? (
        <button onClick={() => act("pause")} className="rounded-md border border-line p-1.5 text-zinc-400 hover:text-warn hover:border-warn/40 transition-colors" title="Pause">
          <Pause className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button onClick={() => act("resume")} className="rounded-md border border-line p-1.5 text-zinc-400 hover:text-up hover:border-up/40 transition-colors" title="Resume">
          <Play className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
