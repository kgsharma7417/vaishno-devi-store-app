import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { 
  Search, ShoppingCart, ChevronRight, ChevronLeft, 
  Loader2, Heart, Home, Grid3X3, User, Zap,
  Sparkles, Gift, Crown, Star, Gem, Flower2, CircleDot, Palette, Clock
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
    <div className="min-h-screen bg-gray-50 font-body pb-16 md:pb-0">

      {/* SEO: structured data passed via title */}
      
      {/* ===== FLIPKART-STYLE HEADER ===== */}
      <header className="bg-fk-blue sticky top-0 z-50 shadow-header">
        {/* Top Row: Logo + Search + Icons */}
        <div className="px-3 pt-2 pb-1 md:px-6 md:py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex flex-col items-center">
              <span className="text-white font-bold text-lg md:text-xl tracking-tight leading-none">
                Radhe<span className="italic text-fk-yellow">Bangles</span>
              </span>
              <span className="hidden md:flex items-center gap-1 text-[10px] text-white/80 italic mt-0.5">
                Explore <span className="text-fk-yellow">Plus</span>
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for bangles, jewellery & more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scrollToShop();
                }}
                className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-white rounded-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-fk-blue absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 md:gap-3">
              <Link 
                to="/my-orders" 
                className="hidden md:flex items-center gap-1.5 text-white text-sm font-medium hover:text-white/80 transition-colors px-2"
              >
                <User className="w-4 h-4" />
                <span>My Orders</span>
              </Link>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-white hover:text-white/80 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-fk-yellow text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Account Button — Google Login */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 text-white text-sm font-medium hover:text-white/80 transition-colors px-2"
              >
                {currentUser && userProfile?.photo ? (
                  <img
                    src={userProfile.photo}
                    alt={userProfile.name}
                    className="w-7 h-7 rounded-full border-2 border-white/50"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="max-w-[80px] truncate">
                  {currentUser ? userProfile?.name?.split(" ")[0] : "Login"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== CATEGORY STRIP (Horizontal Scroll) ===== */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 px-2 py-3 md:py-4 md:gap-2 md:px-4 md:justify-center">
            {CATEGORIES.map((category, index) => {
              const IconComponent = CATEGORY_ICONS[category] || Gem;
              const colorClass = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <a
                  key={category}
                  href="#shop-section"
                  className="flex flex-col items-center gap-1.5 min-w-[70px] md:min-w-[80px] px-1 group"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${colorClass} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-md`}>
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className="text-[10px] md:text-xs text-gray-700 font-medium text-center leading-tight line-clamp-2">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="bg-fk-yellow text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
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
                        ? 'w-5 h-1.5 bg-fk-blue' 
                        : 'w-1.5 h-1.5 bg-white/60'
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
      <div className="bg-fk-blue mx-2 md:mx-auto md:max-w-7xl mt-2 md:mt-3 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 md:px-6 md:py-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-fk-yellow fill-fk-yellow" />
            <span className="text-white font-bold text-sm md:text-base">Deals of the Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="bg-white text-fk-blue font-bold text-xs px-1.5 py-0.5 rounded-sm min-w-[24px] text-center">{countdown.hours}</span>
              <span className="text-white font-bold text-xs">:</span>
              <span className="bg-white text-fk-blue font-bold text-xs px-1.5 py-0.5 rounded-sm min-w-[24px] text-center">{countdown.minutes}</span>
              <span className="text-white font-bold text-xs">:</span>
              <span className="bg-white text-fk-blue font-bold text-xs px-1.5 py-0.5 rounded-sm min-w-[24px] text-center">{countdown.seconds}</span>
            </div>
            <a href="#shop-section" className="text-white text-xs md:text-sm font-medium flex items-center gap-0.5">
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ===== TRUST BADGES ===== */}
      <div className="bg-white mt-2 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-3 py-3 md:px-6 md:py-4 flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide">
          {[
            { icon: "🔒", label: "100% Genuine", sub: "Products" },
            { icon: "🚚", label: "Free Delivery", sub: "On ₹299+" },
            { icon: "↩️", label: "Easy Returns", sub: "7 Days" },
            { icon: "💎", label: "Premium", sub: "Quality" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 min-w-fit">
              <span className="text-lg md:text-xl">{item.icon}</span>
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">{item.label}</p>
                <p className="text-[10px] md:text-xs text-gray-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RECENTLY VIEWED PRODUCTS ===== */}
      {recentItems.length > 0 && (
        <div className="bg-white mt-2 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-3 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-fk-blue" />
                Recently Viewed
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {recentItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex-shrink-0 w-28 md:w-32 group"
                >
                  <div className="aspect-[3/4] bg-gray-50 overflow-hidden rounded-sm mb-1.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-700 line-clamp-2 leading-snug font-medium">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {formatPrice(item.price)}
                  </p>
                  {item.discount > 0 && (
                    <p className="text-[10px] text-fk-green font-medium">{item.discount}% off</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SHOP SECTION — Pass searchQuery ===== */}
      <ShopSection externalSearch={searchQuery} />

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-800 text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">About</h4>
              <ul className="space-y-2 text-xs text-gray-300">
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
                    href={`https://wa.me/919808861896?text=Hi, I need help with my order`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Payment Support
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919808861896?text=Hi, I have a shipping question`}
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
                    href={`https://wa.me/919808861896?text=Hi, I want to return/exchange my order`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Return Policy
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919808861896?text=Hi, I have a query about terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/919808861896?text=Hi, I have a privacy query`}
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
                <span className="text-white font-semibold">Mukul Dubey</span><br />
                Radhe Bangles Store<br />
                Near Bus Stand, Ramnagar<br />
                Khandauli, Agra
              </p>

              {/* Phone */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">📞</span>
                <a href="tel:9808861896" className="text-xs text-fk-yellow font-bold hover:text-white transition-colors">
                  9808861896
                </a>
              </div>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/919808861896" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-400 font-medium hover:text-green-300 transition-colors"
              >
                <span className="text-sm">💬</span> WhatsApp पर बात करें
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/radhe__bangles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-pink-400 font-medium hover:text-pink-300 transition-colors"
              >
                <span className="text-sm">📸</span> @radhe__bangles
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
            © {new Date().getFullYear()} Radhe Bangles — Mukul Dubey. All rights reserved.
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
            { id: "orders", icon: Heart, label: "Orders", href: "/my-orders" },
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
