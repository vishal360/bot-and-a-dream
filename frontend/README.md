# BOT/OS Terminal — redesigned frontend

Drop-in replacement for the `frontend/` directory of
[bot-and-a-dream](https://github.com/vishal360/bot-and-a-dream).

## What changed (the redesign)

**Visual system**
- Real dark-terminal palette: layered panels (`#101114` over `#08090b`) with 1px borders and inset highlights instead of flat black boxes.
- Typography: Inter for UI, JetBrains Mono with tabular numerals for every number — prices and PnL no longer jitter as digits change.
- One color language everywhere: emerald = profit/live, rose = loss/risk, amber = warning, blue = info. Status is readable at a glance.

**Terminal chrome**
- Sticky top bar: brand, view tabs (Dashboard / Strategy Lab / Backtest), live connection pill (LIVE / POLLING / OFFLINE), clock, and a two-step **PANIC** button (click to arm, 4s to confirm flatten-all).
- The kill switch is always one click away, not buried in a drawer.

**Dashboard**
- Portfolio header: hero PnL-today block with WTD/MTD, gross vs net exposure, deployed-capital bar, Sharpe / MaxDD / VaR95%.
- Bot cards: live pulsing dot, risk-flag banner, net PnL + SVG sparkline, win rate / trades / profit factor / uptime grid, hover lift. Click opens the detail drawer.
- Bot drawer: pause / resume / restart / kill, equity-vs-benchmark chart, underwater chart, Sharpe/Sortino/MaxDD/VaR/PF/win-rate grid, trade log table with slippage + funding columns, Esc to close.
- Right rail: live event feed with severity colors (info / trade / warn / risk), auto-capped at 120 events. Bot status flips and risk flags are pushed into it automatically.

**Strategy Lab**
- Editor styled like a real IDE (traffic lights, mono, dark), 3-step pipeline indicator: Write → Validate → Backtest & promote.
- Validation report panel shows pass/fail with per-error lines; Promote is disabled until validation passes.

**Backtest terminal**
- Strategy / symbol / days / capital / costs-toggle form, skeleton loading state, equity-vs-benchmark + underwater charts, 12-metric grid. Costs default ON.

**Data**
- `lib/api.ts` typed client for every backend route (`/bots`, `/risk`, `/strategies`, `/backtest`, `/market`).
- `lib/store.ts` zustand store: tries socket.io on `/ws/stream`, falls back to 2.5s polling automatically. No dead UI if the WS endpoint isn't up.

## Run it

```bash
cd frontend            # copy these files over your existing frontend/
npm install
npm run dev            # → http://localhost:3000
```

Backend must be up on `:8000`, or set `NEXT_PUBLIC_API_URL`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Notes

- Charts use Recharts for equity/underwater, hand-rolled SVG for card sparklines (cheap, no lib overhead per card).
- If an endpoint shape differs from `lib/api.ts`, the UI degrades to empty states rather than crashing — check the browser console.
