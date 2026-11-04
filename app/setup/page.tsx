"use client";
import { useEffect, useState } from "react";
import { Config, PartyId, PARTY_META, SCENARIOS } from "@/lib/scenarios";
import { useStore } from "@/components/Store";
import { Avatar } from "@/components/ui";

const ORDER: PartyId[] = ["platform", "reserve", "sellerA", "sellerB", "customer"];
const COLORS: Record<PartyId, string> = { platform: "#F63080", reserve: "#E8590C", sellerA: "#8E3FA8", sellerB: "#2F6FE0", customer: "#A8531C" };

export default function Setup() {
  const { cfg, saveCfg, ready } = useStore();
  const [draft, setDraft] = useState<Config>(cfg);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(cfg), [cfg, ready]);

  const set = (k: "currency" | "parentKey" | "customerKey", v: string) => setDraft({ ...draft, [k]: v });
  const setParty = (id: PartyId, k: string, v: string) =>
    setDraft({ ...draft, parties: { ...draft.parties, [id]: { ...draft.parties[id], [k]: v.trim() } } });
  const field = (label: string, value: string, on: (v: string) => void, help?: string, secret = false) => (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => on(e.target.value)} type={secret ? "password" : "text"} autoComplete="off" spellCheck={false} />
      {help && <small>{help}</small>}
    </label>
  );

  return (
    <div className="page narrow">
      <p className="eyebrow">Sandbox</p>
      <h1>Set up your sandbox</h1>
      <p className="lead">Mercato needs the people and accounts to move money between. Enter them once. Use sandbox values only. Everything stays in this browser tab.</p>

      <form onSubmit={(e) => { e.preventDefault(); saveCfg(draft); setSaved(true); }}>
        <section className="card pad">
          <h3>API keys</h3>
          {field("Parent sandbox API key", draft.parentKey, (v) => set("parentKey", v.trim()), "Used for every scenario except the last one. It acts for Mercato and its sellers.", true)}
          {field("Customer sandbox API key", draft.customerKey, (v) => set("customerKey", v.trim()), "Northwind's own key, for “Another customer pays a child”. Leave empty to skip that scenario.", true)}
          {field("Currency", draft.currency, (v) => set("currency", v.trim().toUpperCase()), "The currency of every account below, for example GBP.")}
        </section>

        {ORDER.map((id) => {
          const p = draft.parties[id], meta = PARTY_META[id];
          const used = SCENARIOS.filter((s) => s.from === id || s.to === id).map((s) => s.title);
          return (
            <section key={id} className="card pad party">
              <header>
                <Avatar name={p.name} color={COLORS[id]} />
                <div><h3>{p.name}</h3><small>{meta.role}. {meta.hint}</small></div>
              </header>
              <div className="cols">
                {field("Name", p.name, (v) => setParty(id, "name", v))}
                {meta.child && field("Entity ID", p.entityId, (v) => setParty(id, "entityId", v), "Needed when this child pays.")}
                {field("Account ID", p.accountId, (v) => setParty(id, "accountId", v), "Needed when this account pays.")}
                {field("Account number (nuvion_ban)", p.ban, (v) => setParty(id, "ban", v), "Needed when this account receives.")}
              </div>
              <small className="used">Used in: {used.join(", ")}</small>
            </section>
          );
        })}

        <div className="actions">
          <button className="btn primary">Save setup</button>
          {saved && <span role="status" className="ok">Saved. Saved recipients were cleared.</span>}
        </div>
      </form>
    </div>
  );
}
