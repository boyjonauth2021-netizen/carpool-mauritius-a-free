import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { DomainError } from "@/domain/errors";
import { currentUser } from "./actions";
import { loadPersisted, savePersisted } from "./persist";
import { createSeed } from "./seed";
import type { AppState, User } from "./types";

type StoreValue = {
  state: AppState;
  user: User | null;
  run: (fn: (state: AppState) => AppState) => string | null;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadPersisted());
  const ref = useRef(state);
  ref.current = state;

  const run = useCallback((fn: (current: AppState) => AppState) => {
    try {
      const next = fn(ref.current);
      ref.current = next;
      savePersisted(next);
      setState(next);
      return null;
    } catch (error) {
      if (error instanceof DomainError) return error.code;
      console.error(error);
      return "INTERNAL";
    }
  }, []);

  const resetDemo = useCallback(() => {
    const next = createSeed(new Date());
    ref.current = next;
    savePersisted(next);
    setState(next);
  }, []);

  const value = useMemo(
    () => ({ state, user: currentUser(state), run, resetDemo }),
    [state, run, resetDemo],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useApp");
  return value;
}
