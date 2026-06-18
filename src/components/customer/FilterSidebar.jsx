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
        <div className="flex items-center justify-between p-3 border-b border-gray-100 lg:hidden bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h2>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-bold text-fk-blue">
                CLEAR ALL
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1.5 bg-white rounded-sm text-gray-500 border border-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filters</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs font-bold text-fk-blue hover:underline"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        <div className="p-3 lg:p-4 space-y-5">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Category</h3>
            <div className="space-y-2">
              {CATEGORIES.map(category => {
                const isActive = filters.categories.includes(category);
                return (
                  <label key={category} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors
                      ${isActive ? "bg-fk-blue border-fk-blue" : "border-gray-300 group-hover:border-fk-blue"}`}>
                      {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm ${isActive ? "text-fk-blue font-medium" : "text-gray-600"}`}>
                      {category}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Sizes */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {BANGLE_SIZES.map(size => {
                const isActive = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleFilter("sizes", size)}
                    className={`min-w-[40px] h-8 px-2 rounded-sm text-xs font-medium border transition-all
                      ${isActive 
                        ? "bg-fk-blue text-white border-fk-blue" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-fk-blue"}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Colors */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Color</h3>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_COLORS.slice(0, 12).map(color => {
                const isActive = filters.colors.includes(color);
                const swatch = COLOR_SWATCHES[color];
                const isGradient = swatch?.includes("gradient");

                return (
                  <button
                    key={color}
                    onClick={() => toggleFilter("colors", color)}
                    title={color}
                    className={`relative w-7 h-7 rounded-full border-2 transition-all duration-200
                      ${isActive ? "ring-2 ring-offset-1 ring-fk-blue scale-110" : "border-gray-200 hover:scale-110"}`}
                    style={{
                      background: isGradient ? swatch : swatch,
                      backgroundColor: isGradient ? undefined : swatch,
                    }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="p-3 border-t border-gray-100 lg:hidden bg-gray-50">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-fk-blue text-white font-bold py-3 rounded-sm text-sm uppercase"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
