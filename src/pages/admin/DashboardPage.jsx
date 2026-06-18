import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { LOW_STOCK_THRESHOLD } from "../../utils/constants";
import { formatPrice, getLowStockSizes, getOutOfStockSizes } from "../../utils/helpers";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../../components/shared/Loader";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalValue = 0;

        products.forEach((product) => {
          const lowSizes = getLowStockSizes(product.sizesAndStock || {}, LOW_STOCK_THRESHOLD);
          const outSizes = getOutOfStockSizes(product.sizesAndStock || {});
          if (lowSizes.length > 0) lowStockCount++;
          if (outSizes.length > 0) outOfStockCount++;
          totalValue += product.finalPrice || 0;
        });

        setStats({
          totalProducts: products.length,
          lowStockCount,
          outOfStockCount,
          totalValue,
        });
        setRecentProducts(products.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-earth-800">
          Dashboard
        </h1>
        <p className="text-earth-400 mt-1">
          Overview of your jewellery store
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-sage-600" />
            </div>
            <div>
              <p className="text-sm text-earth-400">Total Products</p>
              <p className="text-2xl font-heading font-bold text-earth-800">
                {stats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-sm text-earth-400">Low Stock Items</p>
              <p className="text-2xl font-heading font-bold text-gold-600">
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-earth-400">Out of Stock</p>
              <p className="text-2xl font-heading font-bold text-rose-500">
                {stats.outOfStockCount}
              </p>
            </div>
          </div>
        </div>

        {/* Catalogue Value */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-earth-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-earth-600" />
            </div>
            <div>
              <p className="text-sm text-earth-400">Catalogue Value</p>
              <p className="text-2xl font-heading font-bold text-earth-800">
                {formatPrice(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-heading font-semibold text-earth-700">
              Recent Products
            </h2>
            <Link
              to="/admin/inventory"
              className="text-sm text-sage-600 hover:text-sage-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-earth-200 mx-auto mb-3" />
              <p className="text-earth-400">No products added yet</p>
              <Link to="/admin/upload" className="btn-primary mt-4 inline-flex">
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-earth-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-earth-100 flex-shrink-0">
                    {product.imageUrls?.[0] ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-earth-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-700 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-earth-400">{product.category}</p>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-semibold text-sage-700">
                    {formatPrice(product.finalPrice)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-5">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/upload"
              className="flex items-center gap-4 p-4 rounded-xl bg-sage-50 border border-sage-100
                         hover:bg-sage-100 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center
                              group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-sage-700">Add New Product</p>
                <p className="text-xs text-sage-500">
                  Upload bangles and jewellery to your store
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-sage-400 ml-auto" />
            </Link>

            <Link
              to="/admin/inventory"
              className="flex items-center gap-4 p-4 rounded-xl bg-earth-50 border border-earth-100
                         hover:bg-earth-100 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-earth-500 flex items-center justify-center
                              group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-earth-700">Manage Inventory</p>
                <p className="text-xs text-earth-500">
                  Update stock, edit products, check low-stock alerts
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-earth-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
