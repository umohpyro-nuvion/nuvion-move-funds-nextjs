"use client";
import Link from "next/link";
import { SCENARIOS, PARTY_META, missingFor } from "@/lib/scenarios";
import { useStore } from "@/components/Store";
import { Avatar, Icon } from "@/components/ui";

export default function Home() {
  const { cfg, ready } = useStore();
  const readyCount = SCENARIOS.filter((s) => missingFor(s, cfg).length === 0).length;
  return (
    <>
      <section className="hero">
        <p className="eyebrow light">Mercato on Nuvion</p>
        <h1>Send money within Nuvion, seven ways.</h1>
        <p>Mercato is a marketplace with sellers. Each card below is one real situation from the book transfer guide. Pick one, press send, and see the three API calls it makes.</p>
        <div className="hero-actions">
          <Link href="/setup" className="btn light">{ready && readyCount === 0 ? "Set up your sandbox" : "Edit sandbox setup"}</Link>
          <a className="btn ghost" href="https://docs.nuvion.co/guides/send-within-nuvion" target="_blank" rel="noreferrer">Read the guide</a>
        </div>
      </section>

      <div className="page">
        {ready && readyCount < SCENARIOS.length && (
          <Link href="/setup" className="notice">
            <Icon name="key" /> <span><b>{readyCount} of {SCENARIOS.length} scenarios ready.</b> Add your sandbox API key, entity IDs, account IDs and account numbers on the setup page to unlock the rest.</span>
            <Icon name="arrow" />
          </Link>
        )}

        <div className="grid">
          {SCENARIOS.map((s, i) => {
            const from = cfg.parties[s.from], to = cfg.parties[s.to];
            return (
              <Link key={s.id} href={`/send/${s.id}`} className="card scenario" style={{ ["--c" as string]: s.color }}>
                <div className="card-band"><span>Scenario {i + 1}</span></div>
                <div className="flow">
                  <Avatar name={from.name} color={s.color} />
                  <Icon name="arrow" />
                  <Avatar name={to.name} color={s.color} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.story}</p>
                <div className="chips">
                  <span className="chip">{s.key === "customerKey" ? "Their own key" : "Parent's key"}</span>
                  <span className="chip">{PARTY_META[s.from].child ? "Sends entity_id" : "No entity_id"}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="how">
          <h2>What every send does</h2>
          <ol>
            <li><b>Create a counterparty.</b> The recipient, once. Mercato remembers it for the next send.</li>
            <li><b>Add a payment detail.</b> The recipient's Nuvion account number, as a <code>book-transfer</code>.</li>
            <li><b>Send the transfer.</b> It is <code>successful</code> straight away. The sender also pays a fee on top.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
