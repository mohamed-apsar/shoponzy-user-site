/* The signed-in customer, if any. Guests can still shop and check out. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storeRequest } from "../api/storeApi";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | guest | signed-in

  useEffect(() => {
    let active = true;
    storeRequest("/auth/me")
      .catch((error) => (error.status === 401 ? storeRequest("/auth/refresh", { method: "POST" }) : Promise.reject(error)))
      .then((result) => { if (active) { setUser(result.data.user); setStatus("signed-in"); } })
      .catch(() => { if (active) { setUser(null); setStatus("guest"); } });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await storeRequest("/auth/login", { method: "POST", body: { email, password } });
    setUser(result.data.user);
    setStatus("signed-in");
    return result.data.user;
  }, []);

  const register = useCallback(async (values) => {
    const result = await storeRequest("/auth/register", { method: "POST", body: values });
    setUser(result.data.user);
    setStatus("signed-in");
    return result.data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await storeRequest("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const value = { user, status, signedIn: status === "signed-in", setUser, signIn, register, signOut };
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used inside CustomerProvider");
  return ctx;
}
