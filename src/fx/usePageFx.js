import { createContext, useContext } from "react";
import { pageEffects, useGsap } from "./fx";

export const MainRefContext = createContext({ current: null });

/* Runs the page-level motion effects on <main> once the page has rendered. */
export function usePageFx(deps = []) {
  const main = useContext(MainRefContext);
  useGsap(main, pageEffects, deps);
}
