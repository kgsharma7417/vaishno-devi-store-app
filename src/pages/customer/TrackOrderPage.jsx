import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search, PackageSearch, PackageOpen, ArrowLeft, CheckCircle2, Clock, Truck, Home, Phone, Hash } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import { useSEO } from "../../hooks/useSEO";

export default function TrackOrderPage() {
  const location = useLocation();
  const [searchMode, setSearchMode] = useState("id"); // "id" or "phone"
  const [searchInput, setSearchInput] = useState(location.state?.orderId || "");
  const [loading, setLoading] = useState(false);

  useSEO({ title: "Track Order", description: "Track your Maa Vaishno Devi Ladies Corner & Gift Center order status in real-time. Enter your Order ID or phone number to get updates." });
  
  // States for Order ID search
  const [orderData, setOrderData] = useState(null);
  
  // States for Phone search
  const [phoneOrders, setPhoneOrders] = useState([]);
  
  const [error, setError] = useState("");

  const performSearch = useCallback(async (queryVal, mode) => {
    if (!queryVal.trim()) return;
    setLoading(true);
    setError("");
    setOrderData(null);
    setPhoneOrders([]);

    try {
      if (mode === "id") {
        const docRef = doc(db, "orders", queryVal.trim());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setOrderData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Order not found. Please check your Order ID.");
        }
      } else if (mode === "phone") {
        const q = query(collection(db, "orders"), where("customerDetails.phone", "==", queryVal.trim()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          orders.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setPhoneOrders(orders);
        } else {
          setError("No orders found for this phone number.");
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("An error occurred while tracking the order.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.orderId) {
      setSearchMode("id");
      setSearchInput(location.state.orderId);
      performSearch(location.state.orderId, "id");
    }
  }, [location.state?.orderId, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchInput, searchMode);
  };

  const getStatusStep = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 1;
    if (s === 'processing') return 2;
    if (s === 'packed') return 3;
    if (s === 'shipped') return 4;
    if (s === 'out for delivery') return 5;
    if (s === 'delivered') return 6;
    return 0; // Cancelled or unknown
  };

  const currentStep = getStatusStep(orderData?.orderStatus);
  const isCancelled = orderData?.orderStatus === 'Cancelled';

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'processing') return 'bg-blue-100 text-blue-800';
    if (s === 'packed') return 'bg-indigo-100 text-indigo-800';
    if (s === 'shipped') return 'bg-purple-100 text-purple-800';
    if (s === 'out for delivery') return 'bg-orange-100 text-orange-800';
    if (s === 'delivered') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (s === 'cancelled') return 'bg-rose-50 text-rose-600 border border-rose-100';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-body animate-fade-in">
      {/* Header — Premium Glass */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-14 md:h-16 gap-4">
            <Link to="/" className="text-slate-600 p-2 hover:bg-slate-100 hover:text-violet-600 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-slate-900 font-black text-lg flex-1 tracking-tight">Track Order</h1>
            <Link to="/my-orders" className="text-violet-600 text-[11px] font-black uppercase tracking-widest hover:text-violet-800 hover:bg-violet-50 px-3 py-1.5 rounded-full transition-colors">
              My Orders
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Search Card */}
        <div className="bg-white p-6 md:p-8 shadow-xl rounded-3xl border border-slate-100 mb-6">
          
          {/* Search Mode Toggle */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-6 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => { setSearchMode("id"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${searchMode === "id" ? 'bg-white text-violet-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Hash className="w-3.5 h-3.5" /> Order ID
            </button>
            <button
              type="button"
              onClick={() => { setSearchMode("phone"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${searchMode === "phone" ? 'bg-white text-violet-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Phone className="w-3.5 h-3.5" /> Phone No.
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type={searchMode === "phone" ? "tel" : "text"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchMode === "id" ? "Enter Order ID" : "Enter Phone Number"}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-black px-6 py-3.5 sm:py-0 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-200 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" /> Track Now
                </>
              )}
            </button>
          </form>
          {error && <p className="text-rose-600 mt-4 text-sm font-medium bg-rose-50 p-3 rounded-xl border border-rose-100 text-center flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> {error}</p>}
        </div>

        {/* View: Multiple Orders (Phone Search Result) */}
        {phoneOrders.length > 0 && !orderData && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2 mb-4 text-center">{phoneOrders.length} orders found for {searchInput}</p>
            {phoneOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white p-4 md:p-5 shadow-xl rounded-2xl border border-slate-100 flex justify-between items-center gap-4 hover:shadow-2xl transition-all cursor-pointer group" 
                onClick={() => { setOrderData(order); setPhoneOrders([]); }}
              >
                <div>
                  <p className="text-sm font-mono text-slate-800 font-bold group-hover:text-violet-700 transition-colors">#{order.id.slice(-8)}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">{order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-black text-base text-slate-900">{formatPrice(order.totalAmount)}</p>
                  <p className="text-[10px] text-violet-600 font-black tracking-widest mt-2 uppercase flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">VIEW <ArrowLeft className="w-3 h-3 rotate-180" /></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View: Single Order Timeline */}
        {orderData && (
          <div className="bg-white shadow-xl rounded-3xl border border-slate-100 overflow-hidden animate-fade-in">
            {/* Order Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">Order Details</h2>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${isCancelled ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {orderData.orderStatus}
                </span>
              </div>
              <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 inline-block mb-2 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Order ID</p>
                 <p className="text-sm font-mono font-black text-slate-800">{orderData.id}</p>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {orderData.createdAt?.toDate().toLocaleString()}</p>
              
              {/* Courier Tracking Information (if available) */}
              {(orderData.courierName || orderData.trackingNumber) && (
                <div className="mt-6 p-4 bg-violet-50 border border-violet-100 rounded-2xl text-xs text-violet-900 space-y-2 animate-scale-in shadow-sm">
                  <p className="font-black uppercase tracking-wider flex items-center gap-2 mb-3"><PackageSearch className="w-4 h-4 text-violet-600" /> Shipping Information</p>
                  {orderData.courierName && (
                    <p className="flex items-center gap-2"><span className="text-violet-600/70 font-bold w-32">Courier Partner:</span> <span className="font-bold">{orderData.courierName}</span></p>
                  )}
                  {orderData.trackingNumber && (
                    <div className="flex items-start gap-2">
                      <span className="text-violet-600/70 font-bold w-32 shrink-0">Tracking Number:</span>{" "}
                      {orderData.trackingNumber.startsWith("http") ? (
                        <a href={orderData.trackingNumber} target="_blank" rel="noopener noreferrer" className="underline text-violet-700 font-black hover:text-violet-900">
                          Track Shipment ↗
                        </a>
                      ) : (
                        <span className="font-mono font-black bg-white px-2.5 py-1 rounded-md border border-violet-200 shadow-sm">{orderData.trackingNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tracking Progress — Vertical Timeline (Mobile Friendly) */}
            {!isCancelled && (
              <div className="p-6 md:p-10 border-b border-slate-100 relative">
                <div className="space-y-0 relative z-10">
                  {[
                    { step: 1, label: 'Order Placed', desc: 'Your order has been placed', icon: Clock },
                    { step: 2, label: 'Processing', desc: 'Seller is preparing your order', icon: PackageSearch },
                    { step: 3, label: 'Packed', desc: 'Your order is packed and ready', icon: PackageOpen },
                    { step: 4, label: 'Shipped', desc: 'Your order is on the way', icon: Truck },
                    { step: 5, label: 'Out for Delivery', desc: 'Out for delivery today', icon: Truck },
                    { step: 6, label: 'Delivered', desc: 'Your order has been delivered', icon: Home }
                  ].map(({ step, label, desc, icon: Icon }, index, arr) => {
                    const isCompleted = currentStep >= step;
                    const isCurrent = currentStep === step;
                    return (
                      <div key={step} className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 z-10 shadow-sm
                            ${isCompleted ? 'bg-violet-600 text-white shadow-violet-200 ring-4 ring-violet-50' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                            {isCompleted && step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          {index < arr.length - 1 && (
                            <div className={`w-0.5 h-12 transition-all duration-700 ${currentStep > step ? 'bg-violet-600' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="pb-8 pt-1.5">
                          <p className={`text-sm font-black tracking-wide ${isCurrent ? 'text-violet-700' : (isCompleted ? 'text-slate-800' : 'text-slate-400')}`}>
                            {label}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 mt-1">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="p-6 bg-rose-50 text-rose-600 text-center text-sm font-black tracking-wider uppercase border-b border-rose-100 shadow-inner">
                <span className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> This order has been cancelled</span>
              </div>
            )}

            {/* Items */}
            <div className="p-6 md:p-8 bg-slate-50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-20 bg-slate-50 overflow-hidden flex-shrink-0 rounded-xl border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 py-1">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1.5">Size: {item.size} | Color: {item.color}</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{formatPrice(item.price)} <span className="text-slate-400 font-medium text-xs ml-1">x {item.quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Payment Method</span>
                  <span className="font-bold text-slate-900">{orderData.paymentMethod?.toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
                <div className="flex justify-between items-center mb-5 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Payment Status</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${orderData.paymentStatus?.includes('Received') || orderData.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                    {orderData.paymentStatus?.includes('Received') || orderData.paymentStatus?.includes('Paid') ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-5 border-t border-slate-200">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-xs">Total {orderData.paymentStatus?.includes('Received') || orderData.paymentStatus?.includes('Paid') ? 'Paid' : 'to Pay'}</span>
                  <span className="text-xl font-black text-violet-700">{formatPrice(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>
            
            {/* Back Button (if came from phone search) */}
            {searchMode === "phone" && (
              <div className="p-4 bg-white border-t border-slate-100 text-center">
                <button onClick={() => { setOrderData(null); performSearch(searchInput, "phone"); }} className="text-violet-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto hover:text-violet-800 hover:bg-violet-50 px-4 py-2 rounded-full transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
