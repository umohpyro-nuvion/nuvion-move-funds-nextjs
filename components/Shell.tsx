"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import { Icon, ThemeSwitcher } from "./ui";

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const link = (href: string, label: string, icon: string, dot?: string) => (
    <Link key={href} href={href} className={path === href ? "nav active" : "nav"}>
      {dot ? <i className="dot" style={{ background: dot }} /> : <Icon name={icon} />}
      {label}
    </Link>
  );
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand"><span className="logo">M</span>Mercato</Link>
        {link("/", "Overview", "home")}
        <p className="eyebrow">Scenarios</p>
        {SCENARIOS.map((s) => link(`/send/${s.id}`, s.title, "", s.color))}
        <p className="eyebrow">Sandbox</p>
        {link("/setup", "Setup", "gear")}
        <div className="side-foot"><ThemeSwitcher /></div>
      </aside>
      <div className="main">
        <header className="top">
          <Link href="/" className="brand"><span className="logo">M</span>Mercato</Link>
          <nav><Link href="/setup" className="chip"><Icon name="gear" size={15} />Setup</Link><ThemeSwitcher /></nav>
        </header>
        {children}
        <footer className="foot">Sandbox only. Mercato is a demo marketplace built on the Nuvion API. Your keys stay in this browser tab and go to the server only to call Nuvion.</footer>
      </div>
    </div>
  );
}
