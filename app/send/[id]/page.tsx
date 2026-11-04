"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PARTY_META, SCENARIOS, missingFor, money, scenarioById } from "@/lib/scenarios";
import { useStore } from "@/components/Store";
import { Avatar, Icon } from "@/components/ui";

type Step = { name: string; path: string; reused?: boolean; status?: number; request?: unknown; response?: unknown };
type Result = { ok: boolean; error?: string; steps: Step[]; transfer?: any };

export default function Send() {
  const { id } = useParams<{ id: string }>();
  const s = scenarioById(id);
  const { cfg, cache, setCache, ready } = useStore();
  const [amount, setAmount] = useState(s?.amount ?? "");
  const [narration, setNarration] = useState(s?.narration ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  if (!s) return <div className="page"><h1>Scenario not found</h1><Link href="/">Back to overview</Link></div>;
  const from = cfg.parties[s.from], to = cfg.parties[s.to];
  const missing = ready ? missingFor(s, cfg) : [];
  const childPays = PARTY_META[s.from].child;
  const minor = Math.round(parseFloat(amount) * 100);
  const valid = Number.isInteger(minor) && minor >= 1;
  // Steps 1 and 2 happen once per recipient, so the IDs are cached per sender and recipient.
  const cacheKey = `${s.key}|${from.entityId}|${to.ban}`;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({
        apiKey: cfg[s!.key], entityId: childPays ? from.entityId : "", accountId: from.accountId,
        recipient: { name: to.name, ban: to.ban }, currency: cfg.currency, amount: minor, narration,
        reference: s!.id.toUpperCase(), ...cache[cacheKey],
      }),
    });
    const data: Result & { counterpartyId?: string; paymentDetailId?: string } = await res.json();
    if (data.ok) setCache({ ...cache, [cacheKey]: { counterpartyId: data.counterpartyId!, paymentDetailId: data.paymentDetailId! } });
    else if (cache[cacheKey]) { const { [cacheKey]: _gone, ...rest } = cache; setCache(rest); } // drop stale IDs so a retry recreates them
    setResult(data);
    setBusy(false);
  }

  const t = result?.transfer;
  return (
    <div style={{ ["--c" as string]: s.color }}>
      <section className="hero small" style={{ background: `linear-gradient(135deg, ${s.color}, var(--band))` }}>
        <p className="eyebrow light">Scenario {SCENARIOS.indexOf(s) + 1} of {SCENARIOS.length}</p>
        <h1>{s.title}</h1>
        <p>{s.story}</p>
      </section>

      <div className="page narrow">
        <section className="card pad parties">
          <div className="party-box"><Avatar name={from.name} color={s.color} size={56} /><b>{from.name}</b><small>Pays</small></div>
          <div className="pipe"><span>{valid ? money(minor, cfg.currency) : "Amount"}</span><Icon name="arrow" size={28} /></div>
          <div className="party-box"><Avatar name={to.name} color={s.color} size={56} /><b>{to.name}</b><small>Receives</small></div>
        </section>

        <section className="card pad">
          <h3>What is different here</h3>
          <dl className="diff">
            <dt><Icon name="key" />API key</dt>
            <dd>{s.key === "customerKey" ? <>{from.name}'s own key. The sender is a separate customer.</> : childPays ? "The parent's key, acting for the child." : "The parent's key. The parent is the sender."}</dd>
            <dt><Icon name="repeat" />entity_id</dt>
            <dd>{childPays ? <>Sent on every call as <code>{from.entityId || "the child's ID"}</code>, so the child owns the counterparty and payment detail.</> : "Left out. The sender acts for itself."}</dd>
            <dt><Icon name="check" />account_number</dt>
            <dd>{to.name}'s <code>nuvion_ban</code>{to.ban ? <>, <code>{to.ban}</code></> : ""}, in step 2.</dd>
          </dl>
        </section>

        {ready && missing.length > 0 ? (
          <Link href="/setup" className="notice">
            <Icon name="gear" /><span><b>Finish setup first.</b> Missing: {missing.join(", ")}.</span><Icon name="arrow" />
          </Link>
        ) : (
          <form className="card pad" onSubmit={send}>
            <h3>Send</h3>
            <div className="cols">
              <label className="field"><span>Amount ({cfg.currency})</span>
                <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <small>{valid ? `${minor} minor units, excluding the fee.` : "Enter an amount of at least 0.01."}</small></label>
              <label className="field"><span>Narration</span>
                <input value={narration} onChange={(e) => setNarration(e.target.value)} maxLength={100} /></label>
            </div>
            <div className="actions">
              <button className="btn primary" disabled={busy || !valid}>{busy ? "Sending…" : `Send ${valid ? money(minor, cfg.currency) : ""} to ${to.name}`}</button>
              {cache[cacheKey] && <small>Recipient already saved, so steps 1 and 2 are reused.</small>}
            </div>
          </form>
        )}

        {result && (
          <section className="card pad" aria-live="polite">
            {result.ok ? (
              <div className="receipt">
                <span className="badge ok"><Icon name="check" size={14} />{t.status}</span>
                <p className="big">{money(t.amount, t.currency)}</p>
                <p>sent to {to.name}. Fee <b>{money(t.applicable_fee, t.currency)}</b>, so {from.name} was debited <b>{money(t.amount + t.applicable_fee, t.currency)}</b>.</p>
              </div>
            ) : (
              <div className="receipt"><span className="badge bad"><Icon name="x" size={14} />Failed</span><p className="err">{result.error}</p><p>Nothing else was sent. Fix the cause and press send again.</p></div>
            )}
            <h3>The calls Mercato made</h3>
            <ol className="steps">
              {result.steps.map((st, i) => (
                <li key={i} className={st.reused ? "reused" : st.status && st.status < 300 ? "done" : "failed"}>
                  <details>
                    <summary><b>Step {i + 1}: {st.name}</b> <code>POST {st.path}</code> <em>{st.reused ? "reused from last time" : st.status}</em></summary>
                    {!st.reused && <><p className="eyebrow">Request</p><pre>{JSON.stringify(st.request, null, 2)}</pre><p className="eyebrow">Response</p><pre>{JSON.stringify(st.response, null, 2)}</pre></>}
                  </details>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
