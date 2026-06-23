import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { Link } from "react-router-dom";
import { PackageOpen, Edit, Trash2, Loader2, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "../../utils/constants";

export default function InventoryPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      addToast({ type: "error", message: "Failed to fetch products." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    
    setDeletingId(productId);
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      addToast({ type: "success", message: "Product deleted successfully." });
    } catch (error) {
      console.error("Error deleting product:", error);
      addToast({ type: "error", message: "Failed to delete product." });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleOutOfStock = async (productId, currentStatus) => {
    setUpdatingId(productId);
    try {
      await updateDoc(doc(db, "products", productId), {
        isOutOfStock: !currentStatus
      });
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isOutOfStock: !currentStatus } : p
      ));
      addToast({ type: "success", message: `Product marked as ${!currentStatus ? 'Out of Stock' : 'In Stock'}.` });
    } catch (error) {
      console.error("Error updating status:", error);
      addToast({ type: "error", message: "Failed to update product status." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickStockChange = async (productId, size, newStock) => {
    if (newStock < 0) return;
    setUpdatingId(productId);
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const updatedSizesAndStock = {
        ...product.sizesAndStock,
        [size]: newStock
      };

      const totalStock = Object.values(updatedSizesAndStock).reduce((a, b) => a + b, 0);
      const isOutOfStock = totalStock === 0;

      await updateDoc(doc(db, "products", productId), {
        sizesAndStock: updatedSizesAndStock,
        isOutOfStock: isOutOfStock
      });

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, sizesAndStock: updatedSizesAndStock, isOutOfStock: isOutOfStock } : p
      ));

      addToast({ type: "success", message: `Stock for size ${size} updated to ${newStock}.` });
    } catch (error) {
      console.error("Error updating quick stock:", error);
      addToast({ type: "error", message: "Failed to update stock." });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800">
            Inventory
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your store's products, stock, and pricing.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
            />
          </div>
          <Link to="/admin/upload" className="btn-primary whitespace-nowrap text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors">
            Add New
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold text-left">Stock / Sizes</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No products found.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${product.isOutOfStock ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {product.imageUrls?.[0] ? (
                            <img src={product.imageUrls[0]} alt={product.productName} className="w-full h-full object-cover" />
                          ) : (
                            <PackageOpen className="w-6 h-6 m-auto text-slate-400 mt-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-xs" title={product.productName}>
                            {product.productName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">ID: {product.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{formatPrice(product.finalPrice)}</p>
                      {product.discountPercentage > 0 && (
                        <p className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      {Object.keys(product.sizesAndStock || {}).length === 0 ? (
                        <span className="text-xs text-slate-400 font-medium">No sizes defined</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 items-center max-w-[260px] sm:max-w-sm">
                          {Object.entries(product.sizesAndStock || {}).map(([size, stock]) => (
                            <div key={size} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-1 rounded-lg text-xs font-semibold">
                              <span className="text-slate-550 mr-1">{size}:</span>
                              <button 
                                disabled={updatingId === product.id}
                                onClick={() => handleQuickStockChange(product.id, size, stock - 1)}
                                className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className={`w-5 text-center font-bold ${stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600 font-bold' : 'text-slate-850'}`}>
                                {stock}
                              </span>
                              <button 
                                disabled={updatingId === product.id}
                                onClick={() => handleQuickStockChange(product.id, size, stock + 1)}
                                className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleOutOfStock(product.id, product.isOutOfStock)}
                        disabled={updatingId === product.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          product.isOutOfStock 
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {updatingId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : product.isOutOfStock ? (
                          <><XCircle className="w-3.5 h-3.5" /> Out of Stock</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> In Stock</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/upload?edit=${product.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
