import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../components/shared/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useSEO } from "../../hooks/useSEO";
import { formatPrice } from "../../utils/helpers";
import { db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, PackageCheck, Loader2, ChevronRight, Tag } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { launchConfetti } from "../../utils/confetti";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { addToast } = useToast();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useSEO({ title: "Checkout", description: "Complete your Maa Vaishno Devi Ladies Corner & Gift Center order. Secure checkout with COD, UPI and online payment options." });

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Auto-fill form from Google login profile
  useEffect(() => {
    if (userProfile) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.name || "",
        email: prev.email || userProfile.email || "",
      }));
    }
  }, [userProfile]);

  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'upi'
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upiId: "", payeeName: "" });
  const [razorpayDetails, setRazorpayDetails] = useState({ enabled: true, keyId: "rzp_test_StaSH1lgs2dfUO" });
  const [transactionId, setTransactionId] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const finalTotal = cartTotal;

  // Load Razorpay Script
  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => console.error("Failed to load Razorpay script");
      document.body.appendChild(script);
    };
    loadScript();
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.payment) setUpiDetails(data.payment);
          if (data.razorpay) {
            setRazorpayDetails({
              enabled: data.razorpay.enabled === true,
              keyId: data.razorpay.keyId || "rzp_test_StaSH1lgs2dfUO"
            });
          }
        }
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      }
    }
    fetchSettings();
  }, []);

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <PackageCheck className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Your Cart is Empty</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Add some beautiful jewellery before checking out.</p>
        <Link to="/" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="bg-white p-8 md:p-12 shadow-card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-fk-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-fk-green" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-sm text-gray-600 mb-3">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          <p className="text-xs text-gray-500 mb-6 font-mono bg-gray-50 px-3 py-2 rounded-sm border border-gray-200 inline-block">
            Order ID: {placedOrderId}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary text-xs">Continue Shopping</Link>
            <Link to="/my-orders" className="btn-primary text-xs">View My Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFieldChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Validation helpers
  const isValidPhone = (phone) => /^[6-9][0-9]{9}$/.test(phone.replace(/\s+/g, ""));
  const isValidPIN = (pin) => /^[1-9][0-9]{5}$/.test(pin);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addToast({ type: "error", message: "Geolocation is not supported by your browser" });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        addToast({ type: "success", message: "Location captured successfully!" });
      },
      (error) => {
        setGettingLocation(false);
        let msg = "Failed to get location.";
        if (error.code === 1) msg = "Please allow location access to use this feature.";
        addToast({ type: "error", message: msg });
      }
    );
  };

  const [isGiftWrap, setIsGiftWrap] = useState(false);

  const deliveryCharge = (cartTotal < 299 && cartTotal > 0) ? 30 : 0;
  const giftWrapCharge = isGiftWrap ? 30 : 0;
  const grandTotal = finalTotal + deliveryCharge + giftWrapCharge;

  const saveOrderToFirebase = async (txnId = null, pMethod = paymentMethod) => {
    try {
      let pStatus = 'Pending (COD)';
      if (pMethod === 'upi') pStatus = 'Pending (UPI)';
      if (pMethod === 'razorpay') pStatus = 'Paid (Razorpay)';

      const orderData = {
        customerDetails: { ...form, location: location },
        items: cartItems,
        subtotal: cartTotal,
        deliveryCharge,
        giftWrapCharge,
        isGiftWrap,
        totalAmount: grandTotal,
        paymentMethod: pMethod,
        transactionId: txnId,
        paymentStatus: pStatus,
        orderStatus: 'Pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPlacedOrderId(docRef.id);
      setOrderPlaced(true);

      // Save order to localStorage for history
      try {
        const existingOrders = JSON.parse(localStorage.getItem('my_bangle_orders') || '[]');
        if (!existingOrders.includes(docRef.id)) {
          existingOrders.push(docRef.id);
          localStorage.setItem('my_bangle_orders', JSON.stringify(existingOrders));
        }
      } catch (e) {
        console.error("Could not save to local storage", e);
      }

      window.scrollTo(0, 0);
      
      try {
        // 🎉 Launch confetti!
        launchConfetti();
      } catch (err) {
        console.error("Confetti failed", err);
      }
      
      addToast({ type: "success", title: "Success", message: "🎉 Your order has been placed!" });
      
      // Clear cart and redirect immediately to My Orders
      clearCart();
      navigate('/my-orders', { replace: true });

    } catch (error) {
      console.error("Error placing order:", error);
      addToast({ type: "error", message: "Failed to place order. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Phone validation
    if (!isValidPhone(form.phone)) {
      addToast({ type: "error", message: "Please enter a valid 10-digit Indian mobile number." });
      return;
    }

    // PIN code validation
    if (!isValidPIN(form.pincode)) {
      addToast({ type: "error", message: "Please enter a valid 6-digit PIN code." });
      return;
    }

    if (paymentMethod === 'upi' && !transactionId.trim()) {
      addToast({ type: "warning", message: "Please enter the Transaction ID (UTR) to confirm your UPI payment." });
      return;
    }
    
    setSubmitting(true);

    if (paymentMethod === 'razorpay') {
      if (!scriptLoaded) {
        addToast({ type: "error", message: "Razorpay SDK failed to load. Are you online?" });
        setSubmitting(false);
        return;
      }
      
      const keyIdToUse = razorpayDetails.keyId || "rzp_test_StaSH1lgs2dfUO";

      const options = {
        key: keyIdToUse,
        amount: grandTotal * 100,
        currency: "INR",
        name: "Maa Vaishno Devi Ladies Corner",
        description: "Order Payment",
        handler: function (response) {
          saveOrderToFirebase(response.razorpay_payment_id, 'razorpay');
        },
        prefill: {
          name: form.fullName,
          email: form.email || "test@example.com",
          contact: form.phone
        },
        theme: {
          color: "#131921"
        },
        modal: {
          ondismiss: function() {
            setSubmitting(false);
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        console.error("Payment Failed:", response.error);
        addToast({ type: "error", message: "Payment failed: " + response.error.description });
        setSubmitting(false);
      });
      rzp1.open();
    } else {
      await saveOrderToFirebase(paymentMethod === 'upi' ? transactionId : null);
    }
  };

  return (
    <div className="min-h-screen bg-amazon-bg pb-36 lg:pb-8 font-body animate-fade-in">
      {/* Header */}
      <header className="bg-amazon-dark sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center h-12 md:h-14 gap-3">
            <Link to="/" className="text-white p-1 hover:outline hover:outline-1 hover:outline-white rounded-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-white font-bold text-base">Checkout</h1>
            <div className="ml-auto">
              <ShieldCheck className="w-5 h-5 text-white/70" />
            </div>
          </div>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-amazon-orange font-bold">
            <span className="w-5 h-5 bg-amazon-orange text-amazon-dark rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            Cart
          </span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="flex items-center gap-1 text-amazon-orange font-bold">
            <span className="w-5 h-5 bg-amazon-orange text-amazon-dark rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
            Address
          </span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-5 h-5 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-[10px]">3</span>
            Payment
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-3">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-3">
              
              {/* Shipping Details */}
              <section className="bg-white p-4 md:p-6 shadow-card rounded-md border border-gray-200">
                <h2 className="text-sm font-bold text-amazon-navy uppercase mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="sm:col-span-2">
                    <label className="input-label text-xs">Full Name *</label>
                    <input required type="text" name="fullName" value={form.fullName} onChange={handleFieldChange} className="input-field text-sm" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="input-label text-xs">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFieldChange}
                      className="input-field text-sm"
                      placeholder="9876543210"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      title="Enter a valid 10-digit Indian mobile number"
                    />
                  </div>
                  <div>
                    <label className="input-label text-xs">Email (Optional)</label>
                    <input type="email" name="email" value={form.email} onChange={handleFieldChange} className="input-field text-sm" placeholder="jane@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="input-label text-xs mb-0">Delivery Address *</label>
                      <button 
                        type="button" 
                        onClick={handleGetLocation} 
                        disabled={gettingLocation}
                        className={`text-[10px] font-bold flex items-center gap-1 ${location ? 'text-amazon-green' : 'text-amazon-link hover:underline'}`}
                      >
                        {gettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        {location ? "Location Captured ✓" : "Use Current Location"}
                      </button>
                    </div>
                    <textarea required name="address" value={form.address} onChange={handleFieldChange} rows="2" className="input-field resize-none text-sm" placeholder="Flat No, Building, Street..." />
                  </div>
                  <div>
                    <label className="input-label text-xs">City *</label>
                    <input required type="text" name="city" value={form.city} onChange={handleFieldChange} className="input-field text-sm" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="input-label text-xs">State *</label>
                    <input required type="text" name="state" value={form.state} onChange={handleFieldChange} className="input-field text-sm" placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="input-label text-xs">PIN Code *</label>
                    <input
                      required
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleFieldChange}
                      className="input-field text-sm"
                      placeholder="400001"
                      pattern="[1-9][0-9]{5}"
                      maxLength={6}
                      title="Enter a valid 6-digit PIN code"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-4 md:p-6 shadow-card rounded-md border border-gray-200">
                <h2 className="text-sm font-bold text-amazon-navy uppercase mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Method
                </h2>
                
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all rounded-sm ${paymentMethod === 'cod' ? 'border-amazon-orange bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-amazon-orange focus:ring-amazon-orange" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Pay when your order arrives.</p>
                    </div>
                  </label>

                  <label className={`flex flex-col p-3 border-2 cursor-pointer transition-all rounded-sm ${paymentMethod === 'upi' ? 'border-amazon-orange bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-amazon-orange focus:ring-amazon-orange" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-xs text-gray-500">Scan QR Code and pay instantly.</p>
                      </div>
                    </div>
                    
                    {paymentMethod === 'upi' && upiDetails.upiId && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col items-center animate-fade-in text-center">
                        <p className="text-xs font-semibold text-gray-800 mb-2">Scan with any UPI App</p>
                        <div className="bg-white p-3 rounded-sm shadow-sm mb-3 inline-block border border-gray-100 hidden sm:block">
                        <QRCodeSVG value={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${grandTotal}&cu=INR`} size={140} />
                        </div>
                        
                        <a 
                          href={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${grandTotal}&cu=INR`}
                          className="w-full sm:hidden bg-amazon-orange text-amazon-dark font-bold py-2.5 px-4 rounded-full mb-3 flex items-center justify-center gap-2 text-sm"
                        >
                          Pay with UPI App
                        </a>

                        <p className="text-[10px] text-gray-500 mb-1">UPI ID:</p>
                        <p className="text-xs font-mono font-bold text-gray-800 bg-white px-3 py-1 rounded-sm border border-gray-200 mb-4">{upiDetails.upiId}</p>
                        
                        <div className="w-full text-left bg-white p-3 rounded-sm border border-gray-200">
                          <label className="input-label text-xs text-amazon-navy font-bold">Transaction ID (UTR) <span className="text-amazon-red">*</span></label>
                          <input type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 123456789012" className="input-field text-sm" />
                          <p className="text-[10px] text-gray-500 mt-1">Enter the 12-digit UTR/Ref number after paying.</p>
                        </div>
                      </div>
                    )}
                    
                    {paymentMethod === 'upi' && !upiDetails.upiId && (
                       <div className="mt-3 pt-3 border-t border-blue-200 text-fk-red text-xs font-semibold text-center">
                         UPI payments are currently disabled by the store owner.
                       </div>
                    )}
                  </label>

                  {razorpayDetails.enabled && (
                    <label className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all rounded-sm ${paymentMethod === 'razorpay' ? 'border-amazon-orange bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-amazon-orange focus:ring-amazon-orange" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Online Payment (Razorpay)</p>
                        <p className="text-xs text-gray-500">Credit Card, Debit Card, Netbanking, or Wallet.</p>
                      </div>
                    </label>
                  )}
                </div>
              </section>
            </form>
          </div>

          <div className="lg:col-span-4">

            <div className="bg-white p-4 md:p-6 shadow-card sticky top-24 mt-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">Price Details</h2>
              
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-12 h-14 bg-gray-50 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                        <span className="font-bold text-xs text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Wrap Section */}
              <div className="mb-4 p-3 bg-rose-50/50 border border-rose-100 rounded-sm">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="w-4 h-4 text-rose-500 border-rose-300 rounded focus:ring-rose-400"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-800">🎁 Gift Wrap this order? (+₹30)</p>
                    <p className="text-[10px] text-gray-500">Includes beautiful gift box & custom greeting note.</p>
                  </div>
                </label>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Price ({cartItems.length} items)</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {isGiftWrap && (
                  <div className="flex justify-between text-gray-600">
                    <span>Gift Wrap Charge</span>
                    <span>{formatPrice(30)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className={deliveryCharge > 0 ? "text-gray-900" : "text-amazon-green font-semibold"}>
                    {deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200 font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Desktop Place Order */}
              <button 
                type="submit" 
                form="checkout-form"
                disabled={submitting}
                className="w-full bg-amazon-orange hover:bg-amazon-orange/90 text-amazon-dark font-bold py-3 rounded-full text-sm uppercase mt-4 transition-colors shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Processing...</>
                ) : (
                  "Place Order"
                )}
              </button>
              
              <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amazon-green" /> Safe and secure payments
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex items-center">
        <div className="flex-1 px-4 py-2">
          <p className="text-[10px] text-gray-500">Total Amount</p>
          <div>
            <p className="font-bold text-base text-gray-900">{formatPrice(grandTotal)}</p>
          </div>
        </div>
        <button 
          type="submit" 
          form="checkout-form"
          disabled={submitting}
          className="bg-amazon-orange text-amazon-dark font-bold py-4 px-6 text-sm uppercase flex-shrink-0"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-1 inline" /> Wait...</>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
}
