import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { 
  Search, ShoppingCart, ChevronRight, ChevronLeft, 
  Loader2, Heart, Home, Grid3X3, User, Zap,
  Sparkles, Gift, Crown, Star, Gem, Flower2, CircleDot, Palette, Clock,
  PackageOpen, Phone, PackageCheck
} from "lucide-react";
import ShopSection from "../../components/customer/ShopSection";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { useRecentlyViewed } from "../../contexts/RecentlyViewedContext";
import { CATEGORIES } from "../../utils/constants";
import UserLoginModal from "../../components/customer/UserLoginModal";
import { formatPrice } from "../../utils/helpers";

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

// Category icons mapping
const CATEGORY_ICONS = {
  "Bangles": Gem,
  "Rings": CircleDot,
  "Bridal Chuda": Crown,
  "Daily Wear": Star,
  "Party Wear": Sparkles,
  "Haldi Special": Flower2,
  "Mehendi Special": Palette,
  "Festive Collection": Gift,
  "Trendy Bangles": Zap,
  "Kundan Set": Crown,
  "Lac Bangles": Gem,
  "Metal Bangles": CircleDot,
};

const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-pink-50 text-pink-600",
  "bg-red-50 text-red-600",
  "bg-purple-50 text-purple-600",
  "bg-amber-50 text-amber-600",
  "bg-yellow-50 text-yellow-600",
  "bg-green-50 text-green-600",
  "bg-emerald-50 text-emerald-600",
  "bg-cyan-50 text-cyan-600",
  "bg-indigo-50 text-indigo-600",
  "bg-orange-50 text-orange-600",
  "bg-teal-50 text-teal-600",
];

