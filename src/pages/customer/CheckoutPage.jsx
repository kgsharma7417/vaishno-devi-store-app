import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../components/shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, PackageCheck, Loader2 } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'upi'
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upiId: "", payeeName: "" });
  const [razorpayDetails, setRazorpayDetails] = useState({ enabled: false, keyId: "" });
  const [transactionId, setTransactionId] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
          if (data.razorpay) setRazorpayDetails(data.razorpay);
        }
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      }
    }
    fetchSettings();
  }, []);

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center p-4">
        <PackageCheck className="w-16 h-16 text-earth-300 mb-4" />
        <h1 className="text-2xl font-heading font-bold text-earth-800 mb-2">Your Cart is Empty</h1>
        <p className="text-earth-500 mb-8 text-center">Add some beautiful jewellery before checking out.</p>
        <Link to="/" className="btn-primary">Return to Shop</Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center p-4 animate-fade-in-up">
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mb-6 shadow-glow">
          <ShieldCheck className="w-10 h-10 text-sage-600" />
        </div>
        <h1 className="text-3xl font-heading font-black text-earth-900 mb-2">Order Confirmed!</h1>
        <p className="text-earth-600 mb-2 text-center max-w-md">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <p className="text-earth-500 mb-8 font-mono bg-white px-4 py-2 rounded-lg border border-earth-200">
          Order ID: {placedOrderId}
        </p>
        <div className="flex gap-4">
          <Link to="/" className="btn-secondary">Back to Shop</Link>
          <Link to="/my-orders" className="btn-primary">View My Orders</Link>
        </div>
      </div>
    );
  }

  const handleFieldChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  const deliveryCharge = (cartTotal < 299) ? 30 : 0;
  const finalTotal = cartTotal + deliveryCharge;

  const saveOrderToFirebase = async (txnId = null, pMethod = paymentMethod) => {
    try {
      let pStatus = 'Pending (COD)';
      if (pMethod === 'upi') pStatus = 'Pending (UPI)';
      if (pMethod === 'razorpay') pStatus = 'Paid (Razorpay)';

      const orderData = {
        customerDetails: { ...form, location: location },
        items: cartItems,
        totalAmount: finalTotal,
        paymentMethod: pMethod,
        transactionId: txnId,
        paymentStatus: pStatus,
        orderStatus: 'Pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPlacedOrderId(docRef.id);

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

      setOrderPlaced(true);
      clearCart();
      window.scrollTo(0,0);
      
      addToast({ type: "success", title: "Success", message: "Your order has been placed!" });

    } catch (error) {
      console.error("Error placing order:", error);
      addToast({ type: "error", message: "Failed to place order. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
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
      
      if (!razorpayDetails.keyId) {
        addToast({ type: "error", message: "Razorpay Key ID is missing. Please contact support." });
        setSubmitting(false);
        return;
      }

      const options = {
        key: razorpayDetails.keyId,
        amount: finalTotal * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: "INR",
        name: "Radhe Bangles",
        description: "Test Transaction",
        // image: "https://example.com/your_logo",
        handler: function (response) {
          // Payment succeeded
          saveOrderToFirebase(response.razorpay_payment_id, 'razorpay');
        },
        prefill: {
          name: form.fullName,
          email: form.email || "test@example.com",
          contact: form.phone
        },
        theme: {
          color: "#0f766e" // sage-600
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
      // Normal COD or UPI flow
      await saveOrderToFirebase(paymentMethod === 'upi' ? transactionId : null);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-20 font-body animate-fade-in">
      <header className="bg-white/80 backdrop-blur-md border-b border-earth-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-earth-500 hover:text-earth-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cart</span>
            </Link>
            <div className="font-heading font-bold text-xl text-earth-800 tracking-tight">RADHE BANGLES</div>
            <div className="w-20 flex justify-end">
              <ShieldCheck className="w-6 h-6 text-sage-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl font-heading font-bold text-earth-900 mb-8">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
              
              {/* Shipping Details */}
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-earth-100">
                <h2 className="text-xl font-heading font-semibold text-earth-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sage-500" /> Shipping Details
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="input-label">Full Name</label>
                    <input required type="text" name="fullName" value={form.fullName} onChange={handleFieldChange} className="input-field" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="input-label">Phone Number</label>
                    <input required type="tel" name="phone" value={form.phone} onChange={handleFieldChange} className="input-field" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="input-label">Email Address (Optional)</label>
                    <input type="email" name="email" value={form.email} onChange={handleFieldChange} className="input-field" placeholder="jane@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="input-label mb-0">Delivery Address</label>
                      <button 
                        type="button" 
                        onClick={handleGetLocation} 
                        disabled={gettingLocation}
                        className={`text-xs font-semibold flex items-center gap-1 ${location ? 'text-emerald-600' : 'text-sage-600 hover:text-sage-800'}`}
                      >
                        {gettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        {location ? "Location Captured ✓" : "📍 Use Current Location"}
                      </button>
                    </div>
                    <textarea required name="address" value={form.address} onChange={handleFieldChange} rows="3" className="input-field resize-none" placeholder="Flat No, Building, Street..." />
                  </div>
                  <div>
                    <label className="input-label">City</label>
                    <input required type="text" name="city" value={form.city} onChange={handleFieldChange} className="input-field" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="input-label">State</label>
                    <input required type="text" name="state" value={form.state} onChange={handleFieldChange} className="input-field" placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="input-label">PIN Code</label>
                    <input required type="text" name="pincode" value={form.pincode} onChange={handleFieldChange} className="input-field" placeholder="400001" />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-earth-100">
                <h2 className="text-xl font-heading font-semibold text-earth-800 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sage-500" /> Payment Method
                </h2>
                
                <div className="space-y-4">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-sage-500 bg-sage-50' : 'border-earth-200 hover:border-earth-300'}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-sage-600" />
                    <div>
                      <p className="font-semibold text-earth-800">Cash on Delivery (COD)</p>
                      <p className="text-sm text-earth-500">Pay when your order arrives.</p>
                    </div>
                  </label>

                  <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-sage-500 bg-sage-50' : 'border-earth-200 hover:border-earth-300'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-sage-600" />
                      <div>
                        <p className="font-semibold text-earth-800">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-sm text-earth-500">Scan QR Code and pay instantly.</p>
                      </div>
                    </div>
                    
                    {paymentMethod === 'upi' && upiDetails.upiId && (
                      <div className="mt-4 pt-4 border-t border-sage-200 flex flex-col items-center animate-fade-in text-center">
                        <p className="text-sm font-semibold text-earth-800 mb-3">Scan with any UPI App</p>
                        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 inline-block border border-earth-100 hidden sm:block">
                           <QRCodeSVG value={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${finalTotal}&cu=INR`} size={160} />
                        </div>
                        
                        {/* Mobile Direct Pay Button */}
                        <a 
                          href={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${finalTotal}&cu=INR`}
                          className="w-full sm:hidden bg-sage-600 text-white font-bold py-3 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 shadow-sm hover:bg-sage-700 transition-colors"
                        >
                          <span>Pay directly with UPI App</span>
                        </a>

                        <p className="text-xs text-earth-500 mb-1">Or pay to this UPI ID:</p>
                        <p className="text-sm font-mono font-bold text-earth-800 bg-white px-3 py-1 rounded border border-earth-200 mb-6">{upiDetails.upiId}</p>
                        
                        <div className="w-full text-left bg-white p-4 rounded-xl border border-sage-200 shadow-sm">
                          <label className="input-label text-sage-800">Transaction ID (UTR) <span className="text-rose-500">*</span></label>
                          <input type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 123456789012" className="input-field bg-earth-50 border-earth-200 focus:border-sage-500" />
                          <p className="text-xs text-sage-600 mt-1">Please enter the 12-digit UTR/Ref number after paying so we can verify your order.</p>
                        </div>
                      </div>
                    )}
                    
                    {paymentMethod === 'upi' && !upiDetails.upiId && (
                       <div className="mt-4 pt-4 border-t border-sage-200 text-rose-500 text-sm font-semibold text-center">
                         UPI payments are currently disabled by the store owner.
                       </div>
                    )}
                  </label>

                  {razorpayDetails.enabled && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-sage-500 bg-sage-50' : 'border-earth-200 hover:border-earth-300'}`}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-sage-600" />
                      <div>
                        <p className="font-semibold text-earth-800">Online Payment (Razorpay)</p>
                        <p className="text-sm text-earth-500">Pay securely via Credit Card, Debit Card, Netbanking, or Wallet.</p>
                      </div>
                    </label>
                  )}
                </div>
              </section>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-earth-100 sticky top-24">
              <h2 className="text-xl font-heading font-semibold text-earth-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-20 rounded-lg bg-earth-100 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-earth-800 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-earth-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium text-earth-600">Qty: {item.quantity}</span>
                        <span className="font-bold text-sm text-earth-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-earth-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-earth-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>Shipping {cartTotal < 299 ? '(Delivery Charge)' : ''}</span>
                  <span className={deliveryCharge > 0 ? "text-earth-900 font-medium" : "text-sage-600 font-medium"}>
                    {deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-earth-100">
                  <span className="font-heading font-bold text-lg text-earth-900">Total</span>
                  <span className="text-2xl font-bold text-earth-900">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={submitting}
                className="w-full btn-primary py-4 text-lg"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2 inline" /> Processing...</>
                ) : (
                  "Place Order"
                )}
              </button>
              
              <p className="text-xs text-center text-earth-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-sage-500" /> Secure encrypted checkout
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
