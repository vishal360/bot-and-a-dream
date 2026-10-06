# BOT TERMINAL — Hedge-Fund Trading OS

> Futures → Arb → Delta-Neutral → Funding Farm. Lighter DEX (testnet) first, zero-fee ≠ zero-cost. Every tick accounts for spread / slippage / funding.

```
Portfolio Header → Bot Grid (live) → Bot Drawer (equity/drawdown/trades) → Strategy Lab → Backtest Terminal → Risk + Kill
```

## Quick Start

```bash
# 1. env
cp .env.example .env   # paste LIGHTER_API_KEY, LIGHTER_TESTNET=true

# 2. run (backend + frontend + postgres + redis)
docker compose up --build

# frontend  http://localhost:3000
# api       http://localhost:8000/docs
# ws        ws://localhost:8000/ws/stream
```

Without Docker:

```bash
# backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
# frontend
cd frontend && npm install && npm run dev
```

## What You Get (V1)

- **Hedge-fund dark terminal** — zinc-950, emerald/red, mono, dense. Bloomberg-inspired, not Robinhood-cute.
- **4 bots live-simulated** via WebSocket when Lighter testnet is unreachable — identical contract as real bots.
- **Immutable trade ledger** (Postgres) + **TCA** (spread 3bp + slippage 2bp + funding every 8h) injected on paper fills.
- **Risk Engine** (skfolio-ready) — VaR, daily loss limit, max leverage, global kill.
- **Strategy Lab** — drop Python inheriting `BaseStrategy` → validate → register → backtest → promote to paper.
- **Backtest Terminal** — Nautilus-backed engine, cost-aware, equity vs benchmark.

## Security

- `LIGHTER_API_KEY` lives only in `.env` (gitignored). Never commit. Rotate immediately if you pasted it in chat.
- All paper fills go through `services/tca.py` — prevents fantasy PnL.

## Structure

```
backend/app/routers/{bots,strategies,backtest,risk,market}
backend/app/services/{lighter_client,nautilus_engine,risk_engine,order_manager,tca,strategy_registry}
backend/strategies/{base,futures_ema_kronos}
frontend/app/{page,strategy-lab,backtest}
```

## Trading

- Venue: **Lighter DEX** (perp futures, zero trading fee). Paper trading for weeks.
- Testnet: `LIGHTER_TESTNET=true` + `LIGHTER_API_KEY` + `LIGHTER_ACCOUNT_INDEX` (default 0).
- Stocks removed per your call — pure perps. Add Alpaca adapter later trivially via same `BaseStrategy(venue=...)`.

## Strategy Guide

See `STRATEGY_GUIDE.md` — the 20-line contract. And `ARCHITECTURE.md` for the full OS diagram.

## Tests

```bash
cd backend && pytest -q
cd frontend && npm test
```

© 2026 — built to be "holy shit, that's done."
