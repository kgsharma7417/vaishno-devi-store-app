import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import Loader from "../shared/Loader";
import { ProductCardSkeleton } from "../shared/Skeleton";
import { Filter, Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";

export default function ShopSection({ externalSearch = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    categories: [],
    sizes: [],
    colors: [],
  });
  // Internal search (ShopSection header) — external (HomePage header) takes priority
  const [internalSearch, setInternalSearch] = useState("");
  const searchQuery = externalSearch || internalSearch;
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
              {/* Desktop Search — only shown when no externalSearch active */}
              {!externalSearch && (
              <div className="hidden md:block relative w-48">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {internalSearch && (
                  <button onClick={() => setInternalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              )}
              {externalSearch && (
                <div className="hidden md:flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-bold px-4 py-2 rounded-full border border-violet-100 shadow-sm">
                  <Search className="w-3.5 h-3.5" />
                  Searching: "{externalSearch}"
                </div>
              )}

              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-white border border-slate-200 rounded-full text-xs md:text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-200 shadow-sm"
                >
                  <span className="hidden md:inline font-medium">Sort by:</span>
                  <span className="font-bold text-slate-900">{sortOptions.find(o => o.value === sortBy)?.label.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 ${
                            sortBy === opt.value ? 'text-violet-700 font-bold bg-violet-50/50' : 'text-slate-600 hover:bg-slate-50 hover:pl-5'
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
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-200 relative shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute -top-1 -right-1 border-2 border-white shadow-sm" />
                )}
              </button>
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="px-4 pb-3 md:px-6 flex gap-2 overflow-x-auto scrollbar-hide">
              {filters.categories.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border border-violet-100">
                  {c}
                  <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(x => x !== c) }))} className="hover:bg-violet-200 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.colors.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border border-violet-100">
                  {c}
                  <button onClick={() => setFilters(prev => ({ ...prev, colors: prev.colors.filter(x => x !== c) }))} className="hover:bg-violet-200 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.sizes.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border border-violet-100">
                  Size: {s}
                  <button onClick={() => setFilters(prev => ({ ...prev, sizes: prev.sizes.filter(x => x !== s) }))} className="hover:bg-violet-200 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button 
                onClick={() => setFilters({ categories: [], sizes: [], colors: [] })}
                className="text-[11px] text-rose-600 font-bold whitespace-nowrap px-2 hover:underline tracking-widest uppercase"
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
          <div className="flex-1 min-w-0 bg-slate-50">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white m-3 rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No products found</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mb-6">
                  Try adjusting your filters or search terms.
                </p>
                <button 
                  onClick={() => {
                    setFilters({ categories: [], sizes: [], colors: [] });
                    setInternalSearch("");
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5 text-sm"
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
