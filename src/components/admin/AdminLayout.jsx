import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  LogOut,
  Sparkles,
  Menu,
  X,
  Settings,
  ShoppingBag,
  Users
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/admin/upload",
    icon: PackagePlus,
    label: "Upload Product",
  },
  {
    to: "/admin/orders",
    icon: ShoppingBag,
    label: "Orders",
  },
  {
    to: "/admin/inventory",
    icon: Boxes,
    label: "Inventory",
  },
  {
    to: "/admin/users",
    icon: Users,
    label: "Users",
  },
  {
    to: "/admin/settings",
    icon: Settings,
    label: "Settings",
  },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100
                    flex flex-col transform transition-transform duration-300 ease-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-heading font-bold text-slate-800 tracking-tight leading-tight">
                MAA VAISHNO DEVI
              </h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                 transition-all duration-200
                 ${
                   isActive
                     ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                 }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-700">
                {currentUser?.email?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-earth-700 truncate">
                {currentUser?.email || "Admin"}
              </p>
              <p className="text-xs text-slate-400">Store Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                       text-rose-500 hover:bg-rose-50 w-full transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Online
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
