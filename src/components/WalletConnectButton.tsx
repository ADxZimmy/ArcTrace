"use client";

import { Wallet } from "lucide-react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function WalletConnectButton({ onAddress }: { onAddress: (address: string) => void }) {
  async function connect() {
    if (!window.ethereum) {
      onAddress("");
      return;
    }
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    onAddress(accounts?.[0] || "");
  }

  return (
    <button type="button" onClick={connect} className="label inline-flex min-h-11 items-center gap-2 rounded border border-[var(--outline)] px-4 text-white hover:border-[var(--lime)]">
      <Wallet size={16} /> Connect wallet
    </button>
  );
}
