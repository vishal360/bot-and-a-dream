import React from "react";
import { cn } from "../lib/cn";

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="label">{children}</h2>
      {right}
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  tone = "neutral",
  flash,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "neutral" | "up" | "down" | "warn";
  flash?: "up" | "down" | null;
}) {
  const tones: Record<string, string> = {
    neutral: "text-zinc-100",
    up: "text-up",
    down: "text-down",
    warn: "text-warn",
  };
  return (
    <div
      className={cn("rounded-lg px-3 py-2.5 bg-panel2/60 border border-line/60", flash && (flash === "up" ? "animate-flashUp" : "animate-flashDown"))}
      key={String(value)}
    >
      <div className="label mb-1">{label}</div>
      <div className={cn("font-mono text-[19px] font-semibold tabular leading-none", tones[tone])}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-zinc-500">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "up" | "down" | "warn" | "info";
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
    up: "bg-up/10 text-up border-up/25",
    down: "bg-down/10 text-down border-down/25",
    warn: "bg-warn/10 text-warn border-warn/25",
    info: "bg-info/10 text-info border-info/25",
  };
  const dotColor: Record<string, string> = {
    neutral: "bg-zinc-400",
    up: "bg-up",
    down: "bg-down",
    warn: "bg-warn",
    info: "bg-info",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide", tones[tone])}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone], tone === "up" && "animate-pulseDot")} />}
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  tone = "neutral",
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "up" | "down" | "warn" | "danger" | "info";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-panel2 border-line text-zinc-200 hover:border-zinc-500",
    up: "bg-up/10 border-up/30 text-up hover:bg-up/20",
    down: "bg-down/10 border-down/30 text-down hover:bg-down/20",
    warn: "bg-warn/10 border-warn/30 text-warn hover:bg-warn/20",
    danger: "bg-down border-down/60 text-white hover:bg-down/80",
    info: "bg-info/10 border-info/30 text-info hover:bg-info/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        tones[tone],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-panel2", className)} />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-sm font-semibold text-zinc-400">{title}</div>
      {hint && <div className="mt-1 text-xs text-zinc-600 max-w-xs">{hint}</div>}
    </div>
  );
}
