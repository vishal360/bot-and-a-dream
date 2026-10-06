# RUN — anywhere, in 2 minutes

## First time on any machine

```bash
git clone https://github.com/vishal360/bot-and-a-dream.git
cd bot-and-a-dream
cp .env.example .env
# edit .env and paste your LIGHTER_API_KEY
# Windows: notepad .env
# Mac/Linux: nano .env
```

`.env` is gitignored. Never commit it.

## Docker (one command) — recommended

```bash
docker compose up --build
# frontend http://localhost:3000
# api     http://localhost:8000/docs
# health  http://localhost:8000/health and /market/health
# ws      ws://localhost:8000/ws/stream
```

## Without Docker (Windows)

Terminal 1 — backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:
```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

## Verify

```bash
curl http://localhost:8000/health
curl http://localhost:8000/bots
curl -X POST http://localhost:8000/backtest/run -H "Content-Type: application/json" -d "{\"strategy_id\":\"futures_ema_kronos\",\"bars\":500}"
```

## Push updates back

```bash
git add -A
git commit -m "feat: my update"
git push
```

Or double-click `PUSH_TO_GITHUB.bat` on Windows.
