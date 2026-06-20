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
          <div className="bg-fk-blue px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base">
                {currentUser ? "My Account" : "Sign In"}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {currentUser
                  ? `Logged in as ${userProfile?.name?.split(" ")[0]}`
                  : "Get order updates & personalized experience"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            {currentUser ? (
              /* Logged-in State */
              <div>
                {/* User Info */}
                <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt={userProfile.name}
                      className="w-12 h-12 rounded-full border-2 border-fk-blue"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-fk-blue flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{userProfile?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-1 mb-5">
                  <Link
                    to="/my-orders"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-fk-blue" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">My Orders</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </Link>
                  <Link
                    to="/track-order"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-fk-green" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Track Order</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                        <LogIn className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              /* Logged-out State */
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-fk-blue" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Sign in to track your orders, save items, and get a personalized experience.
                  </p>
                </div>

                {/* Google Sign-In Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:border-fk-blue hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-fk-blue rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {loading ? "Signing in..." : "Continue with Google"}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or</span>
                  </div>
                </div>

                {/* Guest option */}
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Continue as Guest →
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
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
