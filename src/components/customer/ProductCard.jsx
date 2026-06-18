import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { formatPrice } from "../../utils/helpers";

export default function ProductCard({ product }) {
  // Use first image or a placeholder
  const mainImage = product.imageUrls?.[0] || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop";

  const discountAmt = product.discountPercentage > 0 ? (product.mrp - product.finalPrice) : 0;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className={`bg-white h-full flex flex-col overflow-hidden relative transition-all duration-200 hover:shadow-card-hover border border-transparent hover:border-gray-200 ${product.isOutOfStock ? 'opacity-60' : ''}`}>
        
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <img 
            src={mainImage} 
            alt={product.productName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Discount Badge — Top Left */}
          {product.discountPercentage > 0 && (
            <div className="absolute top-0 left-0">
              <span className="bg-fk-green text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-br-sm">
                {product.discountPercentage}% OFF
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-sm">SOLD OUT</span>
            </div>
          )}

          {/* Wishlist Heart */}
          <button 
            onClick={(e) => e.preventDefault()} 
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          >
            <Heart className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-2.5 md:p-3 flex flex-col flex-1">
          {/* Brand / Category */}
          <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">
            {product.category}
          </div>

          {/* Product Name */}
          <h3 className="text-xs md:text-sm text-gray-700 leading-snug mb-1.5 line-clamp-2 flex-1">
            {product.productName}
          </h3>

          {/* Star Rating placeholder */}
          <div className="flex items-center gap-1 mb-1.5">
            <span className="inline-flex items-center gap-0.5 bg-fk-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              4.2 <Star className="w-2.5 h-2.5 fill-white" />
            </span>
            <span className="text-[10px] text-gray-400">(120)</span>
          </div>
          
          {/* Pricing — Flipkart style */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-sm md:text-base">
              {formatPrice(product.finalPrice)}
            </span>
            {product.discountPercentage > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
                <span className="text-xs text-fk-green font-medium">
                  {product.discountPercentage}% off
                </span>
              </>
            )}
          </div>

          {/* Free Delivery tag */}
          {product.finalPrice >= 299 && (
            <p className="text-[10px] text-gray-500 mt-1">Free delivery</p>
          )}
        </div>
      </div>
    </Link>
  );
}
