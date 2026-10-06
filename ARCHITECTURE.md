# ARCHITECTURE — Bot Operating System

## Principle
Not a dashboard for bots. A **Router + Ledger + Risk + Kill** and the dashboard is the viewport.
Every bot, strategy, and venue speaks one contract.

## Layers

```
┌─────────────────────────────────────────────────┐
│ LAYER 4: HEDGE FUND TERMINAL (Next.js 14)       │
│ Portfolio Bar | Bot Grid | Drawer | Lab | BT    │
└──────────────────────┬──────────────────────────┘
                       │ REST + WS
┌──────────────────────▼──────────────────────────┐
│ LAYER 3: ORCHESTRATION API (FastAPI)            │
│ /bots /strategies /backtest /risk /market /ws   │
│ StrategyRegistry | RiskEngine(skfolio) | OrderMgr│
│ TCA (spread/slippage/funding) | Ledger(PG) | Redis Bus │
└──────────────────────┬──────────────────────────┘
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼─────┐ ┌─────▼───────┐ ┌───▼────┐
│ Nautilus     │ │ Data/Exec   │ │ Alpha  │
│ Engine (Rust │ │ Lighter DEX │ │ Kronos │
│ + Python)    │ │ WS+REST     │ │ (opt)  │
│ Futures/Arb/ │ │ Testnet papr│ │ TA     │
│ Delta/Fund   │ │ TCA on fills│ │        │
└──────────────┘ └─────────────┘ └────────┘
        │                │
   ┌────▼────┐      ┌────▼────┐
   │Postgres │      │ Redis   │
   │(ledger) │      │ (bus)   │
   └─────────┘      └─────────┘
```

## Data Flow
1. `LighterClient` subscribes to orderbook/trades → normalizes to `Bar/Tick` → Nautilus `DataEngine`
2. `Strategy.on_bar(bar)` → `OrderManager.submit()` → `RiskEngine.check()` → `LighterClient.place_order()` (paper: TCA-adjusted fill)
3. Fill → `Ledger` (immutable) → `Redis publish` → `WS /ws/stream` → Terminal grid/sparkline/drawer
4. `RiskEngine` evaluates VaR/daily loss/leverage → auto-pause + alert → `Global Kill` flattens all if needed.

## Contracts

### BaseStrategy (backend/strategies/base.py)
```python
class BaseStrategy(Strategy):
    id: str
    assets: list[str]
    venue: str = "LIGHTER"
    def on_bar(self, bar: Bar): ...
    def on_fill(self, fill): ...
    def get_metrics(self) -> dict: ...
```
Upload: `POST /strategies/upload` → ast-validate → dry-run backtest → registry.

### Lighter Adapter
`backend/app/services/lighter_client.py`
- Auth: `LIGHTER_API_KEY` + account index, testnet vs mainnet via `LIGHTER_API_URL`
- Methods: `get_markets()`, `subscribe_orderbook(market)`, `place_order(...)`, `cancel_all()`, `get_positions()`
- Paper mode: when `LIGHTER_TESTNET=true` and key invalid/unreachable, falls back to **paper sim** with same interface — zero code change to switch live.

### Risk Engine (backend/app/services/risk_engine.py)
- Uses `skfolio` for VaR/CVaR, portfolio Sharpe, optimization. Fallback pure-numpy if not installed.
- Per-bot: `max_daily_loss_pct`, `max_leverage`, `max_position_notional`, `max_drawdown`
- Portfolio: `max_gross_exposure`, `max_net_exposure`, `correlation_limit`, `var_limit`
- `check_order(order, portfolio_state) -> (allow, reason)` — every order gates through it.
- `POST /risk/kill` — `OrderManager.cancel_all + close_all_positions` globally.

### TCA (backend/app/services/tca.py)
Even though Lighter has zero fee, fills are adjusted:
- `spread_bps` (default 3) — half-spread on entry/exit
- `slippage_bps` (default 2) — market impact
- `funding_bps_per_8h` — settled every 8h on open perps
- Applied in `nautilus_engine` paper fills and `backtest` — never show fantasy PnL.

## Backtest Terminal
`POST /backtest/run` → Nautilus `BacktestEngine` (or vectorized fallback if nautilus not installed) → returns `equity_curve`, `trades`, `metrics` (sharpe/sortino/calmar/profit_factor/win_rate/max_dd/var). Cost toggles forwarded to TCA.

## Repos Borrowed — How
- **nautilus_trader**: engine + strategy base + matching engine. `pip install nautilus_trader`. Don't fork.
- **OpenBB**: optional data helper (stocks later). Not required for perps.
- **skfolio**: `pip install skfolio` for risk/portfolio math. Graceful fallback if missing.
- **Vibe-Trading**: patterns — strategy registry, NaN/warmup mask, funding settlement, flatten latch, shadow account. Copied as patterns, not code.
- **Kronos**: optional `services/kronos_signal.py` stub — call as feature, not strategy.

## Security
- `.env` gitignored. Key never leaves server. Rotate if leaked in chat/logs.
- No `exec()` of raw user code. `strategy_registry` validates AST, checks `BaseStrategy` subclass, runs isolated backtest. Only then registered.

## Scaling to Arb / Delta-Neutral / Funding Farm
Add file `strategies/funding_farm.py: class FundingFarm(BaseStrategy)` — register → backtest → promote. Engine already multi-venue, multi-asset. OrderManager handles cross-venue hedges.

## Failure Modes Fixed (Learned from Vibe-Trading)
- Warmup bars masked at registry level.
- `pct_change` forward-fill scrubbed — NaN stays NaN.
- Funding settles per open notional, per 8h bar span.
- Flatten latch survives restarts (Redis flag).
