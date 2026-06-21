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
        
        {/* Header — Flipkart Blue */}
        <div className="flex items-center justify-between px-4 py-3 bg-fk-blue text-white">
          <h2 className="text-base font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            My Cart ({cartCount})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {cartItems.length > 0 && (
          <div className="bg-white px-4 py-3 border-b border-gray-100 animate-scale-in">
            {cartTotal >= 299 ? (
              <p className="text-xs font-semibold text-fk-green flex items-center gap-1">
                🎉 You unlocked **Free Delivery** on this order!
              </p>
            ) : (
              <div>
                <p className="text-xs text-gray-600 mb-1.5">
                  Add <span className="font-bold text-fk-blue">{formatPrice(299 - cartTotal)}</span> more for **Free Delivery**!
                </p>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-fk-blue h-full transition-all duration-500 rounded-full" 
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
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 p-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">Your cart is empty!</p>
              <p className="text-sm text-gray-500 text-center">Add items to your cart to see them here.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-fk-blue font-bold text-sm hover:underline uppercase mt-2"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-2 md:p-3">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="bg-white p-3 shadow-card">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="w-20 h-24 overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm text-gray-800 line-clamp-2 leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="p-1 text-gray-400 hover:text-fk-red flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                      
                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.mrp * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity Controls — Bottom */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
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
          <div className="border-t border-gray-200 bg-white">
            {/* Price Details */}
            <div className="px-4 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartCount} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={deliveryCharge > 0 ? "text-gray-900" : "text-fk-green font-medium"}>
                  {deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>{formatPrice(cartTotal + deliveryCharge)}</span>
              </div>
            </div>
            
            {/* Checkout Button */}
            <div className="px-4 pb-4">
              <button 
                onClick={handleCheckoutClick}
                className="w-full bg-fk-yellow hover:bg-fk-yellow-dark text-white font-bold py-3.5 rounded-sm text-sm uppercase flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                Place Order
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-fk-green" /> Safe and Secure Payments
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
