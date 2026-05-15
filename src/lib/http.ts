import { NextResponse } from "next/server";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(
    JSON.parse(
      JSON.stringify(data, (_, value) => (typeof value === "bigint" ? value.toString() : value)),
    ),
    init,
  );
}
