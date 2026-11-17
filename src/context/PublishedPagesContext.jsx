import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { storeRequest } from "../api/storeApi";

const PublishedPagesContext = createContext({ pages: [], loading: true, error: "" });

export function PublishedPagesProvider({ children }) {
  const [state, setState] = useState({ pages: [], loading: true, error: "" });
  const { pathname } = useLocation();
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const request = ++sequence;
      try {
        const result = await storeRequest("/pages");
        if (active && request === sequence) setState({ pages: result.data, loading: false, error: "" });
      } catch (error) {
        if (active && request === sequence) setState({ pages: [], loading: false, error: error.message });
      }
    }
    setState({ pages: [], loading: true, error: "" });
    refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [pathname]);
  return <PublishedPagesContext.Provider value={state}>{children}</PublishedPagesContext.Provider>;
}

export const usePublishedPages = () => useContext(PublishedPagesContext);
