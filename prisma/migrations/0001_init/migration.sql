CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "wallet_address" TEXT UNIQUE,
  "email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "agents" (
  "id" TEXT PRIMARY KEY,
  "onchain_agent_id" TEXT UNIQUE,
  "owner_wallet" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "metadata_uri" TEXT NOT NULL,
  "policy_hash" TEXT NOT NULL,
  "contract_tx_hash" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "traces" (
  "id" TEXT PRIMARY KEY,
  "onchain_trace_id" TEXT UNIQUE,
  "agent_id" TEXT NOT NULL REFERENCES "agents"("id"),
  "creator_user_id" TEXT REFERENCES "users"("id"),
  "question" TEXT NOT NULL,
  "question_hash" TEXT NOT NULL,
  "trace_hash" TEXT NOT NULL UNIQUE,
  "source_bundle_hash" TEXT NOT NULL,
  "metadata_uri" TEXT NOT NULL,
  "stance" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "risk_score" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "horizon" TEXT NOT NULL,
  "expiry_timestamp" TIMESTAMP(3) NOT NULL,
  "source_quality_score" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "arc_tx_hash" TEXT,
  "arc_block_number" BIGINT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "traces_created_at_idx" ON "traces"("created_at");
CREATE INDEX "traces_status_idx" ON "traces"("status");

CREATE TABLE "trace_payloads" (
  "id" TEXT PRIMARY KEY,
  "trace_id" TEXT NOT NULL UNIQUE REFERENCES "traces"("id"),
  "full_json" JSONB NOT NULL,
  "public_summary" TEXT NOT NULL,
  "signals_json" JSONB NOT NULL,
  "risks_json" JSONB NOT NULL,
  "agent_committee_json" JSONB NOT NULL,
  "raw_source_refs_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "sources" (
  "id" TEXT PRIMARY KEY,
  "trace_id" TEXT NOT NULL REFERENCES "traces"("id"),
  "source_type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "url_or_identifier" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "published_at" TIMESTAMP(3),
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reliability_score" INTEGER NOT NULL,
  "recency_score" INTEGER NOT NULL,
  "relevance_score" INTEGER NOT NULL,
  "hash" TEXT NOT NULL
);

CREATE TABLE "resolutions" (
  "id" TEXT PRIMARY KEY,
  "trace_id" TEXT NOT NULL REFERENCES "traces"("id"),
  "outcome" TEXT NOT NULL,
  "evidence_uri" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "notes_hash" TEXT NOT NULL,
  "resolver_wallet" TEXT NOT NULL,
  "arc_tx_hash" TEXT,
  "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "feedback" (
  "id" TEXT PRIMARY KEY,
  "trace_id" TEXT NOT NULL REFERENCES "traces"("id"),
  "user_id" TEXT REFERENCES "users"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "traction_events" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "users"("id"),
  "wallet_address" TEXT,
  "event_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "traction_events_event_type_idx" ON "traction_events"("event_type");
CREATE INDEX "traction_events_created_at_idx" ON "traction_events"("created_at");
