"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Config, EMPTY_CONFIG } from "@/lib/scenarios";

type Cache = Record<string, { counterpartyId: string; paymentDetailId: string }>;
type Ctx = { cfg: Config; saveCfg: (c: Config) => void; cache: Cache; setCache: (c: Cache) => void; ready: boolean };

const StoreCtx = createContext<Ctx>(null as never);
export const useStore = () => useContext(StoreCtx);

// sessionStorage keeps the API keys to this browser tab; they are never written to disk or a server.
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<Config>(EMPTY_CONFIG);
  const [cache, setCacheState] = useState<Cache>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem("mercato-config");
      if (c) setCfg({ ...EMPTY_CONFIG, ...JSON.parse(c) });
      const k = sessionStorage.getItem("mercato-cache");
      if (k) setCacheState(JSON.parse(k));
    } catch {}
    setReady(true);
  }, []);

  const saveCfg = (c: Config) => {
    setCfg(c);
    sessionStorage.setItem("mercato-config", JSON.stringify(c));
    setCache({}); // saved recipients may belong to the previous setup
  };
  const setCache = (c: Cache) => {
    setCacheState(c);
    sessionStorage.setItem("mercato-cache", JSON.stringify(c));
  };

  return <StoreCtx.Provider value={{ cfg, saveCfg, cache, setCache, ready }}>{children}</StoreCtx.Provider>;
}
