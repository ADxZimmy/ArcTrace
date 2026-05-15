# ArcTrace

ArcTrace is a testnet-first verifiable AI market reasoning platform for the Agora Agents Hackathon.

Positioning: **Before AI agents manage money, we need to verify how they think.**

The MVP is built around one proof loop:

1. Register Agent on Arc Testnet.
2. Run Agent Trace.
3. Commit Trace Hash to Arc Testnet.
4. Verify Trace.

Production runtime does not use mock data, fake transactions, fake hashes, fake charts, or fake agent output. If an integration is not configured, ArcTrace reports it as unavailable.

## Stack

- Next.js App Router, TypeScript, Tailwind
- Prisma + Postgres
- viem for Arc Testnet calls
- Solidity + Hardhat
- Provider-agnostic AI layer with OpenAI adapter
- Recharts/lucide-ready UI shell

## Required Environment

Copy `.env.example` to `.env` and fill:

```bash
DATABASE_URL=
ARC_RPC_URL=
CANTEEN_RPC_URL=
ARC_CHAIN_ID=5042002
ARC_EXPLORER_BASE_URL=
PRIVATE_KEY=
AGENT_REGISTRY_ADDRESS=
TRACE_REGISTRY_ADDRESS=
RESOLUTION_REGISTRY_ADDRESS=
REPUTATION_REGISTRY_ADDRESS=
AI_PROVIDER=openai
AI_API_KEY=
APP_BASE_URL=http://localhost:3000
```

Optional:

```bash
NEWS_API_KEY=
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_WEB3_API_KEY=
```

Arc native currency is configured as `USDC`. The RPC prefers `CANTEEN_RPC_URL` when present, otherwise `ARC_RPC_URL`.

## Local Development

```bash
npm install
npm run db:generate
npm run db:migrate
npm run contracts:compile
npm run dev
```

Open `http://localhost:3000`.

## Deploy Contracts To Arc Testnet

```bash
npm run deploy:arc
```

Copy the printed addresses into `.env`:

```bash
AGENT_REGISTRY_ADDRESS=
TRACE_REGISTRY_ADDRESS=
RESOLUTION_REGISTRY_ADDRESS=
REPUTATION_REGISTRY_ADDRESS=
```

## Database

The schema includes:

- `users`
- `agents`
- `traces`
- `trace_payloads`
- `sources`
- `resolutions`
- `feedback`
- `traction_events`

Create migrations with:

```bash
npm run db:migrate
```

## API Proof Loop

- `POST /api/agents/register`
- `POST /api/traces/run`
- `POST /api/traces/:id/verify`
- `POST /api/traces/:id/resolve`
- `GET /api/system/status`
- `GET /api/traction`

Verification recomputes the trace hash from the stored canonical trace JSON, reads the committed hash from Arc Testnet, checks the transaction receipt, and checks the agent policy hash.

Expected verification shape:

```json
{
  "verified": true,
  "checks": {
    "database_payload_exists": true,
    "canonical_hash_matches": true,
    "onchain_trace_exists": true,
    "transaction_confirmed": true,
    "agent_policy_matches": true
  }
}
```

## Hackathon Demo Script

1. Open `/settings` and confirm DB, Arc RPC, contract addresses, Circle config, and AI provider status.
2. Open `/traces/new`.
3. Register the default ArcTrace agent.
4. Capture agent ID, policy hash, registration transaction hash, and Arc explorer link.
5. Enter a measurable market question with a horizon.
6. Run the agent trace.
7. Confirm Research, Risk, Contrarian, and Final Decision JSON are returned.
8. Confirm canonical final trace JSON, source bundle hash, and trace hash are shown.
9. Confirm TraceRegistry commit transaction hash, block number, explorer link, and event data.
10. Open the trace detail page.
11. Press **Verify Trace** and show the live backend verification object.
12. Open the public `/p/:id` page and verify again.
13. Submit feedback.
14. Resolve the trace with evidence using the resolve API.
15. Open `/admin` and export the traction CSV.

## Safety Boundary

ArcTrace never executes trades, places bets, or moves user capital. It creates market intelligence and simulated decisions only. Onchain actions are limited to agent registration, trace commitment, verification metadata, resolution, and reputation signals on testnet.

## Tests

```bash
npm test
npm run contracts:test
npm run build
```

Covered:

- JSON schema validation
- Canonicalization and hash generation
- Source adapter unavailable behavior
- Smart contract trace commit
- Smart contract resolution

## Production Deployment

1. Provision Postgres with Supabase, Neon, or another hosted provider.
2. Deploy contracts to Arc Testnet.
3. Set all required environment variables in Vercel.
4. Run Prisma migration against production DB.
5. Deploy the Next.js app.
6. Use `/settings` to confirm live integration status before demo.
