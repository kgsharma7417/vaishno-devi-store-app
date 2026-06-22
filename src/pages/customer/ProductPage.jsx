import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import Loader from "../../components/shared/Loader";
import SizeGuideModal from "../../components/customer/SizeGuideModal";
import ReviewsSection from "../../components/customer/ReviewsSection";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useRecentlyViewed } from "../../contexts/RecentlyViewedContext";
import { formatPrice } from "../../utils/helpers";
import { COLOR_SWATCHES } from "../../utils/constants";
import { useSEO } from "../../hooks/useSEO";
import { 
  ArrowLeft, Check, Share2,
  Ruler, Truck, ShieldCheck, Video, ShoppingCart, 
  Heart, ChevronRight, Zap, MapPin, RotateCcw, Star, XCircle
} from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dynamic SEO
  useSEO({
    title: product ? product.productName : "Product Details",
    description: product
      ? `Buy ${product.productName} at ${formatPrice(product.finalPrice)}. ${product.description?.slice(0, 100) || ''} — Maa Vaishno Devi Ladies Corner & Gift Center`
      : undefined,
    image: product?.imageUrls?.[0],
  });
  
  // Selections
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          addRecentlyViewed(data); // Track this view
          // Set default selections
          if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
          if (data.sizesAndStock) {
            const firstAvailable = Object.keys(data.sizesAndStock).find(
              (s) => data.sizesAndStock[s] > 0
            );
            if (firstAvailable) setSelectedSize(firstAvailable);
          }

          // Fetch Related Products (Frequently Bought Together)
          try {
            const q = query(
              collection(db, "products"),
              where("category", "==", data.category || "Bangles"),
              limit(3)
            );
            const rSnap = await getDocs(q);
            const items = rSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => item.id !== data.id)
              .slice(0, 2); // Get up to 2 items
            setRelatedProducts(items);
          } catch (rErr) {
            console.error("Error fetching related products:", rErr);
          }

        } else {
          addToast({ type: "error", message: "Product not found." });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        addToast({ type: "error", message: "Failed to load product details." });
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, addToast]);

  const handleAddToCart = (navigateToCheckout = false, clickEvent = null) => {
    if (product.isOutOfStock) {
      addToast({ type: "error", message: "This product is currently out of stock." });
      return false;
    }
    
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      addToast({ type: "warning", message: "Please select a color first." });
      return false;
    }
    
    const availableSizes = Object.keys(product.sizesAndStock || {});
    if (availableSizes.length > 0 && !selectedSize) {
      addToast({ type: "warning", message: "Please select a size first." });
      return false;
    }

    addToCart(product, selectedSize || "Standard", selectedColor || "Default", 1, clickEvent);
    if (navigateToCheckout) {
      setTimeout(() => navigate('/checkout'), 300);
    }
    return true;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.productName,
        text: `Check out ${product.productName} on Maa Vaishno Devi Ladies Corner & Gift Center!`,
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: "success", message: "Link copied to clipboard!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="large" text="Loading product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  const availableSizes = Object.keys(product.sizesAndStock || {});
  const discountAmt = product.discountPercentage > 0 ? (product.mrp - product.finalPrice) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4 font-body animate-fade-in">
      
      {/* Top Nav — Amazon style */}
      <header className="bg-amazon-dark sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center h-12 md:h-14 gap-3">
            <Link to="/" className="text-white p-1 hover:outline hover:outline-1 hover:outline-white rounded-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{product.productName}</p>
              <p className="text-amazon-yellow text-[10px] font-semibold">{product.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleShare} className="p-2 text-white/90 hover:text-white hover:outline hover:outline-1 hover:outline-white rounded-sm">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="p-2 text-white/90 hover:text-white hover:outline hover:outline-1 hover:outline-white rounded-sm relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-amazon-orange text-amazon-dark text-[10px] font-black px-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto md:px-6 md:py-4">
        <div className="md:grid md:grid-cols-2 md:gap-6 md:bg-white md:shadow-card md:p-6">
          
          {/* Left: Image Gallery */}
          <div className="bg-white">
            {/* Main Image */}
            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-white">
              <img 
                src={product.imageUrls[mainImageIndex]} 
                alt={product.productName} 
                className="w-full h-full object-contain"
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                {product.isFeatured && (
                  <span className="bg-amazon-orange text-amazon-dark text-[10px] font-bold px-2 py-0.5 rounded-sm">BEST SELLER</span>
                )}
                {product.discountPercentage > 0 && (
                  <span className="bg-amazon-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">-{product.discountPercentage}% DEAL</span>
                )}
              </div>

              {/* Wishlist */}
              <button className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50">
                <Heart className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Thumbnails */}
            {product.imageUrls.length > 1 && (
              <div className="flex gap-2 px-3 py-2 md:px-0 md:py-3 overflow-x-auto scrollbar-hide border-t border-gray-100">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setMainImageIndex(index)}
                    className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 border-2 overflow-hidden transition-all
                      ${mainImageIndex === index ? "border-amazon-orange" : "border-gray-200 opacity-70 hover:opacity-100"}`}
                  >
                    <img src={url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="bg-white px-3 py-4 md:px-0 md:py-0 space-y-4">
            
            {/* Category */}
            <p className="text-xs text-gray-500">{product.category}</p>

            {/* Title */}
            <h1 className="text-base md:text-xl font-medium text-gray-800 leading-snug">
              {product.productName}
            </h1>

            {/* Rating — Amazon Stars */}
            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating) 
                          ? "text-amazon-orange fill-amazon-orange" 
                          : "text-gray-300 fill-gray-200"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-xs text-amazon-link hover:underline cursor-pointer" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({behavior: 'smooth'})}>
                  {product.reviewCount} reviews
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-1">No reviews yet</div>
            )}

            {/* Special offer tag */}
            <div className="flex items-center gap-1.5 text-fk-green text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Special Price</span>
            </div>

            {/* COD Availability Badge */}
            {product.isCodAvailable !== false ? (
              <div className="flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-sm w-fit border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" /> Cash on Delivery Available
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2 bg-rose-50 text-rose-700 text-xs font-bold px-2 py-1 rounded-sm w-fit border border-rose-100">
                <CreditCard className="w-3.5 h-3.5" /> Online Payment Only (COD Disabled)
              </div>
            )}

            {/* Pricing — Amazon style */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.finalPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-sm text-amazon-red font-semibold">
                    -{product.discountPercentage}% Deal
                  </span>
                )}
              </div>
              {product.discountPercentage > 0 && (
                <p className="text-xs text-gray-500">
                  M.R.P.: <span className="line-through">{formatPrice(product.mrp)}</span> (Save {formatPrice(discountAmt)})
                </p>
              )}
            </div>

            {product.isOutOfStock && (
              <div className="bg-fk-red-light text-fk-red px-3 py-2 rounded-sm text-sm font-semibold">
                Currently Out of Stock
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Color: <span className="font-normal text-gray-500 capitalize">{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors?.map(color => {
                      const isActive = selectedColor === color;
                      const swatch = COLOR_SWATCHES[color];
                      const isGradient = swatch?.includes("gradient");

                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`relative w-9 h-9 rounded-full border-2 transition-all duration-200
                            ${isActive ? "border-amazon-orange ring-2 ring-offset-1 ring-amazon-orange/30 scale-110" : "border-gray-200 hover:scale-110"}`}
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
                <hr className="border-gray-100" />
              </>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Size</h3>
                    {!(availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size")) && (
                      <button 
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-xs font-bold text-amazon-link flex items-center gap-1 hover:underline"
                      >
                        <Ruler className="w-3 h-3" /> SIZE GUIDE
                      </button>
                    )}
                  </div>
                  
                  {availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size") ? (
                    <div className="inline-flex items-center gap-1.5 bg-sage-50 text-sage-700 text-sm font-semibold px-4 py-2 rounded border border-sage-100">
                      ✨ Standard Free Size (No sizing required)
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => {
                        const stock = product.sizesAndStock[size];
                        const isOutOfStock = stock === 0;
                        const isLowStock = stock > 0 && stock <= 2;
                        const isActive = selectedSize === size;

                        return (
                          <div key={size} className="relative">
                            <button
                              disabled={isOutOfStock}
                              onClick={() => setSelectedSize(size)}
                              className={`w-12 h-10 rounded-sm text-sm font-semibold border-2 transition-all
                                ${isActive 
                                  ? "bg-amazon-orange text-amazon-dark border-amazon-orange" 
                                  : isOutOfStock 
                                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through" 
                                    : "bg-white text-gray-700 border-gray-200 hover:border-amazon-orange"}`}
                            >
                              {size}
                            </button>
                            {isLowStock && !isOutOfStock && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-fk-red rounded-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedSize && product.sizesAndStock[selectedSize] <= 2 && product.sizesAndStock[selectedSize] > 0 && (
                    <p className="text-xs text-fk-red mt-2 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Hurry, only {product.sizesAndStock[selectedSize]} left!
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />
              </>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 py-3">
              <div className="flex flex-col items-center text-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">Free Delivery<br/><span className="font-normal text-gray-500">Above ₹299</span></span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">Secure<br/><span className="font-normal text-gray-500">Payment</span></span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">Easy<br/><span className="font-normal text-gray-500">Returns</span></span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Product Details</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>

             {/* Video Link if exists */}
            {product.videoUrl && (
              <a 
                href={product.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-sm hover:bg-gray-100 transition-colors group"
              >
                <div className="w-10 h-10 bg-white rounded-sm shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5 text-fk-red" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">Watch Product Video</p>
                  <p className="text-[10px] text-gray-500">See how it looks in real life</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        </div>

        {/* Frequently Bought Together / Complete the Look */}
        {relatedProducts.length > 0 && (
          <div className="bg-white p-4 md:p-6 shadow-card mt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Frequently Bought Together</h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map(item => (
                <Link 
                  key={item.id} 
                  to={`/product/${item.id}`}
                  className="flex gap-3 items-center p-3 border border-gray-100 hover:border-amazon-orange/45 rounded transition-all"
                >
                  <div className="w-14 h-16 bg-gray-50 overflow-hidden flex-shrink-0">
                    <img src={item.imageUrls?.[0]} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.productName}</p>
                    <p className="text-xs font-bold text-gray-900 mt-1">{formatPrice(item.finalPrice)}</p>
                    <span className="text-[9px] text-amazon-link font-bold uppercase mt-0.5 inline-block">View Match</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-4">
          <ReviewsSection productId={product.id} />
        </div>
      </main>

      {/* Mobile Sticky Bottom — ADD TO CART + BUY NOW */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex md:hidden">
        <button 
          onClick={(e) => handleAddToCart(false, e)}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase border-r border-gray-200 transition-colors
            ${product.isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-white text-amazon-dark hover:bg-gray-50'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button 
          onClick={(e) => handleAddToCart(true, e)}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase transition-colors
            ${product.isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-amazon-orange text-amazon-dark hover:bg-amazon-orange/95'}`}
        >
          <Zap className="w-4 h-4" />
          Buy Now
        </button>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 mt-4">
        <div className="bg-white shadow-card p-6 flex gap-4">
          <button 
            onClick={(e) => handleAddToCart(false, e)}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold uppercase rounded-full transition-colors
              ${product.isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-amazon-yellow text-amazon-dark hover:bg-amazon-yellow/90'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
          <button 
            onClick={(e) => handleAddToCart(true, e)}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold uppercase rounded-full transition-colors
              ${product.isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-amazon-orange text-amazon-dark hover:bg-amazon-orange/90'}`}
          >
            <Zap className="w-5 h-5" />
            Buy Now
          </button>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
