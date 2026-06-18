import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white lg:bg-transparent lg:block
        transform transition-transform duration-300 ease-in-out border-r border-earth-100 lg:border-none
        h-full overflow-y-auto lg:overflow-visible p-6 lg:p-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <h2 className="text-xl font-heading font-bold text-earth-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-sage-500" />
            Filters
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-earth-50 rounded-full text-earth-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-semibold text-earth-800">Filters</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-sm font-medium text-sage-600 hover:text-sage-700"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4">Category</h3>
            <div className="space-y-3">
              {CATEGORIES.map(category => (
                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                    ${filters.categories.includes(category) ? "bg-sage-500 border-sage-500" : "border-earth-300 group-hover:border-sage-400"}`}>
                    {filters.categories.includes(category) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${filters.categories.includes(category) ? "text-earth-900 font-medium" : "text-earth-600"}`}>
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-earth-200" />

          {/* Sizes */}
          <div>
            <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4">Size</h3>
            <div className="flex flex-wrap gap-2">
              {BANGLE_SIZES.map(size => {
                const isActive = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleFilter("sizes", size)}
                    className={`w-12 h-10 rounded-lg text-sm font-medium border transition-all
                      ${isActive 
                        ? "bg-earth-800 text-white border-earth-800 shadow-sm" 
                        : "bg-white text-earth-600 border-earth-200 hover:border-earth-400"}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-earth-200" />

          {/* Colors */}
          <div>
            <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4">Color</h3>
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
                    className={`relative w-8 h-8 rounded-full border transition-all duration-200
                      ${isActive ? "ring-2 ring-offset-2 ring-sage-500 scale-110" : "border-black/10 hover:scale-110"}`}
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

        {/* Mobile Clear Button */}
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="w-full mt-8 lg:hidden btn-secondary py-3 text-sm"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </>
  );
}
