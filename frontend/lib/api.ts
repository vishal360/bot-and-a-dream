export interface BotSummary {
  id: string;
  name?: string;
  venue?: string;
  timeframe?: string;
  status: "running" | "paused" | "killed" | string;
  pnl: number;
  pnl_pct?: number;
  uptime_sec?: number;
  trades_won?: number;
  trades_lost?: number;
  win_rate?: number;
  profit_factor?: number;
  avg_hold_sec?: number;
  exposure?: number;
  risk_flag?: string | null;
  sparkline?: number[];
  equity?: number[];
}

export interface BotMetrics {
  equity: number[];
  benchmark?: number[];
  drawdown: number[];
  trades: TradeRow[];
  sharpe: number;
  sortino: number;
  max_dd: number;
  var95: number;
  profit_factor?: number;
  win_rate?: number;
}

export interface TradeRow {
  id?: string;
  symbol?: string;
  side?: string;
  entry?: number;
  exit?: number;
  qty?: number;
  pnl?: number;
  slippage_bps?: number;
  funding?: number;
  opened_at?: number | string;
  closed_at?: number | string;
  [k: string]: unknown;
}

export interface PortfolioMetrics {
  aum?: number;
  pnl_today?: number;
  pnl_wtd?: number;
  pnl_mtd?: number;
  gross_exposure?: number;
  net_exposure?: number;
  cash?: number;
  deployed?: number;
  sharpe?: number;
  max_dd?: number;
  var95?: number;
  [k: string]: unknown;
}

export interface StrategyRecord {
  id: string;
  name?: string;
  status?: string;
  version?: number;
  [k: string]: unknown;
}

export interface BacktestResult {
  equity: number[];
  benchmark?: number[];
  metrics: Record<string, number>;
  trades?: TradeRow[];
  [k: string]: unknown;
}

export interface FeedEvent {
  id: string;
  ts: number;
  severity: "info" | "warn" | "risk" | "trade";
  source: string;
  message: string;
}

const API = () =>
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<{ status: string }>("/health"),
  bots: () => req<BotSummary[]>("/bots"),
  bot: (id: string) => req<BotSummary>(`/bots/${id}`),
  botMetrics: (id: string) => req<BotMetrics>(`/bots/${id}/metrics`),
  botAction: (id: string, action: "pause" | "resume" | "kill" | "restart") =>
    req(`/bots/${id}/${action}`, { method: "POST" }),
  portfolio: () => req<PortfolioMetrics>("/risk/portfolio"),
  riskLimits: () => req<Record<string, unknown>>("/risk/limits"),
  killAll: () => req("/risk/kill", { method: "POST" }),
  resetRisk: () => req("/risk/reset", { method: "POST" }),
  strategies: () => req<StrategyRecord[]>("/strategies"),
  validateStrategy: (code: string) =>
    req<{ ok: boolean; errors?: string[]; warnings?: string[] }>("/strategies/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  uploadStrategy: (payload: Record<string, unknown>) =>
    req("/strategies/from-code", { method: "POST", body: JSON.stringify(payload) }),
  promoteStrategy: (id: string) =>
    req(`/strategies/${id}/promote`, { method: "POST" }),
  runBacktest: (payload: Record<string, unknown>) =>
    req<BacktestResult>("/backtest/run", { method: "POST", body: JSON.stringify(payload) }),
  marketHealth: () => req("/market/health"),
};

export const wsUrl = () =>
  `${API().replace(/^http/, "ws")}/ws/stream`;
