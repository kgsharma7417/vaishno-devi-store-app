import { useState, useEffect } from "react";
import { X, LogIn, LogOut, User, ShoppingBag, Package, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../shared/Toast";
import { Link } from "react-router-dom";

// Google "G" Logo SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function UserLoginModal({ isOpen, onClose }) {
  const { currentUser, userProfile, loginWithGoogle, logout, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success) {
      addToast({ type: "success", message: `Welcome, ${result.user.displayName?.split(" ")[0]}! 🎉` });
      onClose();
    } else {
      addToast({ type: "error", message: result.message || "Login failed. Please try again." });
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast({ type: "success", message: "Successfully logged out." });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[200] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] max-w-sm mx-auto animate-scale-in">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-violet-600 px-6 py-5 flex items-center justify-between border-b border-violet-700">
            <div>
              <h2 className="text-white font-black text-lg tracking-tight">
                {currentUser ? "My Account" : "Sign In"}
              </h2>
              <p className="text-violet-100 text-[11px] font-medium mt-1">
                {currentUser
                  ? `Logged in as ${userProfile?.name?.split(" ")[0]}`
                  : "Get order updates & personalized experience"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-violet-100 hover:text-white hover:bg-violet-500 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {currentUser ? (
              /* Logged-in State */
              <div>
                {/* User Info */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt={userProfile.name}
                      className="w-14 h-14 rounded-full border-2 border-violet-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-violet-600 shadow-sm flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{userProfile?.name}</p>
                    <p className="text-xs font-medium text-slate-500 truncate">{userProfile?.email}</p>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-2 mb-6">
                  <Link
                    to="/my-orders"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-violet-50 group-hover:bg-violet-100 rounded-full flex items-center justify-center transition-colors">
                      <Package className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-violet-700 transition-colors">My Orders</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-violet-500 transition-colors" />
                  </Link>
                  <Link
                    to="/track-order"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Track Order</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-emerald-500 transition-colors" />
                  </Link>
                  {isAdmin ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-amber-50 group-hover:bg-amber-100 rounded-full flex items-center justify-center transition-colors">
                        <LogIn className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-amber-500 transition-colors" />
                    </Link>
                  ) : (
                    <Link
                      to="/admin/login"
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-slate-100 group-hover:bg-violet-100 rounded-full flex items-center justify-center transition-colors">
                        <LogIn className="w-5 h-5 text-slate-500 group-hover:text-violet-600 transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-violet-700 transition-colors">Login as Admin</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-violet-500 transition-colors" />
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              /* Logged-out State */
              <div>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-100 shadow-sm">
                    <User className="w-10 h-10 text-violet-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                    Sign in to track your orders, save items, and get a personalized experience.
                  </p>
                </div>

                {/* Google Sign-In Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-violet-600 hover:bg-violet-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm group active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {loading ? "Signing in..." : "Continue with Google"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-widest">or</span>
                  </div>
                </div>

                {/* Guest option */}
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Continue as Guest →
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                </div>

                {/* Admin Login */}
                <Link
                  to="/admin/login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-600 hover:text-violet-700 transition-all font-bold border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50"
                >
                  <LogIn className="w-4 h-4" />
                  Login as Admin
                </Link>

                <p className="text-[10px] text-slate-400 font-medium text-center mt-4 leading-relaxed px-4">
                  By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
