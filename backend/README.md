# Solo Leveling API

Express + Drizzle + MySQL backend for the Solo Leveling UI.

## Setup

1. Copy env and set your MySQL password:

```bash
cd backend
copy .env.example .env
```

Edit `DATABASE_URL`:

```text
DATABASE_URL=mysql://root:YOUR_PASSWORD@127.0.0.1:3306/solo_leveling
```

2. Install and push schema:

```bash
npm install
npm run db:push
```

3. Run API:

```bash
npm run dev
```

Health check: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

## Routes (v1 stubs)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Service + DB ping |
| GET/POST | `/api/v1/hunters` | List / create hunter |
| GET | `/api/v1/hunters/:id` | Get hunter |
| GET/POST | `/api/v1/quests/hunter/:hunterId` | List / add quests |
| DELETE | `/api/v1/quests/:id` | Soft-delete quest |
| GET | `/api/v1/daily-logs/hunter/:hunterId/today` | Today log |
| PATCH | `/api/v1/daily-logs/hunter/:hunterId/today/items/:questId` | Upsert item |
| POST | `/api/v1/daily-logs/hunter/:hunterId/today/submit` | Submit day |

Frontend still uses localStorage until we wire `NEXT_PUBLIC_API_URL`.
