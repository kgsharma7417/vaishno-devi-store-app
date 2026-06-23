import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/helpers";
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WishlistDrawer() {
  const { isWishlistOpen, setIsWishlistOpen, wishlistItems, toggleWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!isWishlistOpen) return null;

  const handleProductClick = (id) => {
    setIsWishlistOpen(false);
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (item) => {
    // Add to cart with default parameters (or first size)
    // Since item in wishlist might not have full product details, we can add it to cart directly
    // default size '2.4' or first one, since it is a bangle store
    addToCart(
      {
        id: item.id,
        productName: item.name,
        imageUrls: [item.image],
        finalPrice: item.price,
        mrp: item.mrp,
        discountPercentage: item.discount,
        sizesAndStock: { "2.4": 10 }
      },
      "2.4", // Default size
      "Gold", // Default color
      1
    );
    // Remove from wishlist after adding to cart
    toggleWishlist(item);
    setIsWishlistOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-96 bg-gray-50 shadow-2xl flex flex-col transform animate-fade-in-right">
        
        {/* Header — Premium Glass */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-wide">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            My Wishlist ({wishlistItems.length})
          </h2>
          <button 
            onClick={() => setIsWishlistOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto">
          {wishlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 p-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <Heart className="w-10 h-10 text-slate-350" />
              </div>
              <p className="font-black text-slate-800 text-lg tracking-tight">Your wishlist is empty</p>
              <p className="text-sm text-slate-500 text-center font-medium">Add items you love to save them for later.</p>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="bg-violet-600 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-violet-700 hover:shadow-md transition-all mt-4 shadow-sm"
              >
                Explore Bangles
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-3 md:p-5">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:border-violet-100 transition-colors">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div 
                      className="w-24 h-28 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 cursor-pointer"
                      onClick={() => handleProductClick(item.id)}
                    >
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 
                          className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight cursor-pointer hover:text-violet-700"
                          onClick={() => handleProductClick(item.id)}
                        >
                          {item.name}
                        </h3>
                        <button 
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full flex-shrink-0 transition-colors"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-black text-slate-900 text-sm md:text-base">
                          {formatPrice(item.price)}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                      </div>

                      {/* Action buttons inside item */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs py-2 px-3 rounded-xl border border-violet-100 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleProductClick(item.id)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-colors"
                          title="View Details"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wishlistItems.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 z-10 flex gap-3">
            <button
              onClick={() => {
                if (window.confirm("Clear all items from wishlist?")) {
                  clearWishlist();
                }
              }}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl text-xs uppercase transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </>
  );
}
