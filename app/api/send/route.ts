import { NextResponse } from "next/server";
import { limited } from "@/lib/ratelimit";

const BASE = process.env.NUVION_BASE_URL ?? "https://api.nuvion.dev";

type Step = { name: string; method: string; path: string; reused?: boolean; status?: number; request?: unknown; response?: unknown };

// Error bodies carry a `message`, plus a `validations` array of `{ <field>: { type, message } }`.
function messageOf(body: any): string {
  if (body?.message && !body?.validations?.length) return body.message;
  const v = body?.validations?.flatMap((x: any) => Object.values(x).map((e: any) => e.message ?? e.type));
  return v?.length ? v.join("; ") : body?.message ?? body?.type ?? "Unknown error";
}

export async function POST(req: Request) {
  // Vercel sets x-forwarded-for; the first entry is the client.
  const wait = limited(req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local");
  if (wait) {
    return NextResponse.json({ ok: false, error: `Too many requests. Try again in ${wait} seconds.`, steps: [] }, { status: 429, headers: { "Retry-After": String(wait) } });
  }
  const f = await req.json();
  const { apiKey, entityId, accountId, currency, recipient } = f;
  const amount = Number(f.amount);
  if (!apiKey || !accountId || !recipient?.ban || !currency || !Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ ok: false, error: "Missing API key, account ID, recipient account number or currency, or the amount is not a whole number of at least 1 minor unit.", steps: [] }, { status: 400 });
  }

  const steps: Step[] = [];
  // The key is sent only in the Authorization header and never echoed back in a step.
  async function call(name: string, path: string, body: unknown) {
    const step: Step = { name, method: "POST", path, request: body };
    steps.push(step);
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    step.status = res.status;
    step.response = json;
    if (!res.ok) throw Object.assign(new Error(messageOf(json)), { status: res.status });
    return json.data ?? json; // successful responses wrap the object in `data`
  }
  // `entity_id` goes on every call when acting for a child entity, and is left out otherwise.
  const ent = entityId ? { entity_id: entityId } : {};

  try {
    // Step 1: the recipient as a counterparty. Once per recipient, so the client passes the ID back to reuse it.
    let counterpartyId: string = f.counterpartyId;
    if (counterpartyId) steps.push({ name: "Create counterparty", method: "POST", path: "/counterparties", reused: true });
    else {
      const cp = await call("Create counterparty", "/counterparties", {
        type: "business",
        ...ent,
        nickname: recipient.name,
        profile: {
          legal_name: recipient.name,
          relationship: "supplier",
          email: "accounts@mercato.example",
          registered_address: { line1: "12 Market Street", city: "London", postal_code: "EC1A 1BB", country: "GB" },
        },
      });
      counterpartyId = cp.id;
    }

    // Step 2: a book-transfer payment detail whose account_number is the recipient's nuvion_ban.
    let paymentDetailId: string = f.paymentDetailId;
    if (paymentDetailId) steps.push({ name: "Add payment detail", method: "POST", path: "/payment-details", reused: true });
    else {
      const pd = await call("Add payment detail", "/payment-details", {
        payment_method: "book-transfer",
        currency,
        account_holder_name: recipient.name,
        ...ent,
        counterparty_id: counterpartyId,
        account_number: recipient.ban,
      });
      paymentDetailId = pd.id;
    }

    // Step 3: the transfer. A fresh unique_reference for every payment makes retries safe.
    const transfer = await call("Send transfer", "/transfers", {
      ...ent,
      account_id: accountId,
      counterparty_id: counterpartyId,
      payment_detail_id: paymentDetailId,
      amount,
      currency,
      narration: f.narration || "Transfer",
      payment_type: "book-transfer",
      unique_reference: `${f.reference || "PAY"}-${Date.now()}`,
    });
    return NextResponse.json({ ok: true, steps, counterpartyId, paymentDetailId, transfer });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e), steps }, { status: e.status ?? 502 });
  }
}
