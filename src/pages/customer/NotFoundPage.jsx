import { Link } from "react-router-dom";
import { AlertTriangle, Home, ShoppingBag } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-earth-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-black text-earth-800">404</h1>
          <h2 className="text-xl font-semibold text-earth-700">Page Not Found</h2>
          <p className="text-earth-500">
            Oops! The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/#shop-section" className="btn-secondary flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
