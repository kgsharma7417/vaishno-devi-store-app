// Shimmer skeleton for product cards
export function ProductCardSkeleton() {
  return (
    <div className="bg-white animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-2.5 md:p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

// Shimmer for product page
export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-14 bg-fk-blue" />
      <div className="max-w-7xl mx-auto md:px-6 md:py-4">
        <div className="md:grid md:grid-cols-2 md:gap-6 md:bg-white md:p-6">
          <div className="aspect-square bg-gray-200" />
          <div className="bg-white px-3 py-4 space-y-4">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-1 bg-gray-100 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gray-200" />
              ))}
            </div>
            <div className="h-1 bg-gray-100 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-10 rounded-sm bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmer for order card
export function OrderCardSkeleton() {
  return (
    <div className="bg-white shadow-card animate-pulse">
      <div className="p-3 md:p-4 flex gap-3">
        <div className="w-16 h-20 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="px-3 py-2.5 border-t border-gray-100 flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

// Generic shimmer row
export function ShimmerRow({ className = "" }) {
  return (
    <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
  );
}
