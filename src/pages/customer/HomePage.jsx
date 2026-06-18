import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Sparkles, ShoppingBag, ShieldCheck, ChevronRight, ChevronLeft, ShoppingCart, Loader2 } from "lucide-react";
import ShopSection from "../../components/customer/ShopSection";
import { useCart } from "../../contexts/CartContext";

const DEFAULT_SLIDES = [
  {
    id: 1,
    image: "/hero/1.png",
    title: "Premium\nBridal Collection",
    subtitle: "New Arrivals",
    desc: "Discover our meticulously crafted bridal Kundan bangles, designed to make your special day unforgettable.",
    align: "left"
  },
  {
    id: 2,
    image: "/hero/2.png",
    title: "Exquisite\nJewelry Sets",
    subtitle: "Luxury Display",
    desc: "High-end traditional Indian jewelry sets featuring intricate gold designs and warm elegance.",
    align: "center"
  },
  {
    id: 3,
    image: "/hero/3.png",
    title: "Vibrant\nGlass Bangles",
    subtitle: "Festive Special",
    desc: "Add a splash of vibrant colors to your celebrations with our premium glass and metal chuda sets.",
    align: "right"
  },
  {
    id: 4,
    image: "/hero/4.png",
    title: "The Perfect\nBridal Look",
    subtitle: "Editorial Style",
    desc: "Complete your elegant bridal look with our beautiful assortment of artificial jewelry and mehendi essentials.",
    align: "left"
  }
];

export default function HomePage() {
  const { cartCount, setIsCartOpen } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Slides from Firestore
  useEffect(() => {
    async function fetchSlides() {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().heroSlides?.length > 0) {
          setSlides(docSnap.data().heroSlides);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (error) {
        console.error("Error fetching slides:", error);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    }
    fetchSlides();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="min-h-screen bg-earth-50 font-body relative">
      
      {/* Absolute Navbar over the Hero Section for maximum luxury */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <span className="text-3xl md:text-4xl font-heading font-black text-white tracking-widest drop-shadow-md">
                RADHE BANGLES
              </span>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-10">
              <a href="#shop-section" className="text-white/90 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors">Collections</a>
              <a href="#shop-section" className="text-white/90 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors">Bridal</a>
              <a href="#shop-section" className="text-white/90 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors">Best Sellers</a>
            </nav>

            {/* Actions: Cart & Admin */}
            <div className="flex items-center gap-6">
              <Link 
                to="/my-orders"
                className="hidden sm:inline-flex text-white hover:text-gold-400 text-sm font-medium tracking-widest uppercase transition-colors"
              >
                My Orders
              </Link>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative text-white hover:text-gold-400 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              
              <Link
                to="/admin/login"
                className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white border border-white/30 rounded-none hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Screen Slider */}
      <main className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-black flex items-center justify-center">
        
        {loading ? (
           <div className="flex flex-col items-center justify-center space-y-4 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
              <p className="text-gold-400/80 font-heading tracking-widest text-xs uppercase animate-pulse">Loading Collection</p>
           </div>
        ) : (
          <>
            {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div 
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out
                ${isActive ? 'opacity-100 z-20' : 'opacity-0 z-10 pointer-events-none'}
              `}
            >
              {/* Background Image */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-out
                  ${isActive ? 'scale-105' : 'scale-100'}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                {/* Dark Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Slide Content */}
              <div className="relative z-30 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                <div className={`
                  max-w-3xl transform transition-all duration-1000 delay-300
                  ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
                  ${slide.align === 'center' ? 'mx-auto text-center' : slide.align === 'right' ? 'ml-auto text-right' : 'text-left'}
                `}>
                  
                  <div className="flex items-center gap-3 mb-6" style={{ justifyContent: slide.align === 'center' ? 'center' : slide.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    <div className="w-12 h-[1px] bg-gold-400" />
                    <span className="text-gold-400 uppercase tracking-[0.3em] text-xs font-bold">
                      {slide.subtitle}
                    </span>
                    <div className="w-12 h-[1px] bg-gold-400" />
                  </div>

                  <h1 className="text-6xl md:text-8xl font-heading font-medium text-white mb-6 leading-[1.1] drop-shadow-2xl whitespace-pre-line">
                    {slide.title}
                  </h1>
                  
                  <p className="text-lg md:text-xl text-white/80 font-light mb-10 leading-relaxed max-w-xl" style={{ marginLeft: slide.align === 'center' || slide.align === 'right' ? 'auto' : '0', marginRight: slide.align === 'center' || slide.align === 'left' ? 'auto' : '0' }}>
                    {slide.desc}
                  </p>

                  <a 
                    href="#shop-section"
                    className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gold-500 text-white font-bold tracking-widest uppercase text-sm hover:bg-gold-400 transition-colors duration-300 group"
                  >
                    Explore Collection
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Slider Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* Slide Indicators */}
          <div className="flex items-center gap-3">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-500 ${
                  idx === currentSlide 
                    ? 'w-12 h-1 bg-gold-500' 
                    : 'w-4 h-1 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-4">
            <button 
              onClick={prevSlide}
              className="p-3 border border-white/20 text-white hover:bg-white hover:text-black transition-colors rounded-full backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-3 border border-white/20 text-white hover:bg-white hover:text-black transition-colors rounded-full backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
          </>
        )}

      </main>

      {/* Trust Banner Below Hero */}
      <div className="bg-earth-900 text-earth-100 py-6 border-b border-earth-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-gold-500" />
            <span className="text-sm font-medium tracking-wide uppercase">100% Authentic Quality</span>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-gold-500" />
            <span className="text-sm font-medium tracking-wide uppercase">Premium Craftsmanship</span>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-gold-500" />
            <span className="text-sm font-medium tracking-wide uppercase">Safe & Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* Dynamic Shop Section (Live Firebase Data & Filters) */}
      <ShopSection />
    </div>
  );
}
