"use client";
import { useEffect, useState } from "react";
import { Activity, FlaskConical, LayoutDashboard, LineChart, Radio, ShieldAlert } from "lucide-react";
import { fmtClock } from "../lib/format";
import { useTerminal, View } from "../lib/store";
import { cn } from "../lib/cn";
import { api } from "../lib/api";

const TABS: { id: View; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "lab", label: "Strategy Lab", icon: FlaskConical },
  { id: "backtest", label: "Backtest", icon: LineChart },
];

export function TopBar() {
  const { view, setView, connected, wsLive, panicArmed, armPanic, disarmPanic, pushEvent } = useTerminal();
  const [clock, setClock] = useState(fmtClock());

  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const onPanic = async () => {
    if (!panicArmed) return armPanic();
    disarmPanic();
    try {
      await api.killAll();
      pushEvent({ id: `ev-${Date.now()}`, ts: Date.now(), severity: "risk", source: "risk", message: "PANIC EXECUTED — all bots killed, positions flattening" });
    } catch {
      pushEvent({ id: `ev-${Date.now()}`, ts: Date.now(), severity: "warn", source: "risk", message: "PANIC failed to reach risk engine" });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* brand */}
        <div className="flex items-center gap-2.5 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-up/15 border border-up/30">
            <Activity className="h-4 w-4 text-up" />
          </div>
          <div className="leading-none">
            <div className="font-mono text-[15px] font-bold tracking-tight text-zinc-100">
              BOT<span className="text-up">/</span>OS
            </div>
            <div className="text-[10px] text-zinc-500 tracking-widest">TERMINAL v1</div>
          </div>
        </div>

        {/* tabs */}
        <nav className="flex items-center gap-1 rounded-lg bg-panel2/70 border border-line/70 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-all",
                  active ? "bg-panel border border-line text-zinc-100 shadow-card" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* connection */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-panel2/70 px-3 py-1.5">
          <span className={cn("h-2 w-2 rounded-full", connected ? "bg-up animate-pulseDot" : "bg-down")} />
          <span className="font-mono text-[11px] font-semibold tracking-wide text-zinc-300">
            {connected ? (wsLive ? "LIVE" : "POLLING") : "OFFLINE"}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Radio className="h-3 w-3" /> :8000
          </span>
        </div>

        <div className="hidden lg:block font-mono text-[12px] text-zinc-500 tabular">{clock}</div>

        {/* panic */}
        <button
          onClick={onPanic}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-bold tracking-wide transition-all",
            panicArmed
              ? "bg-down border-down text-white animate-pulse shadow-glow"
              : "bg-down/10 border-down/40 text-down hover:bg-down/20"
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          {panicArmed ? "CONFIRM FLATTEN" : "PANIC"}
        </button>
      </div>
    </header>
  );
}
