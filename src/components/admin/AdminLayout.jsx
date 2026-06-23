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
  Users,
  Bell,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { LOW_STOCK_THRESHOLD } from "../../utils/constants";
import { getLowStockSizes, getOutOfStockSizes } from "../../utils/helpers";

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
    to: "/admin/reviews",
    icon: MessageSquare,
    label: "Reviews",
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
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const prodSnapshot = await getDocs(collection(db, "products"));
        const products = prodSnapshot.docs.map(doc => doc.data());

        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const activeNotifs = [];

        products.forEach(p => {
          const outSizes = getOutOfStockSizes(p.sizesAndStock || {});
          if (outSizes.length > 0) {
            activeNotifs.push({
              id: `out-${p.productName}`,
              type: 'outOfStock',
              message: `⚠️ ${p.productName} is out of stock! (स्टॉक ख़त्म)`,
              link: '/admin/inventory'
            });
          } else {
            const lowSizes = getLowStockSizes(p.sizesAndStock || {}, LOW_STOCK_THRESHOLD);
            if (lowSizes.length > 0) {
              activeNotifs.push({
                id: `low-${p.productName}`,
                type: 'stock',
                message: `📉 ${p.productName} (Size ${lowSizes.join(', ')}) running low! (स्टॉक कम है)`,
                link: '/admin/inventory'
              });
            }
          }
        });

        orders.forEach(o => {
          if (o.orderStatus === 'Pending') {
            activeNotifs.push({
              id: `order-${o.id}`,
              type: 'order',
              message: `📦 New order #${o.id.slice(-8)} is pending! (नया आर्डर)`,
              link: '/admin/orders'
            });
          }
        });

        setNotifications(activeNotifs);
      } catch (err) {
        console.error("Error fetching admin notifications:", err);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000);
    return () => clearInterval(interval);
  }, []);

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
            
            {/* Notification Bell & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl z-50 p-2 py-3 animate-fade-in">
                  <div className="px-3 pb-2 border-b border-slate-100 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Alert Center</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">{notifications.length} Alerts</span>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                      ✓ No alerts or pending tasks.<br/>
                      (कोई सूचना नहीं है)
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notif, idx) => (
                        <NavLink
                          key={idx}
                          to={notif.link}
                          onClick={() => setNotifDropdownOpen(false)}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="text-xs text-slate-700 leading-relaxed font-medium">
                            {notif.message}
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
