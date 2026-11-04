import { NextResponse } from "next/server";

const BASE = process.env.NUVION_BASE_URL ?? "https://api.nuvion.dev";

class ApiError extends Error {
  constructor(public status: number, public step: string, public body: unknown) {
    super(messageOf(body));
  }
}

// Error bodies carry a `message`, plus a `validations` array for field errors.
function messageOf(body: any): string {
  if (body?.message) return body.message;
  // Each validation is `{ <field>: { type, message } }`.
  const v = body?.validations?.flatMap((x: any) => Object.values(x).map((e: any) => e.message ?? e.type));
  return v?.length ? v.join("; ") : body?.type ?? "Unknown error";
}

async function call(step: string, path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.NUVION_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, step, json);
  return json.data ?? json; // successful responses wrap the object in `data`
}

export async function POST(req: Request) {
  if (!process.env.NUVION_API_KEY) {
    return NextResponse.json({ error: "NUVION_API_KEY is not set. Copy .env.example to .env.local." }, { status: 500 });
  }
  const f = await req.json();
  const { entityId, accountId, parentAccountNumber, currency } = f;
  const amount = Number(f.amount);
  if (!entityId || !accountId || !parentAccountNumber || !currency || !Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: "Fill every field. Amount must be a whole number of minor units, at least 1." }, { status: 400 });
  }

  try {
    // Step 1: parent as a counterparty under the child (skipped when an ID is supplied).
    let counterpartyId: string = f.counterpartyId;
    if (!counterpartyId) {
      const cp = await call("counterparty", "/counterparties", {
        type: "business",
        entity_id: entityId,
        nickname: "Parent treasury",
        profile: {
          legal_name: f.parentName || "Parent Entity",
          relationship: "supplier",
          email: "treasury@parent.example",
          registered_address: { line1: "350 Fifth Avenue", city: "New York", state_or_province: "NY", postal_code: "10118", country: "US" },
        },
      });
      counterpartyId = cp.id;
    }

    // Step 2: book-transfer payment detail pointing at the parent's nuvion_ban.
    // Skipped when a payment detail ID is supplied: the same account number can't be added twice for a counterparty.
    const pd = f.paymentDetailId ? { id: f.paymentDetailId } : await call("payment detail", "/payment-details", {
      payment_method: "book-transfer",
      currency,
      account_holder_name: f.parentName || "Parent Entity",
      entity_id: entityId,
      counterparty_id: counterpartyId,
      account_number: parentAccountNumber,
    });

    // Step 3: the transfer. A fresh unique_reference per move makes retries safe.
    const transfer = await call("transfer", "/transfers", {
      entity_id: entityId,
      account_id: accountId,
      counterparty_id: counterpartyId,
      payment_detail_id: pd.id,
      amount,
      currency,
      narration: "Move funds to parent",
      payment_type: "book-transfer",
      unique_reference: `MOVE-${Date.now()}`,
    });

    return NextResponse.json({
      counterpartyId,
      paymentDetailId: pd.id,
      status: transfer.status,
      applicableFee: transfer.applicable_fee,
      transfer,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message, step: e.step, status: e.status, body: e.body }, { status: e.status });
    }
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
