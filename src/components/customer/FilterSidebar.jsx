import { X, Check } from "lucide-react";
import { CATEGORIES, BANGLE_SIZES, AVAILABLE_COLORS, COLOR_SWATCHES } from "../../utils/constants";

export default function FilterSidebar({ filters, setFilters, isOpen, setIsOpen }) {
  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type];
      if (current.includes(value)) {
        return { ...prev, [type]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({ categories: [], sizes: [], colors: [] });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.sizes.length > 0 || filters.colors.length > 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-56 bg-white lg:bg-white lg:block
        transform transition-transform duration-300 ease-in-out border-r border-gray-100
        h-full overflow-y-auto lg:overflow-visible
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden bg-slate-50">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filters</h2>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] font-black text-violet-600 tracking-widest">
                CLEAR ALL
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Filters</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-[11px] font-black text-violet-600 hover:text-violet-800 transition-colors tracking-widest"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        <div className="p-4 lg:p-5 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">Category</h3>
            <div className="space-y-3">
              {CATEGORIES.map(category => {
                const isActive = filters.categories.includes(category);
                return (
                  <label key={category} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shadow-sm
                      ${isActive ? "bg-violet-600 border-violet-600" : "border-slate-300 bg-white group-hover:border-violet-400"}`}>
                      {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm transition-colors ${isActive ? "text-violet-700 font-bold" : "text-slate-600 group-hover:text-slate-900 font-medium"}`}>
                      {category}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sizes */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {BANGLE_SIZES.map(size => {
                const isActive = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleFilter("sizes", size)}
                    className={`min-w-[44px] h-9 px-3 rounded-lg text-xs font-bold border-2 transition-all shadow-sm
                      ${isActive 
                        ? "bg-violet-600 text-white border-violet-600 shadow-violet-200" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:text-violet-600"}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Colors */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">Color</h3>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_COLORS.slice(0, 12).map(color => {
                const isActive = filters.colors.includes(color);
                const swatch = COLOR_SWATCHES[color];
                const isGradient = swatch?.includes("gradient");

                return (
                  <button
                    key={color}
                    onClick={() => toggleFilter("colors", color)}
                    title={color}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 shadow-sm
                      ${isActive ? "ring-4 ring-offset-0 ring-violet-100 border-violet-600 scale-110" : "border-slate-200 hover:scale-110 hover:border-slate-300"}`}
                    style={{
                      background: isGradient ? swatch : swatch,
                      backgroundColor: isGradient ? undefined : swatch,
                    }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="p-4 border-t border-slate-100 lg:hidden bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-violet-600 text-white font-black py-3.5 rounded-xl text-sm uppercase tracking-wider shadow-md shadow-violet-200 active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
