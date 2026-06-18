import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-fk-blue-light rounded-full flex items-center justify-center mb-4">
        <Search className="w-10 h-10 text-fk-blue" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 bg-fk-blue text-white font-bold py-3 px-6 rounded-sm text-sm uppercase hover:bg-fk-blue-dark transition-colors"
      >
        <Home className="w-4 h-4" />
        Go to Homepage
      </Link>
    </div>
  );
}
