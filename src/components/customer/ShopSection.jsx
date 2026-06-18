import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import Loader from "../shared/Loader";
import { Filter, Search, X } from "lucide-react";

export default function ShopSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    categories: [],
    sizes: [],
    colors: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Search Query
      if (searchQuery && !product.productName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Category Filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }
      
      // 3. Color Filter
      if (filters.colors.length > 0) {
        const hasColor = product.colors?.some(color => filters.colors.includes(color));
        if (!hasColor) return false;
      }
      
      // 4. Size Filter
      if (filters.sizes.length > 0) {
        const availableSizes = Object.keys(product.sizesAndStock || {}).filter(size => product.sizesAndStock[size] > 0);
        const hasSize = availableSizes.some(size => filters.sizes.includes(size));
        if (!hasSize) return false;
      }
      
      return true;
    });
  }, [products, filters, searchQuery]);

  return (
    <section id="shop-section" className="py-16 bg-white relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-earth-900 mb-2">Our Collection</h2>
            <p className="text-earth-500">Explore our handcrafted bangles and jewellery</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 transition-all"
              />
              <Search className="w-4 h-4 text-earth-400 absolute left-4 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-earth-50 border border-earth-200 rounded-full text-sm font-medium text-earth-700 hover:bg-earth-100"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-10">
          {/* Sidebar */}
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            isOpen={isMobileFilterOpen} 
            setIsOpen={setIsMobileFilterOpen} 
          />
          
          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="py-20">
                <Loader text="Loading collection..." />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-earth-50 rounded-3xl border border-dashed border-earth-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="w-6 h-6 text-earth-400" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-earth-800 mb-1">No products found</h3>
                <p className="text-earth-500 max-w-sm mx-auto">
                  We couldn't find any products matching your current filters. Try adjusting them or clear all filters.
                </p>
                <button 
                  onClick={() => {
                    setFilters({ categories: [], sizes: [], colors: [] });
                    setSearchQuery("");
                  }}
                  className="mt-6 text-sage-600 font-medium hover:text-sage-700 underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
