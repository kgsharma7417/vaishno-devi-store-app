import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Eye, ShoppingCart } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import QuickViewModal from "./QuickViewModal";

// Products created in last 7 days are "New"
function isNew(product) {
  if (!product.createdAt) return false;
  const created = product.createdAt?.toDate?.() || new Date(product.createdAt);
  const diff = Date.now() - created.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export default function ProductCard({ product }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [showQuickView, setShowQuickView] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const newProduct = isNew(product);

  // Determine if product needs selection (size/color) before adding to cart
  const needsSelection = (
    (product.colors && product.colors.length > 1) ||
    (Object.keys(product.sizesAndStock || {}).length > 1)
  );

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsSelection) {
      setShowQuickView(true);
    } else {
      const size = Object.keys(product.sizesAndStock || {})[0] || "Standard";
      const color = product.colors?.[0] || "Default";
      addToCart(product, size, color, 1, e);
    }
  };

  const mainImage =
    product.imageUrls?.[0] ||
    "/hero/1.png";

  return (
    <>
      <div
        className={`bg-white h-full flex flex-col overflow-hidden relative transition-all duration-300 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-violet-200 group ${
          product.isOutOfStock ? "opacity-60 grayscale-[0.5]" : ""
        }`}
      >
        {/* Image Container */}
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
            <img
              src={mainImage}
              alt={product.productName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Badges — Top Left stack */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
              {product.discountPercentage > 0 && (
                <span className="bg-rose-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm w-fit">
                  {product.discountPercentage}% OFF
                </span>
              )}
              {newProduct && (
                <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm w-fit">
                  NEW ✨
                </span>
              )}
              {product.isFeatured && !newProduct && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm w-fit">
                  🔥 HOT
                </span>
              )}
            </div>

            {/* Out of Stock Overlay */}
            {product.isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-sm">
                  SOLD OUT
                </span>
              </div>
            )}

            {/* Action buttons — appear on hover */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-10">
              {/* Wishlist */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product);
                }}
                className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 ${
                  wishlisted
                    ? "bg-rose-500 text-white"
                    : "bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${wishlisted ? "fill-white" : ""}`}
                />
              </button>

              {/* Quick View */}
              {!product.isOutOfStock && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowQuickView(true);
                  }}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white hover:scale-110 transition-all"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile wishlist — always visible */}
            {wishlisted && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-rose-500 rounded-full shadow-md flex items-center justify-center group-hover:hidden z-10"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
              </button>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <Link to={`/product/${product.id}`} className="flex-1 flex flex-col bg-white">
          <div className="p-3 md:p-4 flex flex-col flex-1">
            {/* Brand / Category */}
            <div className="text-[9px] md:text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1.5">
              {product.category}
            </div>

            {/* Product Name */}
            <h3 className="text-xs md:text-sm text-slate-800 hover:text-violet-700 font-medium leading-snug mb-2 flex-1 line-clamp-2 transition-colors">
              {product.productName}
            </h3>

            {/* Real Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating) 
                          ? "text-amber-400 fill-amber-400" 
                          : "text-slate-200 fill-slate-100"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-500 hover:text-slate-800">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-black text-slate-900 text-base md:text-lg">
                  {formatPrice(product.finalPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-[10px] md:text-xs text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md">
                    {product.discountPercentage}% OFF
                  </span>
                )}
              </div>
              {product.discountPercentage > 0 && (
                <p className="text-[10px] text-slate-400 font-medium">
                  MRP: <span className="line-through">{formatPrice(product.mrp)}</span>
                </p>
              )}
            </div>

            {/* Stock Urgency Tag */}
            {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
              <p className="text-[10px] text-rose-600 font-bold mt-2.5 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Only {product.stockQuantity} left!
              </p>
            )}

            {/* Delivery Tag */}
            <p className="text-[10px] font-medium text-slate-500 mt-2">
              {product.finalPrice >= 299 ? (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-100">
                  ✨ FREE Delivery
                </span>
              ) : (
                "Standard Delivery"
              )}
            </p>
          </div>
        </Link>

        {/* Add to Cart Button */}
        {!product.isOutOfStock && (
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <button
              onClick={handleQuickAdd}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-sm shadow-violet-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {needsSelection ? "Select Options" : "Add to Cart"}
            </button>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal
          product={product}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </>
  );
}
