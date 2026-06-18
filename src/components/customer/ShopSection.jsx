import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import Loader from "../shared/Loader";
import { Filter, Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";

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
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  // Filter + Sort logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
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

    // Sort
    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      case "discount":
        result = [...result].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
      case "newest":
      default:
        break; // already sorted by createdAt desc
    }
    return result;
  }, [products, filters, searchQuery, sortBy]);

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price — Low to High" },
    { value: "price-high", label: "Price — High to Low" },
    { value: "discount", label: "Discount" },
  ];

  const hasActiveFilters = filters.categories.length > 0 || filters.sizes.length > 0 || filters.colors.length > 0;

  return (
    <section id="shop-section" className="mt-2 md:mt-3 relative z-30">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header with Filter/Sort Controls */}
        <div className="bg-white border-b border-gray-100 sticky top-[52px] md:top-[56px] z-30">
          <div className="px-3 py-2.5 md:px-6 md:py-3 flex items-center justify-between gap-3">
            
            {/* Left: Title + Count */}
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm md:text-lg font-bold text-gray-900 whitespace-nowrap">All Products</h2>
              <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                (Showing {filteredProducts.length} of {products.length})
              </span>
            </div>

            {/* Right: Search, Sort, Filter */}
            <div className="flex items-center gap-2">
              {/* Desktop Search */}
              <div className="hidden md:block relative w-48">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-fk-blue"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 bg-white border border-gray-200 rounded-sm text-xs md:text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="hidden md:inline">Sort by:</span>
                  <span className="font-medium text-gray-900">{sortOptions.find(o => o.value === sortBy)?.label.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                
                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-sm shadow-medium z-50">
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-fk-blue-light transition-colors ${
                            sortBy === opt.value ? 'text-fk-blue font-medium bg-fk-blue-light' : 'text-gray-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-sm text-xs text-gray-700 hover:bg-gray-50 relative"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 bg-fk-blue rounded-full absolute -top-0.5 -right-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="px-3 pb-2 md:px-6 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {filters.categories.map(c => (
                <span key={c} className="inline-flex items-center gap-1 bg-fk-blue-light text-fk-blue text-[10px] font-medium px-2 py-0.5 rounded-sm whitespace-nowrap">
                  {c}
                  <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(x => x !== c) }))}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {filters.colors.map(c => (
                <span key={c} className="inline-flex items-center gap-1 bg-fk-blue-light text-fk-blue text-[10px] font-medium px-2 py-0.5 rounded-sm whitespace-nowrap">
                  {c}
                  <button onClick={() => setFilters(prev => ({ ...prev, colors: prev.colors.filter(x => x !== c) }))}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {filters.sizes.map(s => (
                <span key={s} className="inline-flex items-center gap-1 bg-fk-blue-light text-fk-blue text-[10px] font-medium px-2 py-0.5 rounded-sm whitespace-nowrap">
                  Size: {s}
                  <button onClick={() => setFilters(prev => ({ ...prev, sizes: prev.sizes.filter(x => x !== s) }))}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <button 
                onClick={() => setFilters({ categories: [], sizes: [], colors: [] })}
                className="text-[10px] text-fk-blue font-bold whitespace-nowrap px-1"
              >
                CLEAR ALL
              </button>
            </div>
          )}
        </div>

        <div className="flex">
          {/* Sidebar — Desktop only */}
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            isOpen={isMobileFilterOpen} 
            setIsOpen={setIsMobileFilterOpen} 
          />
          
          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="py-20 bg-white">
                <Loader text="Loading products..." />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px] md:gap-[1px] bg-gray-100">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <button 
                  onClick={() => {
                    setFilters({ categories: [], sizes: [], colors: [] });
                    setSearchQuery("");
                  }}
                  className="text-fk-blue font-medium text-sm hover:underline"
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
