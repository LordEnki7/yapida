import { UserRole } from "@workspace/api-client-react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
};

export type AppRole = "customer" | "driver" | "business";

export const getStoredUser = (): AuthUser | null => {
  try {
    const user = localStorage.getItem("qlq_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser) => {
  localStorage.setItem("qlq_user", JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem("qlq_user");
  localStorage.removeItem("qlq_cart");
  localStorage.removeItem("qlq_cart_business");
  localStorage.removeItem("qlq_active_role");
};

/** Returns the role the user is currently browsing in (may differ from their account role). */
export const getActiveRole = (): AppRole => {
  try {
    const r = localStorage.getItem("qlq_active_role");
    if (r === "driver" || r === "business" || r === "customer") return r;
  } catch {}
  const user = getStoredUser();
  const base = user?.role;
  if (base === "driver" || base === "business") return base;
  return "customer";
};

export const setActiveRole = (role: AppRole) => {
  localStorage.setItem("qlq_active_role", role);
};

export const formatDOP = (amount: number): string => {
  return `RD$ ${amount.toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
