export const ARC_CHAIN_ID = Number(process.env.ARC_CHAIN_ID || 5042002);
export const ARC_RPC_URL = process.env.CANTEEN_RPC_URL || process.env.ARC_RPC_URL || "";
export const ARC_EXPLORER_BASE_URL = (process.env.ARC_EXPLORER_BASE_URL || "").replace(/\/$/, "");

export function txExplorerUrl(txHash?: string | null) {
  if (!txHash || !ARC_EXPLORER_BASE_URL) return null;
  return `${ARC_EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
