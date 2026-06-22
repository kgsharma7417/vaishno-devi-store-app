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
  ArrowLeft, Check, Share2, Sparkles,
  Ruler, Truck, ShieldCheck, Video, ShoppingCart, CreditCard,
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
      
      {/* Top Nav — Premium Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-14 md:h-16 gap-4">
            <button onClick={() => navigate(-1)} className="text-slate-600 p-2 hover:bg-slate-100 hover:text-violet-600 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-base md:text-lg font-bold truncate tracking-tight">{product.productName}</p>
              <p className="text-violet-500 text-[10px] md:text-xs font-black uppercase tracking-widest">{product.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto md:px-6 md:py-8">
        <div className="md:grid md:grid-cols-2 md:gap-10 md:bg-white md:shadow-xl md:rounded-3xl md:border md:border-slate-100 md:p-8">
          
          {/* Left: Image Gallery */}
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Main Image */}
            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-slate-50 md:rounded-2xl border border-slate-100">
              <img 
                src={product.imageUrls[mainImageIndex]} 
                alt={product.productName} 
                className="w-full h-full object-contain"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isFeatured && (
                  <span className="bg-amber-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full shadow-sm">🔥 BEST SELLER</span>
                )}
                {product.discountPercentage > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full shadow-sm">-{product.discountPercentage}% DEAL</span>
                )}
              </div>

              {/* Wishlist */}
              <button 
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full shadow-md flex items-center justify-center z-10 transition-all hover:scale-110 ${
                  isWishlisted(product.id) ? "bg-rose-500 text-white" : "bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* Thumbnails */}
            {product.imageUrls.length > 1 && (
              <div className="flex gap-3 px-4 py-4 md:px-0 md:py-4 overflow-x-auto scrollbar-hide">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setMainImageIndex(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 border-2 rounded-xl overflow-hidden transition-all
                      ${mainImageIndex === index ? "border-violet-600 scale-105 shadow-sm ring-2 ring-violet-100 ring-offset-2" : "border-slate-200 opacity-60 hover:opacity-100 hover:border-violet-300"}`}
                  >
                    <img src={url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="bg-white px-4 py-6 md:px-0 md:py-0 space-y-6">
            
            <div className="space-y-2">
              {/* Category */}
              <p className="text-[10px] md:text-xs font-black text-violet-500 uppercase tracking-widest">{product.category}</p>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                {product.productName}
              </h1>

              {/* Rating */}
              {product.reviewCount > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) 
                            ? "text-amber-400 fill-amber-400" 
                            : "text-slate-200 fill-slate-100"
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-500 hover:text-violet-600 cursor-pointer transition-colors" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({behavior: 'smooth'})}>
                    ({product.reviewCount} reviews)
                  </span>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-400">No reviews yet</div>
              )}
            </div>

            <div className="space-y-3">
              {/* Pricing */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Special Price</span>
                </div>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {formatPrice(product.finalPrice)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="text-sm md:text-base text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                      {product.discountPercentage}% OFF
                    </span>
                  )}
                </div>
                {product.discountPercentage > 0 && (
                  <p className="text-sm font-medium text-slate-500">
                    MRP: <span className="line-through">{formatPrice(product.mrp)}</span> <span className="text-emerald-600 ml-1">(Save {formatPrice(discountAmt)})</span>
                  </p>
                )}
                
                {/* COD Availability Badge */}
                {product.isCodAvailable !== false ? (
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-700 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> Cash on Delivery Available
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-xs font-bold">
                    <CreditCard className="w-4 h-4" /> Online Payment Only (COD Disabled)
                  </div>
                )}
              </div>

              {product.isOutOfStock && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Currently Out of Stock
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Color: <span className="font-semibold text-violet-600 capitalize ml-1">{selectedColor}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors?.map(color => {
                    const isActive = selectedColor === color;
                    const swatch = COLOR_SWATCHES[color];
                    const isGradient = swatch?.includes("gradient");

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300
                          ${isActive ? "border-violet-600 ring-4 ring-offset-2 ring-violet-100 scale-110 shadow-md" : "border-slate-200 hover:scale-110 hover:border-violet-300 shadow-sm"}`}
                        style={{
                          background: isGradient ? swatch : swatch,
                          backgroundColor: isGradient ? undefined : swatch,
                        }}
                      >
                        {isActive && (
                          <span className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                            <Check className="w-5 h-5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Select Size</h3>
                  {!(availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size")) && (
                    <button 
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-xs font-bold text-violet-600 flex items-center gap-1.5 hover:text-violet-800 transition-colors bg-violet-50 px-3 py-1.5 rounded-full"
                    >
                      <Ruler className="w-3.5 h-3.5" /> SIZE GUIDE
                    </button>
                  )}
                </div>
                
                {availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size") ? (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-bold px-5 py-3 rounded-xl border border-emerald-100 shadow-sm">
                    ✨ Standard Free Size <span className="font-medium text-emerald-600 ml-1">(Fits all)</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
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
                            className={`min-w-[3.5rem] h-12 px-4 rounded-xl text-sm font-black transition-all border-2
                              ${isActive 
                                ? "bg-violet-600 text-white border-violet-600 shadow-md scale-105" 
                                : isOutOfStock 
                                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through" 
                                  : "bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:text-violet-700"}`}
                          >
                            {size}
                          </button>
                          {isLowStock && !isOutOfStock && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedSize && product.sizesAndStock[selectedSize] <= 2 && product.sizesAndStock[selectedSize] > 0 && (
                  <p className="text-sm text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 w-fit px-3 py-1.5 rounded-lg border border-rose-100">
                    <Zap className="w-4 h-4 fill-rose-600" /> Hurry, only {product.sizesAndStock[selectedSize]} left!
                  </p>
                )}
              </div>
            )}

            <hr className="border-slate-100" />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 py-2">
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 mb-1">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Free Delivery<br/><span className="font-medium text-slate-500">Above ₹299</span></span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Secure<br/><span className="font-medium text-slate-500">Payment</span></span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-1">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Easy<br/><span className="font-medium text-slate-500">Returns</span></span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Product Details</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed font-medium">{product.description}</p>
            </div>

             {/* Video Link if exists */}
            {product.videoUrl && (
              <a 
                href={product.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors group shadow-sm"
              >
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6 text-rose-600 fill-rose-600" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-slate-900">Watch Product Video</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">See how it looks in real life</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Frequently Bought Together / Complete the Look */}
        {relatedProducts.length > 0 && (
          <div className="bg-white p-6 md:p-8 shadow-xl md:rounded-3xl mt-6 border border-slate-100">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> Frequently Bought Together
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(item => (
                <Link 
                  key={item.id} 
                  to={`/product/${item.id}`}
                  className="flex flex-col gap-3 p-4 border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-200 hover:shadow-lg rounded-2xl transition-all group"
                >
                  <div className="aspect-square bg-white rounded-xl overflow-hidden border border-slate-100 group-hover:border-violet-100">
                    <img src={item.imageUrls?.[0]} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-violet-700 transition-colors">{item.productName}</p>
                    <p className="text-sm font-black text-slate-900 mt-1.5">{formatPrice(item.finalPrice)}</p>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex md:hidden px-3 py-3 gap-3">
        <button 
          onClick={(e) => handleAddToCart(false, e)}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black uppercase rounded-xl transition-all shadow-sm border
            ${product.isOutOfStock ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button 
          onClick={(e) => handleAddToCart(true, e)}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black uppercase rounded-xl transition-all shadow-md
            ${product.isOutOfStock ? 'bg-slate-300 text-slate-500' : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg hover:-translate-y-0.5'}`}
        >
          <Zap className="w-4 h-4 fill-white" />
          Buy Now
        </button>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 mt-6">
        <div className="bg-white shadow-xl rounded-3xl p-6 flex gap-6 border border-slate-100">
          <button 
            onClick={(e) => handleAddToCart(false, e)}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-black uppercase rounded-2xl transition-all shadow-sm border-2
              ${product.isOutOfStock ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
          <button 
            onClick={(e) => handleAddToCart(true, e)}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-black uppercase rounded-2xl transition-all shadow-lg shadow-violet-200
              ${product.isOutOfStock ? 'bg-slate-300 text-slate-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5'}`}
          >
            <Zap className="w-5 h-5 fill-white" />
            Buy Now
          </button>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
