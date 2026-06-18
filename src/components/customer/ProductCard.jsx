import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "../../utils/helpers";

export default function ProductCard({ product }) {
  // Use first image or a placeholder
  const mainImage = product.imageUrls?.[0] || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop";
  const hoverImage = product.imageUrls?.[1] || mainImage;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="card h-full flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-medium border-transparent hover:border-earth-200">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isFeatured && (
            <span className="badge bg-gold-500 text-white shadow-sm shadow-gold-500/20">Trending</span>
          )}
          {product.discountPercentage > 0 && (
            <span className="badge bg-rose-500 text-white shadow-sm shadow-rose-500/20">
              {product.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-earth-100">
          <img 
            src={mainImage} 
            alt={product.productName}
            className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0 absolute inset-0"
            loading="lazy"
          />
          <img 
            src={hoverImage} 
            alt={product.productName + " alternate"}
            className="w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 absolute inset-0 transform scale-105 group-hover:scale-100"
            loading="lazy"
          />
          
          {/* Quick Add Button overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <div className="bg-white/90 backdrop-blur-sm text-sage-700 font-medium px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-sage-600 hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">View Details</span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-1 text-xs font-medium text-sage-600 uppercase tracking-wider">
            {product.category}
          </div>
          <h3 className="font-heading font-semibold text-earth-800 text-base leading-snug mb-2 line-clamp-2 flex-1">
            {product.productName}
          </h3>
          
          {/* Pricing */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <span className="font-bold text-earth-900 text-lg">
              {formatPrice(product.finalPrice)}
            </span>
            {product.discountPercentage > 0 && (
              <span className="text-sm text-earth-400 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
          
          {/* Colors available indicator */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-earth-500">{product.colors.length} Colors</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
