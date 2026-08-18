import { NextResponse } from "next/server";
import { resendAcceptanceToRental } from "@/app/admin/inquiries/_actions";

const TOKEN = "8f3c1a9e2b74d6c0a15e88b4f91c27d3e6a0b8c4";
const IDS = [
  "f665d1df-3ff4-44ae-9946-ea7b8fbb2b33",
  "563e08d4-117b-4c5c-a1a7-302f84c671c7",
];

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t");
  if (t !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const results = [];
  for (const id of IDS) {
    const result = await resendAcceptanceToRental(id);
    results.push({ id, ...result });
  }

  return NextResponse.json({ ok: true, results });
}
