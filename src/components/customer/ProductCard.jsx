import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Eye } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import { useWishlist } from "../../contexts/WishlistContext";
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
  const [showQuickView, setShowQuickView] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const newProduct = isNew(product);

  const mainImage =
    product.imageUrls?.[0] ||
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop";

  return (
    <>
      <div
        className={`bg-white h-full flex flex-col overflow-hidden relative transition-all duration-200 hover:shadow-card-hover border border-transparent hover:border-gray-200 group ${
          product.isOutOfStock ? "opacity-60" : ""
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
            <div className="absolute top-0 left-0 flex flex-col gap-0.5">
              {product.discountPercentage > 0 && (
                <span className="bg-fk-green text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-br-sm">
                  {product.discountPercentage}% OFF
                </span>
              )}
              {newProduct && (
                <span className="bg-fk-blue text-white text-[10px] font-bold px-1.5 py-0.5">
                  NEW ✨
                </span>
              )}
              {product.isFeatured && !newProduct && (
                <span className="bg-fk-yellow text-white text-[10px] font-bold px-1.5 py-0.5">
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
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Wishlist */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product);
                }}
                className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 ${
                  wishlisted
                    ? "bg-fk-red text-white"
                    : "bg-white text-gray-400 hover:text-fk-red"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${wishlisted ? "fill-white" : ""}`}
                />
              </button>

              {/* Quick View */}
              {!product.isOutOfStock && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowQuickView(true);
                  }}
                  className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-fk-blue hover:scale-110 transition-all"
                  title="Quick View"
                >
                  <Eye className="w-3.5 h-3.5" />
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
                className="absolute top-2 right-2 w-7 h-7 bg-fk-red rounded-full shadow-md flex items-center justify-center group-hover:hidden"
              >
                <Heart className="w-3.5 h-3.5 fill-white text-white" />
              </button>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <Link to={`/product/${product.id}`} className="flex-1 flex flex-col bg-white">
          <div className="p-2.5 md:p-3 flex flex-col flex-1">
            {/* Brand / Category */}
            <div className="text-[10px] md:text-xs font-semibold text-amazon-link hover:underline mb-0.5">
              {product.category}
            </div>

            {/* Product Name */}
            <h3 className="text-xs md:text-sm text-gray-800 hover:text-amazon-link leading-snug mb-1.5 flex-1 line-clamp-2">
              {product.productName}
            </h3>

            {/* Real Rating — Amazon Style (Stars) */}
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating || 4.2) 
                        ? "text-amazon-orange fill-amazon-orange" 
                        : "text-gray-300 fill-gray-200"
                    }`} 
                  />
                ))}
              </div>
              <span className="text-[11px] text-amazon-link hover:underline">
                {product.reviewCount || 12}
              </span>
            </div>

            {/* Pricing — Amazon style */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs text-amazon-red font-medium">
                  -{product.discountPercentage || 0}%
                </span>
                <span className="font-bold text-gray-900 text-base md:text-lg">
                  {formatPrice(product.finalPrice)}
                </span>
              </div>
              {product.discountPercentage > 0 && (
                <p className="text-[11px] text-gray-500">
                  M.R.P.: <span className="line-through">{formatPrice(product.mrp)}</span>
                </p>
              )}
            </div>

            {/* Amazon Delivery Tag */}
            <p className="text-[10px] text-gray-600 mt-1.5">
              {product.finalPrice >= 299 ? (
                <>
                  <span className="font-bold text-amazon-green">FREE Delivery</span> by <span className="font-bold">Tomorrow</span>
                </>
              ) : (
                "Delivery charges apply"
              )}
            </p>
          </div>
        </Link>
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
