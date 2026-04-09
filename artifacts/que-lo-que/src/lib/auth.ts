import { UserRole } from "@workspace/api-client-react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
};

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
};

export const formatDOP = (amount: number): string => {
  return `RD$ ${amount.toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
