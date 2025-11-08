# Rolley Waitlist Backend

Minimal Express + Prisma API for capturing Rolley waitlist signups.

## Stack

- **Framework:** Express 5 + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase / Render / Railway friendly)
- **Validation:** Basic request guards on `POST /api/waitlist`

## Endpoints

| Method | Route             | Description                        |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/health`         | Readiness check                    |
| POST   | `/api/waitlist`   | Create waitlist entry `{name,email}` |

## Environment

Copy `env.example` to `.env` and supply production values:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/rolley_waitlist"
PORT=3001
FRONTEND_URL="http://localhost:5174"
```

`FRONTEND_URL` accepts comma-separated origins.

## Local Development

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Generate Prisma client separately if needed:

```bash
npm run prisma:generate
```

## Deployment Steps

1. Provision PostgreSQL (Supabase, Render, Railway, Neon, etc.)
2. Set environment variables (`DATABASE_URL`, `PORT`, `FRONTEND_URL`)
3. Run migrations in production: `npx prisma migrate deploy`
4. Start service: `npm run start`

Backend plays nicely with Render’s free tier (keep-alive required after 15 minutes idle).

## Notes

- Generated Prisma client lives in `src/generated`
- `.gitignore` excludes `.env`, `node_modules`, Prisma native binaries
- Pair this with the Vercel-hosted waitlist frontend (`rolley-waitlist/frontend`)
