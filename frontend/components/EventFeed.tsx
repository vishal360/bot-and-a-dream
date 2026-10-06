"use client";
import { AlertTriangle, ArrowLeftRight, Info, ShieldAlert } from "lucide-react";
import { FeedEvent } from "../lib/api";
import { fmtTime } from "../lib/format";
import { useTerminal } from "../lib/store";
import { cn } from "../lib/cn";
import { SectionTitle } from "./ui";

const sev = {
  info: { icon: Info, cls: "text-info border-info/25 bg-info/10" },
  trade: { icon: ArrowLeftRight, cls: "text-up border-up/25 bg-up/10" },
  warn: { icon: AlertTriangle, cls: "text-warn border-warn/25 bg-warn/10" },
  risk: { icon: ShieldAlert, cls: "text-down border-down/25 bg-down/10" },
} as const;

export function EventFeed() {
  const { events } = useTerminal();
  return (
    <section className="panel p-4 h-full flex flex-col min-h-[420px]">
      <SectionTitle right={<span className="font-mono text-[10px] text-zinc-600">{events.length} events</span>}>
        Event feed
      </SectionTitle>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {events.length === 0 && (
          <div className="text-[12px] text-zinc-600 text-center py-8">Waiting for events…</div>
        )}
        {events.map((e: FeedEvent) => {
          const s = sev[e.severity] ?? sev.info;
          const Icon = s.icon;
          return (
            <div key={e.id} className={cn("flex items-start gap-2.5 rounded-lg border px-2.5 py-2 animate-fadeUp", s.cls)}>
              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] leading-snug text-zinc-200">{e.message}</div>
                <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                  {fmtTime(e.ts)} · {e.source}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
