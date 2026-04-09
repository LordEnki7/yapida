import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, User, Package, Wallet, ChefHat, BarChart3, Users, Bike, Building2 } from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/auth";

type NavItem = { icon: typeof Home; label: string; href: string };

const CUSTOMER_NAV: NavItem[] = [
  { icon: Home, label: "Inicio", href: "/customer" },
  { icon: ShoppingBag, label: "Pedidos", href: "/customer/orders" },
];

const DRIVER_NAV: NavItem[] = [
  { icon: Home, label: "Inicio", href: "/driver" },
  { icon: Package, label: "Pedidos", href: "/driver/jobs" },
  { icon: Wallet, label: "Billetera", href: "/driver/wallet" },
];

const BUSINESS_NAV: NavItem[] = [
  { icon: Home, label: "Inicio", href: "/business" },
  { icon: Package, label: "Pedidos", href: "/business/orders" },
  { icon: ChefHat, label: "Menú", href: "/business/menu" },
];

const ADMIN_NAV: NavItem[] = [
  { icon: BarChart3, label: "Overview", href: "/admin" },
  { icon: Users, label: "Usuarios", href: "/admin/users" },
  { icon: Bike, label: "Drivers", href: "/admin/drivers" },
  { icon: Building2, label: "Negocios", href: "/admin/businesses" },
];

const LOGOUT_ITEM = { icon: User, label: "Salir", href: "/" };

export default function BottomNav() {
  const [location] = useLocation();
  const user = getStoredUser();
  if (!user) return null;

  let navItems: NavItem[] = [];
  if (location.startsWith("/customer")) navItems = CUSTOMER_NAV;
  else if (location.startsWith("/driver")) navItems = DRIVER_NAV;
  else if (location.startsWith("/business")) navItems = BUSINESS_NAV;
  else if (location.startsWith("/admin")) navItems = ADMIN_NAV;
  else return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearStoredUser();
    window.location.href = "/";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-yellow-400/20 px-2 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/customer" && item.href !== "/driver" && item.href !== "/business" && item.href !== "/admin" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-1 py-3 px-3 transition-all ${isActive ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"}`}>
                <Icon size={20} className={isActive ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" : ""} />
                <span className="text-xs font-bold">{item.label}</span>
              </div>
            </Link>
          );
        })}
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 py-3 px-3 text-gray-500 hover:text-gray-300 transition">
          <User size={20} />
          <span className="text-xs font-bold">Salir</span>
        </button>
      </div>
    </div>
  );
}
