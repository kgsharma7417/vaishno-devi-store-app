import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/helpers";
import { X, Minus, Plus, ShoppingCart, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  const deliveryCharge = cartTotal < 299 ? 30 : 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-96 bg-gray-50 shadow-2xl flex flex-col transform animate-fade-in-right">
        
        {/* Header — Premium Glass */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-wide">
            <ShoppingCart className="w-5 h-5 text-violet-600" />
            My Cart ({cartCount})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {cartItems.length > 0 && (
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 animate-scale-in">
            {cartTotal >= 299 ? (
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                🎉 You unlocked Free Delivery!
              </p>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-2 font-medium">
                  Add <span className="font-bold text-violet-600">{formatPrice(299 - cartTotal)}</span> more for Free Delivery!
                </p>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${Math.min(100, (cartTotal / 299) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 p-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <ShoppingCart className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-black text-slate-800 text-lg tracking-tight">Your cart is empty</p>
              <p className="text-sm text-slate-500 text-center font-medium">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="bg-violet-600 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-violet-700 hover:shadow-md transition-all mt-4 shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-3 md:p-5">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:border-violet-100 transition-colors">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full flex-shrink-0 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1.5">Size: {item.size} | Color: {item.color}</p>
                      
                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="font-black text-slate-900 text-base">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            {formatPrice(item.mrp * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity Controls — Bottom */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center bg-slate-50 rounded-full border border-slate-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-full transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-full transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-10">
            {/* Price Details */}
            <div className="px-5 py-4 space-y-2.5 text-sm font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-bold text-slate-800">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={deliveryCharge > 0 ? "text-slate-800 font-bold" : "text-emerald-600 font-bold"}>
                  {deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 pt-3 border-t border-slate-100 text-lg tracking-tight">
                <span>Total</span>
                <span className="text-violet-700">{formatPrice(cartTotal + deliveryCharge)}</span>
              </div>
            </div>
            
            {/* Checkout Button */}
            <div className="px-5 pb-5">
              <button 
                onClick={handleCheckoutClick}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center font-bold text-slate-400 mt-3 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Safe & Secure Payments
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
