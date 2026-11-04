"use client";
import { useState } from "react";

const fields = [
  ["entityId", "Child entity ID", true],
  ["accountId", "Child account ID", true],
  ["parentAccountNumber", "Parent account number (nuvion_ban)", true],
  ["amount", "Amount (minor units)", true],
  ["currency", "Currency (e.g. GBP)", true],
  ["parentName", "Parent legal name (optional)", false],
  ["counterpartyId", "Existing counterparty ID (optional, skips step 1)", false],
  ["paymentDetailId", "Existing payment detail ID (optional, skips step 2)", false],
] as const;

const defaults: Record<string, string> = { amount: "10", currency: "GBP" };

export default function Page() {
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/move-funds", { method: "POST", body: JSON.stringify(data) });
    setResult({ ok: res.ok, ...(await res.json()) });
    setBusy(false);
  }

  return (
    <main>
      <h1>Move funds to parent</h1>
      <p>Sandbox only. Runs counterparty, payment detail and book transfer with the parent's API key.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {fields.map(([name, label, required]) => (
          <label key={name} style={{ display: "grid", gap: 4 }}>
            {label}
            <input name={name} required={required} defaultValue={defaults[name]} style={{ padding: 8 }} />
          </label>
        ))}
        <button disabled={busy} style={{ padding: 10 }}>{busy ? "Sending..." : "Move funds"}</button>
      </form>
      {result && (
        <section style={{ marginTop: 24 }}>
          {result.ok ? (
            <p><strong>Status:</strong> {result.status} <strong>Fee:</strong> {String(result.applicableFee)}</p>
          ) : (
            <p style={{ color: "crimson" }}><strong>{result.step ? `${result.step} failed (${result.status}): ` : ""}</strong>{result.error}</p>
          )}
          <pre style={{ background: "#f4f4f4", padding: 12, overflow: "auto" }}>{JSON.stringify(result.transfer ?? result.body ?? result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
