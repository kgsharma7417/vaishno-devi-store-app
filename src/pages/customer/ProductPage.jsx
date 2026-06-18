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
  ArrowLeft, ArrowRight, Check, Sparkles, Share2, 
  Ruler, Truck, ShieldCheck, Video, ShoppingBag, ShoppingCart
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
        text: `Check out this gorgeous ${product.productName} on Kankaṇ!`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: "success", message: "Link copied to clipboard!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <Loader size="large" text="Loading product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-heading font-bold text-earth-800">Product Not Found</h2>
        <Link to="/" className="btn-secondary">Return Home</Link>
      </div>
    );
  }

  const availableSizes = Object.keys(product.sizesAndStock || {});

  return (
    <div className="min-h-screen bg-earth-50 pb-20 font-body animate-fade-in">
      
      {/* Top Nav (Minimal for checkout flow) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-earth-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-earth-500 hover:text-earth-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Shop</span>
            </Link>
            <div className="font-heading font-bold text-xl text-earth-800 tracking-tight">RADHE BANGLES</div>
            
            {/* Cart Icon */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-earth-600 hover:text-earth-900 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-sage-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="bg-white rounded-[2rem] shadow-medium border border-earth-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Left: Image Gallery */}
            <div className="p-6 lg:p-10 bg-earth-50/50 border-r border-earth-100">
              {/* Main Image (Zoom effect on hover via CSS) */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-earth-200 group bg-white">
                <img 
                  src={product.imageUrls[mainImageIndex]} 
                  alt={product.productName} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-125 origin-center cursor-zoom-in"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.isFeatured && (
                    <span className="badge bg-gold-500 text-white px-3 py-1 text-sm shadow-glow-gold">Featured</span>
                  )}
                  {product.discountPercentage > 0 && (
                    <span className="badge bg-rose-500 text-white px-3 py-1 text-sm">Save {product.discountPercentage}%</span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.imageUrls.length > 1 && (
                <div className="flex gap-4 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                  {product.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImageIndex(index)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200
                        ${mainImageIndex === index ? "border-sage-500 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="p-6 lg:p-12 flex flex-col">
              
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-xs font-bold text-sage-600 uppercase tracking-widest">{product.category}</span>
                <button onClick={handleShare} className="p-2 text-earth-400 hover:text-earth-700 hover:bg-earth-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-earth-900 mb-4 leading-tight">
                {product.productName}
              </h1>

              {/* Pricing */}
              <div className="flex items-end gap-4 mb-6 pb-6 border-b border-earth-100">
                <span className="text-3xl font-heading font-black text-earth-900">
                  {formatPrice(product.finalPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-xl text-earth-400 line-through mb-1">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-bold text-rose-500 mb-2">
                      (You save {formatPrice(product.mrp - product.finalPrice)})
                    </span>
                  </>
                )}
              </div>

              {/* Color Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  Select Color <span className="text-sage-600 capitalize text-xs bg-sage-50 px-2 py-0.5 rounded-full">{selectedColor}</span>
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
                        className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200
                          ${isActive ? "border-sage-500 shadow-md scale-110" : "border-earth-200 hover:scale-110"}`}
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

              {/* Size Selection */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider">Select Size</h3>
                  <button 
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-sm font-medium text-sage-600 hover:text-sage-800 flex items-center gap-1 underline underline-offset-4"
                  >
                    <Ruler className="w-4 h-4" /> Size Guide
                  </button>
                </div>
                
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
                          className={`w-14 h-12 rounded-xl text-base font-semibold border-2 transition-all
                            ${isActive 
                              ? "bg-earth-900 text-white border-earth-900 shadow-md" 
                              : isOutOfStock 
                                ? "bg-earth-50 text-earth-300 border-earth-100 cursor-not-allowed" 
                                : "bg-white text-earth-700 border-earth-200 hover:border-earth-400"}`}
                        >
                          {size}
                        </button>
                        {/* Out of Stock Slash */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-0.5 bg-earth-300 rotate-45 transform"></div>
                          </div>
                        )}
                        {/* Low Stock Indicator */}
                        {isLowStock && !isOutOfStock && (
                          <span className="absolute -top-2 -right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Selected size info */}
                {selectedSize && product.sizesAndStock[selectedSize] <= 2 && product.sizesAndStock[selectedSize] > 0 && (
                  <p className="text-sm text-rose-500 mt-3 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Hurry, only {product.sizesAndStock[selectedSize]} left in size {selectedSize}!
                  </p>
                )}
              </div>

              {/* Add to Cart CTA */}
              <button 
                onClick={handleAddToCart}
                className="w-full relative group overflow-hidden rounded-2xl p-[2px] mb-8"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-sage-400 via-gold-400 to-sage-400 rounded-2xl opacity-80 group-hover:opacity-100 animate-shimmer" style={{ backgroundSize: "200% auto" }}></span>
                <div className="relative flex items-center justify-center gap-3 px-8 py-5 bg-sage-600 text-white rounded-2xl transition-transform duration-300 group-hover:scale-[0.98] shadow-lg">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-lg font-bold tracking-wide">Add to Cart</span>
                </div>
              </button>

              {/* Description */}
              <div className="prose prose-earth text-earth-600 mb-8 border-t border-earth-100 pt-8">
                <h3 className="text-lg font-heading font-semibold text-earth-900 mb-3">Product Description</h3>
                <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
              </div>

              {/* Video Link if exists */}
              {product.videoUrl && (
                <a 
                  href={product.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-earth-50 rounded-2xl border border-earth-200 hover:bg-earth-100 transition-colors mb-8 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-earth-900">Watch Product Video</p>
                      <p className="text-xs text-earth-500">See how it shines in real light</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-earth-400 group-hover:text-earth-900 group-hover:-translate-x-1 transition-all" />
                </a>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-earth-100">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-sage-500" />
                  <p className="text-sm font-medium text-earth-700">Premium Quality Assured</p>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8 text-sage-500" />
                  <p className="text-sm font-medium text-earth-700">Safe & Secure Delivery</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
