"use client";
import { useEffect, useState } from "react";

const PATHS: Record<string, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.7h4l.4-2.7a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  repeat: "M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5",
  key: "M14 10a4 4 0 11-3.5 6H8v-2H6v-2l4.5-4.5A4 4 0 0114 10zM16 8h.01",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  auto: "M4 5h16v11H4zM8 20h8M12 16v4",
};

export function Icon({ name, size = 18 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>;
}

const MODES = [["light", "sun"], ["dark", "moon"], ["system", "auto"]] as const;

export function ThemeSwitcher() {
  const [mode, setMode] = useState("system");
  useEffect(() => setMode(localStorage.getItem("theme") || "system"), []);
  const pick = (m: string) => {
    setMode(m);
    localStorage.setItem("theme", m);
    document.documentElement.dataset.theme = m;
  };
  return (
    <div className="theme" role="group" aria-label="Theme">
      {MODES.map(([m, icon]) => (
        <button key={m} onClick={() => pick(m)} aria-pressed={mode === m} title={m[0].toUpperCase() + m.slice(1)} aria-label={m}>
          <Icon name={icon} size={16} />
        </button>
      ))}
    </div>
  );
}
