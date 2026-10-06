"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { startLiveLoop, useTerminal } from "../lib/store";
import { TopBar } from "../components/TopBar";
import { PortfolioHeader } from "../components/PortfolioHeader";
import { BotGrid } from "../components/BotCard";
import { BotDrawer } from "../components/BotDrawer";
import { EventFeed } from "../components/EventFeed";
import { StrategyLab } from "../components/StrategyLab";
import { BacktestPanel } from "../components/BacktestPanel";
import { SectionTitle } from "../components/ui";

export default function Terminal() {
  const { view, error, connected } = useTerminal();

  useEffect(() => {
    const stop = startLiveLoop();
    return stop;
  }, []);

  return (
    <div className="min-h-screen bg-ink text-zinc-200">
      <TopBar />

      <main className="mx-auto max-w-[1720px] px-4 py-4 space-y-4">
        {error && !connected && (
          <div className="flex items-center gap-2.5 rounded-xl border border-down/30 bg-down/10 px-4 py-3 text-[13px] text-down">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Backend unreachable at <span className="font-mono">localhost:8000</span> — start it with <span className="font-mono">uvicorn app.main:app --reload</span> or set <span className="font-mono">NEXT_PUBLIC_API_URL</span>.</span>
          </div>
        )}

        {view === "dashboard" && (
          <>
            <PortfolioHeader />
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-3 space-y-3">
                <SectionTitle right={<span className="font-mono text-[10px] text-zinc-600">click a bot for detail</span>}>
                  Bots
                </SectionTitle>
                <BotGrid />
              </div>
              <div className="xl:col-span-1">
                <EventFeed />
              </div>
            </div>
          </>
        )}

        {view === "lab" && <StrategyLab />}
        {view === "backtest" && <BacktestPanel />}
      </main>

      <BotDrawer />
    </div>
  );
}
