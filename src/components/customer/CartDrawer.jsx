import { useCart } from "../../contexts/CartContext";
import { formatPrice } from "../../utils/helpers";
import { X, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-96 bg-white shadow-2xl flex flex-col transform animate-fade-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-earth-100 bg-earth-50/50">
          <h2 className="text-xl font-heading font-bold text-earth-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sage-600" />
            Your Cart ({cartCount})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-earth-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-earth-500 space-y-4">
              <ShoppingBag className="w-16 h-16 text-earth-200" />
              <p className="font-medium text-lg text-earth-700">Your cart is empty</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-sage-600 font-medium hover:text-sage-800 underline underline-offset-4"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="flex gap-4 p-3 bg-white border border-earth-100 rounded-2xl shadow-sm">
                
                {/* Image */}
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-earth-50 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-heading font-semibold text-earth-800 text-sm line-clamp-2">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="p-1 text-earth-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-earth-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Control */}
                    <div className="flex items-center border border-earth-200 rounded-lg overflow-hidden bg-earth-50">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="px-2 py-1 text-earth-600 hover:bg-earth-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm font-medium text-earth-800 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        className="px-2 py-1 text-earth-600 hover:bg-earth-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Price */}
                    <span className="font-bold text-earth-900 text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cartItems.length > 0 && (
          <div className="p-6 bg-earth-50 border-t border-earth-200">
            <div className="flex justify-between items-center mb-6">
              <span className="font-heading font-semibold text-earth-700">Subtotal</span>
              <span className="text-2xl font-bold text-earth-900">{formatPrice(cartTotal)}</span>
            </div>
            <button 
              onClick={handleCheckoutClick}
              className="w-full btn-primary py-4 text-base flex justify-between items-center px-6"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-earth-400 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-sage-500" /> Secure checkout & safe delivery
            </p>
          </div>
        )}
      </div>
    </>
  );
}
