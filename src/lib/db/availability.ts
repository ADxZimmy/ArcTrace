export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function databaseUnavailablePayload() {
  return {
    ok: false,
    configured: false,
    error: "DATABASE_URL is not configured. Connect a Postgres database and run migrations before using live data routes.",
  };
}
