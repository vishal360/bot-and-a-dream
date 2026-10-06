import { create } from "zustand";
import { api, BotSummary, FeedEvent, PortfolioMetrics, wsUrl } from "./api";

export type View = "dashboard" | "lab" | "backtest";

interface TerminalState {
  view: View;
  bots: BotSummary[];
  portfolio: PortfolioMetrics | null;
  events: FeedEvent[];
  connected: boolean;
  wsLive: boolean;
  loading: boolean;
  error: string | null;
  selectedBot: string | null;
  panicArmed: boolean;
  setView: (v: View) => void;
  setSelectedBot: (id: string | null) => void;
  armPanic: () => void;
  disarmPanic: () => void;
  refresh: () => Promise<void>;
  pushEvent: (e: FeedEvent) => void;
}

let evCounter = 0;
const mkEvent = (severity: FeedEvent["severity"], source: string, message: string): FeedEvent => ({
  id: `ev-${Date.now()}-${evCounter++}`,
  ts: Date.now(),
  severity,
  source,
  message,
});

export const useTerminal = create<TerminalState>((set, get) => ({
  view: "dashboard",
  bots: [],
  portfolio: null,
  events: [],
  connected: false,
  wsLive: false,
  loading: true,
  error: null,
  selectedBot: null,
  panicArmed: false,
  setView: (view) => set({ view }),
  setSelectedBot: (selectedBot) => set({ selectedBot }),
  armPanic: () => {
    set({ panicArmed: true });
    get().pushEvent(mkEvent("risk", "risk", "PANIC armed — confirm within 4s to flatten everything"));
    setTimeout(() => set({ panicArmed: false }), 4000);
  },
  disarmPanic: () => set({ panicArmed: false }),
  pushEvent: (e) => set((s) => ({ events: [e, ...s.events].slice(0, 120) })),

  refresh: async () => {
    try {
      const [bots, portfolio] = await Promise.all([
        api.bots().catch(() => [] as BotSummary[]),
        api.portfolio().catch(() => null),
      ]);
      const prev = get().bots;
      const events: FeedEvent[] = [];
      // detect status flips → feed
      for (const b of bots) {
        const p = prev.find((x) => x.id === b.id);
        if (p && p.status !== b.status) {
          events.push(
            mkEvent(
              b.status === "killed" ? "risk" : "warn",
              b.id,
              `${b.name || b.id}: ${p.status} → ${b.status}`
            )
          );
        }
        if (b.risk_flag && (!p || p.risk_flag !== b.risk_flag)) {
          events.push(mkEvent("risk", b.id, `RISK FLAG: ${b.risk_flag}`));
        }
      }
      set({
        bots,
        portfolio,
        connected: true,
        loading: false,
        error: null,
        events: [...events, ...get().events].slice(0, 120),
      });
    } catch (err) {
      set({ connected: false, loading: false, error: String(err) });
    }
  },
}));

/** Live loop: try socket.io WS, fall back to polling. */
export function startLiveLoop() {
  const { refresh, pushEvent } = useTerminal.getState();
  let wsOk = false;

  const poll = () => {
    if (!wsOk) refresh();
  };
  refresh();
  const pollId = setInterval(poll, 2500);

  (async () => {
    try {
      const { io } = await import("socket.io-client");
      const socket = io(wsUrl(), { transports: ["websocket"], reconnection: true });
      socket.on("connect", () => {
        wsOk = true;
        useTerminal.setState({ wsLive: true, connected: true });
        pushEvent(mkEvent("info", "stream", "Live stream connected"));
      });
      socket.on("disconnect", () => {
        wsOk = false;
        useTerminal.setState({ wsLive: false });
      });
      socket.on("tick", (msg: unknown) => {
        const m = msg as { bots?: BotSummary[]; portfolio?: PortfolioMetrics; event?: FeedEvent };
        useTerminal.setState((s) => ({
          bots: m.bots ?? s.bots,
          portfolio: m.portfolio ?? s.portfolio,
          events: m.event ? [m.event, ...s.events].slice(0, 120) : s.events,
          connected: true,
        }));
      });
      socket.on("event", (e: FeedEvent) => pushEvent(e));
    } catch {
      /* polling fallback already running */
    }
  })();

  return () => clearInterval(pollId);
}
