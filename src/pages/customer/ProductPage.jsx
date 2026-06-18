import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import Loader from "../../components/shared/Loader";
import SizeGuideModal from "../../components/customer/SizeGuideModal";
import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/helpers";
import { COLOR_SWATCHES } from "../../utils/constants";
import { 
  ArrowLeft, Check, Share2, Star,
  Ruler, Truck, ShieldCheck, Video, ShoppingCart, 
  Heart, ChevronRight, Zap, MapPin, RotateCcw
} from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Selections
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          // Set defaults
          if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
          
          // Auto-select first available size
          if (data.sizesAndStock) {
            const firstAvailableSize = Object.keys(data.sizesAndStock).find(size => data.sizesAndStock[size] > 0);
            if (firstAvailableSize) setSelectedSize(firstAvailableSize);
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

  const handleAddToCart = () => {
    if (product.isOutOfStock) {
      addToast({ type: "error", message: "This product is currently out of stock." });
      return;
    }
    if (!selectedColor) {
      addToast({ type: "warning", message: "Please select a color first." });
      return;
    }
    if (!selectedSize) {
      addToast({ type: "warning", message: "Please select a size first." });
      return;
    }

    addToCart(product, selectedSize, selectedColor, 1);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.productName,
        text: `Check out ${product.productName} on Radhe Bangles!`,
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
      
      {/* Top Nav — Flipkart style */}
      <header className="bg-fk-blue sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center h-12 md:h-14 gap-3">
            <Link to="/" className="text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{product.productName}</p>
              <p className="text-white/70 text-[10px]">{product.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleShare} className="p-2 text-white/80 hover:text-white">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="p-2 text-white/80 hover:text-white relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-fk-yellow text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
                  <span className="bg-fk-yellow text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">TRENDING</span>
                )}
                {product.discountPercentage > 0 && (
                  <span className="bg-fk-green text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">{product.discountPercentage}% OFF</span>
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
                      ${mainImageIndex === index ? "border-fk-blue" : "border-gray-200 opacity-70 hover:opacity-100"}`}
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

            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-fk-green text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                4.2 <Star className="w-3 h-3 fill-white" />
              </span>
              <span className="text-xs text-gray-500">120 Ratings & 45 Reviews</span>
            </div>

            {/* Special offer tag */}
            <div className="flex items-center gap-1.5 text-fk-green text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Special Price</span>
            </div>

            {/* Pricing — Flipkart style */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                {formatPrice(product.finalPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(product.mrp)}
                  </span>
                  <span className="text-sm font-medium text-fk-green">
                    {product.discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {product.isOutOfStock && (
              <div className="bg-fk-red-light text-fk-red px-3 py-2 rounded-sm text-sm font-semibold">
                Currently Out of Stock
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Color Selection */}
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
                        ${isActive ? "border-fk-blue ring-2 ring-offset-1 ring-fk-blue/30 scale-110" : "border-gray-200 hover:scale-110"}`}
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

            {/* Size Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Size</h3>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-bold text-fk-blue flex items-center gap-1 hover:underline"
                >
                  <Ruler className="w-3 h-3" /> SIZE GUIDE
                </button>
              </div>
              
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
                            ? "bg-fk-blue text-white border-fk-blue" 
                            : isOutOfStock 
                              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through" 
                              : "bg-white text-gray-700 border-gray-200 hover:border-fk-blue"}`}
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

              {selectedSize && product.sizesAndStock[selectedSize] <= 2 && product.sizesAndStock[selectedSize] > 0 && (
                <p className="text-xs text-fk-red mt-2 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Hurry, only {product.sizesAndStock[selectedSize]} left!
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Delivery & Services — Flipkart style */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Available Offers</h3>
              
              <div className="space-y-2">
                {[
                  { icon: Truck, text: "Free Delivery on orders above ₹299" },
                  { icon: RotateCcw, text: "Easy 7-day Returns & Exchange" },
                  { icon: ShieldCheck, text: "100% Genuine & Quality Assured" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                ))}
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
      </main>

      {/* Mobile Sticky Bottom — ADD TO CART + BUY NOW */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex md:hidden">
        <button 
          onClick={handleAddToCart}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase border-r border-gray-200 transition-colors
            ${product.isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-white text-fk-blue hover:bg-fk-blue-light'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button 
          onClick={() => { handleAddToCart(); if(!product.isOutOfStock) { setIsCartOpen(false); setTimeout(() => { window.location.href = '/checkout'; }, 300); }}}
          disabled={product.isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase transition-colors
            ${product.isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-fk-yellow text-white hover:bg-fk-yellow-dark'}`}
        >
          <Zap className="w-4 h-4" />
          Buy Now
        </button>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 mt-4">
        <div className="bg-white shadow-card p-6 flex gap-4">
          <button 
            onClick={handleAddToCart}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold uppercase rounded-sm transition-colors
              ${product.isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-fk-yellow text-white hover:bg-fk-yellow-dark'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
          <button 
            onClick={() => { handleAddToCart(); }}
            disabled={product.isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold uppercase rounded-sm transition-colors
              ${product.isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-fk-orange text-white hover:opacity-90'}`}
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