export default function HomePage() {
  const { cartCount, setIsCartOpen } = useCart();
  const { currentUser, userProfile } = useAuth();
  const { recentItems } = useRecentlyViewed();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState("home");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const shopSectionRef = useRef(null);

  // Countdown timer — loops every 24h (resets at midnight)
  const [countdown, setCountdown] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const calcTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };
    calcTimeLeft();
    const timer = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const scrollToShop = () => {
    document.getElementById("shop-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-amazon-bg font-body pb-16 md:pb-0">

      {/* ===== PREMIUM GLASS HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="px-3 py-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-8">
            
            {/* Logo */}
            <div className="flex justify-between items-center w-full md:w-auto">
              <Link to="/" className="flex-shrink-0 flex flex-col group">
                <span className="text-violet-900 font-black text-xl md:text-2xl tracking-tight leading-none group-hover:text-violet-700 transition-colors">
                  Maa Vaishno Devi
                </span>
                <span className="text-violet-500 text-xs font-bold tracking-widest leading-none mt-1 uppercase">
                  Ladies Corner
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex items-stretch w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search premium jewelry, bangles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scrollToShop();
                }}
                className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-violet-300 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-violet-50 transition-all shadow-inner"
              />
            </div>

            {/* Right Side Icons */}
            <div className="hidden md:flex items-center gap-6 text-slate-700">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 hover:text-violet-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-violet-50 flex items-center justify-center border border-slate-200 group-hover:border-violet-200 transition-all">
                  <User className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] text-slate-500 leading-none">
                    {currentUser ? "Welcome back" : "Sign in"}
                  </span>
                  <span className="text-sm font-bold leading-none mt-1 text-slate-800 group-hover:text-violet-700">
                    {currentUser ? userProfile?.name?.split(" ")[0] : "Account"}
                  </span>
                </div>
              </button>

              <Link 
                to="/my-orders" 
                className="flex items-center gap-2 hover:text-violet-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-violet-50 flex items-center justify-center border border-slate-200 group-hover:border-violet-200 transition-all">
                  <PackageOpen className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] text-slate-500 leading-none">Returns</span>
                  <span className="text-sm font-bold leading-none mt-1 text-slate-800 group-hover:text-violet-700">& Orders</span>
                </div>
              </Link>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 hover:text-violet-700 transition-colors group relative"
              >
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white shadow-md shadow-violet-200 flex items-center justify-center group-hover:bg-violet-700 transition-all group-hover:scale-105 group-active:scale-95">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center border-2 border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-violet-700">Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub Navigation (Sleek Pills) */}
        <div className="bg-slate-50/80 border-t border-slate-200/60 px-3 py-2 md:px-6 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <a href="#shop-section" className="text-xs font-bold px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-violet-700 hover:border-violet-300 shadow-sm transition-all whitespace-nowrap">🌟 Trending Now</a>
            <Link to="/my-orders" className="text-xs font-semibold px-4 py-1.5 rounded-full text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-all whitespace-nowrap border border-transparent">My Orders</Link>
            <Link to="/track-order" className="text-xs font-semibold px-4 py-1.5 rounded-full text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-all whitespace-nowrap border border-transparent">Track Order</Link>
            <a 
              href={`https://wa.me/919058802144?text=Hello! I am shopping on Maa Vaishno Devi Ladies Corner and need assistance.`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-auto text-xs font-bold px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Need Help?
            </a>
          </div>
        </div>
      </header>

      {/* ===== CATEGORY STRIP (Clean & Compact) ===== */}
      <div className="bg-white border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] py-2 sm:py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-3 sm:gap-6 snap-x pb-1">
            {CATEGORIES.map((category, index) => {
              const IconComponent = CATEGORY_ICONS[category] || Gem;
              const colorClass = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <a
                  key={category}
                  href="#shop-section"
                  className="flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[72px] group snap-start transition-transform active:scale-95"
                >
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full ${colorClass} flex items-center justify-center shadow-sm border border-black/5 group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5`}>
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-gray-700 font-medium text-center leading-[1.1] line-clamp-2 px-0.5">
                    {category}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== BANNER CAROUSEL (Compact — Flipkart style) ===== */}
      <div className="bg-white">
        <div className="relative w-full overflow-hidden" style={{ maxHeight: '220px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-40 bg-gray-50">
              <Loader2 className="w-8 h-8 animate-spin text-fk-blue" />
            </div>
          ) : (
            <>
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide) => (
                  <div key={slide.id} className="w-full flex-shrink-0 relative" style={{ maxHeight: '220px' }}>
                    <img 
                      src={slide.image} 
                      alt={slide.title?.replace('\n', ' ') || 'Banner'}
                      className="w-full h-40 md:h-52 object-cover"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm">
                        {slide.subtitle}
                      </span>
                      <h3 className="text-white font-bold text-sm md:text-lg mt-1 leading-tight drop-shadow-lg">
                        {slide.title?.replace('\n', ' ')}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Slide Dots */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      idx === currentSlide 
                        ? 'w-6 h-1.5 bg-violet-500' 
                        : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Desktop nav arrows */}
              <button 
                onClick={() => setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1)}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-md hover:bg-white z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-md hover:bg-white z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== DEALS STRIP ===== */}
      <div className="bg-gradient-to-r from-violet-900 via-violet-800 to-fuchsia-900 mx-2 md:mx-auto md:max-w-7xl mt-4 md:mt-6 rounded-2xl overflow-hidden shadow-lg border border-violet-700">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-300 fill-amber-300" />
            </div>
            <span className="text-white font-black text-sm md:text-base tracking-wide">Deals of the Day</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="bg-white/20 backdrop-blur-md text-white font-bold text-xs md:text-sm px-2 py-1 rounded-lg min-w-[28px] text-center border border-white/10 shadow-inner">{countdown.hours}</span>
              <span className="text-violet-300 font-bold text-xs md:text-sm">:</span>
              <span className="bg-white/20 backdrop-blur-md text-white font-bold text-xs md:text-sm px-2 py-1 rounded-lg min-w-[28px] text-center border border-white/10 shadow-inner">{countdown.minutes}</span>
              <span className="text-violet-300 font-bold text-xs md:text-sm">:</span>
              <span className="bg-white/20 backdrop-blur-md text-white font-bold text-xs md:text-sm px-2 py-1 rounded-lg min-w-[28px] text-center border border-white/10 shadow-inner">{countdown.seconds}</span>
            </div>
            <a href="#shop-section" className="text-violet-200 hover:text-white text-xs md:text-sm font-bold flex items-center gap-1 transition-colors bg-white/10 px-3 py-1.5 rounded-full">
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ===== TRUST BADGES ===== */}
      <div className="bg-white mt-4 border-y border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 flex gap-6 md:gap-12 justify-between overflow-x-auto scrollbar-hide">
          {[
            { icon: "🔒", label: "100% Genuine", sub: "Products" },
            { icon: "🚚", label: "Free Delivery", sub: "On ₹299+" },
            { icon: "↩️", label: "Easy Returns", sub: "7 Days" },
            { icon: "💎", label: "Premium", sub: "Quality" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 min-w-fit group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center text-xl md:text-2xl group-hover:bg-violet-50 group-hover:scale-110 transition-all">
                {item.icon}
              </div>
              <div>
                <p className="text-sm md:text-base font-bold text-slate-800 whitespace-nowrap">{item.label}</p>
                <p className="text-[11px] md:text-xs font-medium text-slate-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RECENTLY VIEWED PRODUCTS ===== */}
      {recentItems.length > 0 && (
        <div className="bg-white mt-4 mb-4 rounded-2xl shadow-sm border border-slate-100 mx-2 md:mx-auto md:max-w-7xl">
          <div className="px-4 py-4 md:px-6 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-600" />
                Recently Viewed
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {recentItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex-shrink-0 w-32 md:w-40 group"
                >
                  <div className="aspect-[3/4] bg-slate-50 overflow-hidden rounded-xl mb-2.5 relative border border-slate-100 group-hover:border-violet-200 transition-colors">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {item.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        {item.discount}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 line-clamp-2 leading-snug font-medium group-hover:text-violet-700 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-sm md:text-base font-black text-slate-900 mt-1">
                    {formatPrice(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SHOP SECTION — Pass searchQuery ===== */}
      <ShopSection externalSearch={searchQuery} />

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-white mt-8 border-t-4 border-violet-600">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">About</h4>
              <ul className="space-y-2.5 text-sm font-medium text-slate-400">
                <li><Link to="/my-orders" className="hover:text-white">My Orders</Link></li>
                <li><Link to="/track-order" className="hover:text-white">Track Order</Link></li>
                <li>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="hover:text-white text-left"
                  >
                    {currentUser ? "My Account" : "Sign In"}
                  </button>
                </li>

              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Help</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>
                  <a
                    href={`https://wa.me/919058802144?text=Hi, I need help with my order`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Payment Support
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919058802144?text=Hi, I have a shipping question`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Shipping Info
                  </a>
                </li>
                <li><Link to="/track-order" className="hover:text-white">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Policy</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>
                  <a
                    href={`https://wa.me/919058802144?text=Hi, I want to return/exchange my order`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Return Policy
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919058802144?text=Hi, I have a query about terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919058802144?text=Hi, I have a privacy query`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Contact Us</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Pro. Mukul Sharma (Khagesh)</span><br />
                Maa Vaishno Devi Ladies Corner & Gift Center<br />
                Shri Mankameshwar Nath Market,<br />
                Jalesar Road, Tedi Bagiya Tiraha, Agra - 6
              </p>

              {/* Phone */}
              <div className="mt-3 flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📞</span>
                  <a href="tel:9058802144" className="text-amazon-yellow font-bold hover:text-white transition-colors">
                    9058802144
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/919058802144" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-400 font-medium hover:text-green-300 transition-colors"
              >
                <span className="text-sm">💬</span> WhatsApp पर बात करें
              </a>

              {/* Timings */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">🕗</span>
                <span className="text-xs text-gray-300">
                  <span className="text-white font-medium">सुबह 8:00</span> — <span className="text-white font-medium">शाम 8:00</span>
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Maa Vaishno Devi Ladies Corner & Gift Center. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around py-1.5 px-2">
          {[
            { id: "home", icon: Home, label: "Home", href: "/" },
            { id: "categories", icon: Grid3X3, label: "Categories", href: "#shop-section" },
            { id: "cart", icon: ShoppingCart, label: "Cart", action: () => setIsCartOpen(true), count: cartCount },
            { id: "orders", icon: PackageCheck, label: "Orders", href: "/my-orders" },
            { id: "account", icon: User, label: "Account", action: () => setIsLoginModalOpen(true), photo: currentUser ? userProfile?.photo : null },
          ].map(item => (
            item.action ? (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); item.action(); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${activeNav === item.id ? 'text-fk-blue' : 'text-gray-500'}`}
              >
                {item.photo ? (
                  <img src={item.photo} alt="Account" className="w-5 h-5 rounded-full border border-fk-blue" />
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
                {item.count > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-fk-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ) : item.href?.startsWith('#') ? (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeNav === item.id ? 'text-fk-blue' : 'text-gray-500'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </a>
            ) : (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeNav === item.id ? 'text-fk-blue' : 'text-gray-500'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          ))}
        </div>
      </nav>

      {/* User Login Modal */}
      <UserLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

    </div>
  );
}
