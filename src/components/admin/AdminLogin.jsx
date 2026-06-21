import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Eye, EyeOff, LogIn, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "../shared/Toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// Google "G" Logo SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { addToast } = useToast();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: "warning", message: "Please fill in all fields." });
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Verify this user is actually an admin
      const adminDoc = await getDoc(doc(db, "admins", result.user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
        await auth.signOut();
        addToast({ type: "error", message: "Access denied. You are not an admin." });
        setLoading(false);
        return;
      }
      addToast({ type: "success", message: "Welcome back! Dashboard open ho raha hai..." });
      navigate("/admin/dashboard");
    } catch (error) {
      let message = "Login failed. Please try again.";
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/invalid-credential":
          message = "Invalid email or password.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
      }
      addToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        addToast({ type: "error", message: result.message || "Google login failed." });
        setGoogleLoading(false);
        return;
      }
      // Check admin status
      const adminDoc = await getDoc(doc(db, "admins", result.user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
        await auth.signOut();
        addToast({ type: "error", message: "Access denied. Your Google account is not an admin." });
        setGoogleLoading(false);
        return;
      }
      addToast({ type: "success", message: `Welcome, ${result.user.displayName?.split(" ")[0]}! Admin Dashboard open ho raha hai...` });
      navigate("/admin/dashboard");
    } catch (err) {
      addToast({ type: "error", message: "Google login failed. Please try again." });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4 relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Back to store */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Store par wapas jaayein
        </Link>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/30 mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Maa Vaishno Devi — Admin Panel
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Signing in..." : "Google se Admin Login"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 border-t border-white/15" />
            <span className="text-slate-500 text-xs">ya Email se login karein</span>
            <div className="flex-1 border-t border-white/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Login ho raha hai...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Email se Login karein
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            🔒 Sirf authorized personnel ke liye — Dukaan ke malik se access lein
          </p>
        </div>
      </div>
    </div>
  );
}

