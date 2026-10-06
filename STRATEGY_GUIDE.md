# STRATEGY GUIDE — Drop Python, Get a Bot

Create `backend/strategies/my_strategy.py`:

```python
from backend.strategies.base import BaseStrategy
from backend.app.services.tca import apply_tca

class MyFutures(BaseStrategy):
    id = "my_futures_v1"
    assets = ["BTC-PERP"]  # Lighter market id
    venue = "LIGHTER"
    timeframe = "1m"

    # declare warmup so registry masks early bars (prevents lookahead)
    min_warmup_bars = 50

    def init(self):
        self.ema_fast = 12
        self.ema_slow = 26

    def on_bar(self, bar):
        # bar: {open, high, low, close, volume, ts}
        # return a signal dict or call order_manager helpers
        if self.ema(bar.close, self.ema_fast) > self.ema(bar.close, self.ema_slow):
            return {"action": "BUY", "size_pct": 0.1, "reason": "EMA cross up"}
        elif self.ema(bar.close, self.ema_fast) < self.ema(bar.close, self.ema_slow):
            return {"action": "SELL", "size_pct": 0.1, "reason": "EMA cross down"}
        return None
```

## Upload Flow

```bash
curl -X POST http://localhost:8000/strategies/upload -F file=@my_strategy.py
# → {status: "validated", backtest: {sharpe:..., max_dd:...}, id: "my_futures_v1"}
curl -X POST http://localhost:8000/strategies/my_futures_v1/promote  # to paper
```

Or use **Strategy Lab** tab → Monaco editor → Validate → Backtest → Promote.

## What Is Validated

1. `ast.parse` — must be valid Python, no `os.system`, `subprocess`, `eval`, `exec`, `__import__` abuse.
2. Exactly one `BaseStrategy` subclass, unique `id`.
3. Dry-run backtest on 30d synthetic bars — must not crash, must emit ≥1 trade, metrics returned.
4. Registered in `strategy_registry.json` (versioned).

## Backtest Terminal

Pick strategy, date range, toggle `Spread / Slippage / Funding` costs → `Nautilus` backtest → equity vs benchmark.

## Kronos Signal (Optional)

```python
from backend.app.services.kronos_signal import kronos_forecast
fcst = kronos_forecast(bars, horizon=20)  # device=cpu by default
if fcst["up_prob"] > 0.6: ...
```

If `kronos` not installed, stub returns neutral — strategy still backtests.
