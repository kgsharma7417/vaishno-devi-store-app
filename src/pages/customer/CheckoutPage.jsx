import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../components/shared/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useSEO } from "../../hooks/useSEO";
import { formatPrice } from "../../utils/helpers";
import { db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, writeBatch } from "firebase/firestore";
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, PackageCheck, Loader2, ChevronRight, Tag, Info } from "lucide-react";
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

  const [deliveryType, setDeliveryType] = useState("shipping"); // 'shipping' or 'pickup'
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

  const hasCodDisabledItem = cartItems.some(item => item.isCodAvailable === false);

  useEffect(() => {
    if (hasCodDisabledItem && paymentMethod === 'cod') {
      setPaymentMethod('upi');
    }
  }, [hasCodDisabledItem, paymentMethod]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
          <PackageCheck className="w-10 h-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Your Cart is Empty</h1>
        <p className="text-sm font-medium text-slate-500 mb-8 text-center max-w-sm">Looks like you haven't added anything yet. Discover our premium collection!</p>
        <Link to="/" className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-8 rounded-full shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5">Start Shopping</Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="bg-white p-8 md:p-12 shadow-xl rounded-3xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm relative">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <div className="absolute inset-0 border border-emerald-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Order Confirmed!</h1>
          <p className="text-sm font-medium text-slate-500 mb-6">
            Thank you for your purchase. We're getting your order ready to be shipped.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Order ID</p>
            <p className="text-sm font-mono font-bold text-slate-800">
              {placedOrderId}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/my-orders" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-3 px-6 rounded-xl shadow-md shadow-violet-200 transition-all w-full sm:w-auto">View Orders</Link>
            <Link to="/" className="bg-white border-2 border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 text-sm font-bold py-3 px-6 rounded-xl transition-all w-full sm:w-auto">Continue Shopping</Link>
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

  const deliveryCharge = (deliveryType === 'shipping' && cartTotal < 299 && cartTotal > 0) ? 30 : 0;
  const giftWrapCharge = isGiftWrap ? 30 : 0;
  const grandTotal = finalTotal + deliveryCharge + giftWrapCharge;

  const saveOrderToFirebase = async (txnId = null, pMethod = paymentMethod) => {
    try {
      let pStatus = 'Pending (COD)';
      if (pMethod === 'upi') pStatus = 'Pending (UPI)';
      if (pMethod === 'razorpay') pStatus = 'Paid (Razorpay)';

      const orderData = {
        customerDetails: deliveryType === 'pickup' ? { 
          fullName: form.fullName, 
          phone: form.phone, 
          email: form.email, 
          location: location 
        } : { ...form, location: location },
        items: cartItems,
        subtotal: cartTotal,
        deliveryType,
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

      // Create a batch to update stock and save order
      const batch = writeBatch(db);

      // Update inventory for each item
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        const pSnap = await getDoc(productRef);
        
        if (pSnap.exists()) {
          const pData = pSnap.data();
          let updates = {};
          
          if (pData.sizesAndStock && item.size && pData.sizesAndStock[item.size] !== undefined) {
            const currentSizeStock = pData.sizesAndStock[item.size];
            updates[`sizesAndStock.${item.size}`] = Math.max(0, currentSizeStock - item.quantity);
            // Also deduct from total stock if it exists
            if (pData.stockQuantity !== undefined) {
              updates.stockQuantity = Math.max(0, pData.stockQuantity - item.quantity);
            }
          } else if (pData.stockQuantity !== undefined) {
            updates.stockQuantity = Math.max(0, pData.stockQuantity - item.quantity);
          }

          // If stock falls to 0, mark out of stock
          if (updates.stockQuantity === 0 || (pData.stockQuantity !== undefined && pData.stockQuantity - item.quantity <= 0)) {
            updates.isOutOfStock = true;
          }
          
          if (Object.keys(updates).length > 0) {
            batch.update(productRef, updates);
          }
        }
      }

      // Add order document to batch
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, orderData);

      // Commit all changes
      await batch.commit();

      setPlacedOrderId(orderRef.id);
      setOrderPlaced(true);

      // Save order to localStorage for history
      try {
        const existingOrders = JSON.parse(localStorage.getItem('my_bangle_orders') || '[]');
        if (!existingOrders.includes(orderRef.id)) {
          existingOrders.push(orderRef.id);
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

    // PIN code validation (Only for shipping)
    if (deliveryType === 'shipping' && !isValidPIN(form.pincode)) {
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
    <div className="min-h-screen bg-slate-50 pb-36 lg:pb-12 font-body animate-fade-in">
      {/* Header — Premium Glass */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-14 md:h-16 gap-4">
            <Link to="/" className="text-slate-600 p-2 hover:bg-slate-100 hover:text-violet-600 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-slate-900 font-black text-lg tracking-tight">Checkout</h1>
            <div className="ml-auto flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Secure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-600 font-black">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black border border-emerald-200">✓</span>
            Cart
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="flex items-center gap-1.5 text-violet-600 font-black">
            <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ring-2 ring-violet-100 ring-offset-1">2</span>
            Address
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-400 font-bold">
            <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px]">3</span>
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
              <section className="bg-white p-5 md:p-8 shadow-xl rounded-3xl border border-slate-100">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-violet-600" /> Delivery Method
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <label className={`flex-1 flex items-center gap-3 p-4 border-2 cursor-pointer transition-all rounded-2xl ${deliveryType === 'shipping' ? 'border-violet-600 bg-violet-50/50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="deliveryType" value="shipping" checked={deliveryType === 'shipping'} onChange={(e) => setDeliveryType(e.target.value)} className="w-5 h-5 text-violet-600 focus:ring-violet-600" />
                    <div>
                      <p className="font-bold text-sm text-slate-900">Ship to Address</p>
                      <p className="text-[11px] font-medium text-slate-500">Standard courier delivery</p>
                    </div>
                  </label>

                  <label className={`flex-1 flex items-center gap-3 p-4 border-2 cursor-pointer transition-all rounded-2xl ${deliveryType === 'pickup' ? 'border-violet-600 bg-violet-50/50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="deliveryType" value="pickup" checked={deliveryType === 'pickup'} onChange={(e) => setDeliveryType(e.target.value)} className="w-5 h-5 text-violet-600 focus:ring-violet-600" />
                    <div>
                      <p className="font-bold text-sm text-slate-900">Store Pickup <span className="text-emerald-600">(Free)</span></p>
                      <p className="text-[11px] font-medium text-slate-500">Collect from our shop</p>
                    </div>
                  </label>
                </div>

                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2 mt-8 border-t border-slate-100 pt-8">
                  <MapPin className="w-5 h-5 text-violet-600" /> {deliveryType === 'pickup' ? "Contact Details" : "Delivery Address"}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name <span className="text-rose-500">*</span></label>
                    <input required type="text" name="fullName" value={form.fullName} onChange={handleFieldChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900"
                      placeholder="9876543210"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      title="Enter a valid 10-digit Indian mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email <span className="text-slate-400 font-medium normal-case tracking-normal">(Optional)</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleFieldChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900" placeholder="jane@example.com" />
                  </div>
                  {deliveryType === 'pickup' ? (
                    <div className="sm:col-span-2 mt-4 p-5 bg-violet-50 border border-violet-100 rounded-2xl shadow-sm">
                      <p className="text-sm font-black text-violet-900 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Pickup Location:</p>
                      <p className="text-sm text-violet-800 leading-relaxed font-medium">
                        Maa Vaishno Devi Ladies Corner & Gift Center<br />
                        Shri Mankameshwar Nath Market,<br />
                        Jalesar Road, Tedi Bagiya Tiraha, Agra - 6
                      </p>
                      <p className="text-xs text-rose-600 font-bold mt-3">
                        * Please show your Order ID at the counter when you visit.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="sm:col-span-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Delivery Address <span className="text-rose-500">*</span></label>
                          <button 
                            type="button" 
                            onClick={handleGetLocation} 
                            disabled={gettingLocation}
                            className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${location ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'}`}
                          >
                            {gettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                            {location ? "Location Captured ✓" : "Use Current Location"}
                          </button>
                        </div>
                        <textarea required={deliveryType === 'shipping'} name="address" value={form.address} onChange={handleFieldChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900 resize-none" placeholder="Flat No, Building, Street..." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">City <span className="text-rose-500">*</span></label>
                        <input required={deliveryType === 'shipping'} type="text" name="city" value={form.city} onChange={handleFieldChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900" placeholder="Mumbai" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">State <span className="text-rose-500">*</span></label>
                        <input required={deliveryType === 'shipping'} type="text" name="state" value={form.state} onChange={handleFieldChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900" placeholder="Maharashtra" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">PIN Code <span className="text-rose-500">*</span></label>
                        <input
                          required={deliveryType === 'shipping'}
                          type="text"
                          name="pincode"
                          value={form.pincode}
                          onChange={handleFieldChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900"
                          placeholder="400001"
                          pattern={deliveryType === 'shipping' ? "[1-9][0-9]{5}" : ".*"}
                          maxLength={6}
                          title="Enter a valid 6-digit PIN code"
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-5 md:p-8 shadow-xl rounded-3xl border border-slate-100">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-violet-600" /> Payment Method
                </h2>
                
                <div className="space-y-4">
                  {hasCodDisabledItem && (
                    <div className="mb-4 p-4 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl border border-rose-200 flex items-start gap-3 shadow-sm">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      One or more items in your cart do not support Cash on Delivery. Please pay online via UPI or Card.
                    </div>
                  )}

                  <label className={`flex items-center gap-4 p-4 border-2 transition-all rounded-2xl ${hasCodDisabledItem ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : paymentMethod === 'cod' ? 'border-violet-600 bg-violet-50/50 shadow-md cursor-pointer scale-[1.01]' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50 cursor-pointer'}`}>
                    <input type="radio" name="payment" value="cod" disabled={hasCodDisabledItem} checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-violet-600 focus:ring-violet-600" />
                    <div>
                      <p className={`font-bold text-sm ${hasCodDisabledItem ? 'text-slate-500' : 'text-slate-900'}`}>Cash on Delivery {hasCodDisabledItem && '(Disabled)'}</p>
                      <p className="text-[11px] font-medium text-slate-500">Pay when your order arrives.</p>
                    </div>
                  </label>

                  <label className={`flex flex-col p-4 border-2 cursor-pointer transition-all rounded-2xl ${paymentMethod === 'upi' ? 'border-violet-600 bg-violet-50/50 shadow-md scale-[1.01]' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-violet-600 focus:ring-violet-600" />
                      <div>
                        <p className="font-bold text-sm text-slate-900">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-[11px] font-medium text-slate-500">Scan QR Code and pay instantly.</p>
                      </div>
                    </div>
                    
                    {paymentMethod === 'upi' && upiDetails.upiId && (
                      <div className="mt-4 pt-4 border-t border-violet-100 flex flex-col items-center animate-fade-in text-center">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Scan with any UPI App</p>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 inline-block border border-slate-200 hidden sm:block">
                        <QRCodeSVG value={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${grandTotal}&cu=INR`} size={160} />
                        </div>
                        
                        <a 
                          href={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.payeeName || 'Store')}&am=${grandTotal}&cu=INR`}
                          className="w-full sm:hidden bg-violet-600 text-white font-black py-3.5 px-6 rounded-xl mb-4 flex items-center justify-center gap-2 text-sm shadow-md"
                        >
                          Pay with UPI App
                        </a>

                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">UPI ID:</p>
                        <p className="text-sm font-mono font-black text-violet-700 bg-white px-4 py-2 rounded-xl border border-violet-200 mb-6 shadow-sm">{upiDetails.upiId}</p>
                        
                        <div className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative">
                            Transaction ID (UTR) <span className="text-rose-500">*</span>
                            <div className="group relative flex items-center cursor-help">
                              <Info className="w-4 h-4 text-violet-500 hover:text-violet-700" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-medium">
                                <p className="font-bold mb-1.5 border-b border-slate-700 pb-1.5">Where to find UTR/Ref No?</p>
                                <p className="mb-1">• <strong className="text-violet-300">PhonePe:</strong> "UTR" (12 digits) in History.</p>
                                <p className="mb-1">• <strong className="text-violet-300">GPay:</strong> "UPI transaction ID" in details.</p>
                                <p>• <strong className="text-violet-300">Paytm:</strong> "UPI Ref No" in History.</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          </label>
                          <input type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 123456789012" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900" />
                          <p className="text-[11px] font-medium text-slate-500 mt-2">Enter the 12-digit UTR/Ref number after paying.</p>
                        </div>
                      </div>
                    )}
                    
                    {paymentMethod === 'upi' && !upiDetails.upiId && (
                       <div className="mt-4 pt-4 border-t border-violet-100 text-rose-600 text-sm font-bold text-center">
                         UPI payments are currently disabled by the store owner.
                       </div>
                    )}
                  </label>

                  {razorpayDetails.enabled && (
                    <label className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all rounded-2xl ${paymentMethod === 'razorpay' ? 'border-violet-600 bg-violet-50/50 shadow-md scale-[1.01]' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-violet-600 focus:ring-violet-600" />
                      <div>
                        <p className="font-bold text-sm text-slate-900">Online Payment (Razorpay)</p>
                        <p className="text-[11px] font-medium text-slate-500">Credit Card, Debit Card, Netbanking, or Wallet.</p>
                      </div>
                    </label>
                  )}
                </div>
              </section>
            </form>
          </div>

          <div className="lg:col-span-4">

            <div className="bg-white p-6 md:p-8 shadow-xl rounded-3xl sticky top-24 mt-2 border border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-6">Price Details</h2>
              
              <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-20 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1.5">Size: {item.size} | Color: {item.color}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[11px] font-bold text-slate-400">Qty: {item.quantity}</span>
                        <span className="font-black text-sm text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Wrap Section */}
              <div className="mb-6 p-4 bg-rose-50/60 border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="w-5 h-5 text-rose-500 border-rose-200 rounded focus:ring-rose-200 transition-all"
                  />
                  <div>
                    <p className="text-sm font-black text-slate-900">🎁 Gift Wrap this order? (+₹30)</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Includes beautiful gift box & custom greeting note.</p>
                  </div>
                </label>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-3 text-sm font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Price ({cartItems.length} items)</span>
                  <span className="font-bold text-slate-800">{formatPrice(cartTotal)}</span>
                </div>
                {isGiftWrap && (
                  <div className="flex justify-between">
                    <span>Gift Wrap Charge</span>
                    <span className="font-bold text-slate-800">{formatPrice(30)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className={deliveryCharge > 0 ? "text-slate-800 font-bold" : "text-emerald-600 font-bold"}>
                    {deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-slate-100 font-black text-slate-900">
                  <span className="text-base">Total Amount</span>
                  <span className="text-xl text-violet-700">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Desktop Place Order */}
              <button 
                type="submit" 
                form="checkout-form"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-xl text-sm uppercase mt-6 transition-all shadow-lg shadow-violet-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2 inline" /> Processing...</>
                ) : (
                  "Place Order"
                )}
              </button>
              
              <p className="text-[10px] text-center font-bold text-slate-400 mt-4 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Safe & Secure Payments
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 lg:hidden z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center p-3 gap-4">
        <div className="flex-1 pl-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
          <div>
            <p className="font-black text-lg text-violet-700">{formatPrice(grandTotal)}</p>
          </div>
        </div>
        <button 
          type="submit" 
          form="checkout-form"
          disabled={submitting}
          className="bg-violet-600 hover:bg-violet-700 text-white font-black py-3.5 px-8 rounded-xl text-sm uppercase flex-shrink-0 shadow-md transition-all active:scale-95 disabled:opacity-70"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-1 inline" /> Wait...</>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
}
