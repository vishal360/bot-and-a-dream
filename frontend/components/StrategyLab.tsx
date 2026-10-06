"use client";
import { useState } from "react";
import { CheckCircle2, FlaskConical, Rocket, ScanSearch, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { ActionButton, EmptyState, SectionTitle } from "./ui";
import { cn } from "../lib/cn";
import { useTerminal } from "../lib/store";

const STARTER = `from strategies.base import BaseStrategy, Bar

class MyStrategy(BaseStrategy):
    id = "my-strategy"
    assets = ["BTC-PERP"]
    venue = "lighter"
    timeframe = "5m"
    min_warmup_bars = 50

    def on_bar(self, bar: Bar):
        # your logic here — emit orders via self.buy / self.sell
        pass

    def on_fill(self, fill):
        pass
`;

type Step = "edit" | "validated" | "backtested";

export function StrategyLab() {
  const [code, setCode] = useState(STARTER);
  const [step, setStep] = useState<Step>("edit");
  const [report, setReport] = useState<{ ok: boolean; errors?: string[]; warnings?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const { pushEvent } = useTerminal();

  const validate = async () => {
    setBusy(true);
    try {
      const r = await api.validateStrategy(code);
      setReport(r);
      setStep("validated");
      pushEvent({ id: `ev-${Date.now()}`, ts: Date.now(), severity: r.ok ? "info" : "warn", source: "lab", message: r.ok ? "Strategy passed AST validation" : `Validation failed: ${r.errors?.length ?? 0} errors` });
    } catch (e) {
      setReport({ ok: false, errors: [String(e)] });
    } finally {
      setBusy(false);
    }
  };

  const promote = async () => {
    setBusy(true);
    try {
      await api.uploadStrategy({ code });
      pushEvent({ id: `ev-${Date.now()}`, ts: Date.now(), severity: "trade", source: "lab", message: "Strategy promoted to registry — paper trading" });
    } finally {
      setBusy(false);
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: "edit", label: "1 · Write" },
    { id: "validated", label: "2 · Validate" },
    { id: "backtested", label: "3 · Backtest & promote" },
  ];

  return (
    <section className="grid grid-cols-1 xl:grid-cols-5 gap-3 animate-fadeUp">
      <div className="xl:col-span-3 panel p-4">
        <SectionTitle
          right={
            <div className="flex gap-1">
              {steps.map((s) => (
                <span key={s.id} className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-semibold",
                  step === s.id ? "bg-up/15 text-up border border-up/30" : "text-zinc-600 border border-transparent")}>
                  {s.label}
                </span>
              ))}
            </div>
          }
        >
          Strategy Lab
        </SectionTitle>

        <div className="overflow-hidden rounded-lg border border-line bg-[#0b0c0e]">
          <div className="flex items-center gap-1.5 border-b border-line/70 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-down/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-up/70" />
            <span className="ml-2 font-mono text-[11px] text-zinc-500">strategy.py — sandboxed</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => { setCode(e.target.value); setStep("edit"); setReport(null); }}
            spellCheck={false}
            className="h-[380px] w-full resize-y bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-zinc-200 outline-none tab-4"
            style={{ tabSize: 4 }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ActionButton tone="info" onClick={validate} disabled={busy}>
            <ScanSearch className="h-3.5 w-3.5" /> Validate
          </ActionButton>
          <ActionButton tone="up" onClick={promote} disabled={busy || !(report?.ok)}>
            <Rocket className="h-3.5 w-3.5" /> Promote to paper
          </ActionButton>
          <span className="text-[11px] text-zinc-600">AST-checked · forbidden imports blocked · versioned registry</span>
        </div>
      </div>

      <div className="xl:col-span-2 panel p-4">
        <SectionTitle>Validation report</SectionTitle>
        {!report ? (
          <EmptyState title="Nothing to check yet" hint="Write or paste a strategy, then hit Validate. The sandbox checks the BaseStrategy contract and blocks os, subprocess, eval, network and file access." />
        ) : (
          <div className="space-y-2 animate-fadeUp">
            <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold",
              report.ok ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down")}>
              {report.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {report.ok ? "Passed — safe to backtest" : "Failed validation"}
            </div>
            {(report.errors ?? []).map((e, i) => (
              <div key={i} className="rounded-lg border border-down/25 bg-down/5 px-3 py-2 font-mono text-[11.5px] text-down/90">{e}</div>
            ))}
            {(report.warnings ?? []).map((w, i) => (
              <div key={i} className="rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 font-mono text-[11.5px] text-warn/90">{w}</div>
            ))}
            {report.ok && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel2/60 px-3 py-2.5 text-[12px] text-zinc-400">
                <FlaskConical className="h-4 w-4 text-info" />
                Next: run it in the Backtest tab with costs on, then promote.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
