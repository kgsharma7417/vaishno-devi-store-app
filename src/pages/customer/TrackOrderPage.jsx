import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search, PackageSearch, ArrowLeft, CheckCircle2, Clock, Truck, Home, Phone, Hash } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import { useSEO } from "../../hooks/useSEO";

export default function TrackOrderPage() {
  const location = useLocation();
  const [searchMode, setSearchMode] = useState("id"); // "id" or "phone"
  const [searchInput, setSearchInput] = useState(location.state?.orderId || "");
  const [loading, setLoading] = useState(false);

  useSEO({ title: "Track Order", description: "Track your Radhe Bangles order status in real-time. Enter your Order ID or phone number to get updates." });
  
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
    if (s === 'shipped') return 3;
    if (s === 'delivered') return 4;
    return 0; // Cancelled or unknown
  };

  const currentStep = getStatusStep(orderData?.orderStatus);
  const isCancelled = orderData?.orderStatus === 'Cancelled';

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'processing') return 'bg-blue-100 text-blue-800';
    if (s === 'shipped') return 'bg-purple-100 text-purple-800';
    if (s === 'delivered') return 'bg-fk-green-light text-fk-green';
    if (s === 'cancelled') return 'bg-fk-red-light text-fk-red';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-body animate-fade-in">
      {/* Header */}
      <header className="bg-fk-blue sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center h-12 md:h-14 gap-3">
            <Link to="/" className="text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-white font-bold text-base flex-1">Track Order</h1>
            <Link to="/my-orders" className="text-white text-xs font-bold uppercase hover:text-white/80">
              My Orders
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8">
        
        {/* Search Card */}
        <div className="bg-white p-4 md:p-6 shadow-card mb-3">
          
          {/* Search Mode Toggle */}
          <div className="flex gap-0 p-0.5 bg-gray-100 rounded-sm mb-4 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => { setSearchMode("id"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all ${searchMode === "id" ? 'bg-fk-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Hash className="w-3 h-3" /> Order ID
            </button>
            <button
              type="button"
              onClick={() => { setSearchMode("phone"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all ${searchMode === "phone" ? 'bg-fk-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Phone className="w-3 h-3" /> Phone No.
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type={searchMode === "phone" ? "tel" : "text"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchMode === "id" ? "Enter Order ID" : "Enter Phone Number"}
              className="input-field flex-1 text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-fk-blue text-white font-bold px-5 rounded-sm text-sm flex items-center gap-1.5 hover:bg-fk-blue-dark transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" /> Search
                </>
              )}
            </button>
          </form>
          {error && <p className="text-fk-red mt-3 text-sm bg-fk-red-light p-2.5 rounded-sm">{error}</p>}
        </div>

        {/* View: Multiple Orders (Phone Search Result) */}
        {phoneOrders.length > 0 && !orderData && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-gray-500 px-1 mb-2">{phoneOrders.length} orders found for {searchInput}</p>
            {phoneOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white p-3 md:p-4 shadow-card flex justify-between items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer" 
                onClick={() => { setOrderData(order); setPhoneOrders([]); }}
              >
                <div>
                  <p className="text-xs font-mono text-gray-600 font-bold">#{order.id.slice(-8)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-sm ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">{formatPrice(order.totalAmount)}</p>
                  <p className="text-[10px] text-fk-blue font-bold mt-1">VIEW →</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View: Single Order Timeline */}
        {orderData && (
          <div className="bg-white shadow-card overflow-hidden animate-fade-in">
            {/* Order Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-gray-900">Order Details</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-sm ${isCancelled ? 'bg-fk-red-light text-fk-red' : 'bg-fk-green-light text-fk-green'}`}>
                  {orderData.orderStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">ID: {orderData.id}</p>
              <p className="text-[10px] text-gray-400">{orderData.createdAt?.toDate().toLocaleString()}</p>
            </div>

            {/* Tracking Progress — Vertical Timeline (Mobile Friendly) */}
            {!isCancelled && (
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="space-y-0">
                  {[
                    { step: 1, label: 'Order Placed', desc: 'Your order has been placed', icon: Clock },
                    { step: 2, label: 'Processing', desc: 'Seller is preparing your order', icon: PackageSearch },
                    { step: 3, label: 'Shipped', desc: 'Your order is on the way', icon: Truck },
                    { step: 4, label: 'Delivered', desc: 'Your order has been delivered', icon: Home }
                  ].map(({ step, label, desc, icon: Icon }, index) => {
                    const isCompleted = currentStep >= step;
                    const isCurrent = currentStep === step;
                    return (
                      <div key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                            ${isCompleted ? 'bg-fk-blue text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {isCompleted && step < currentStep ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          {index < 3 && (
                            <div className={`w-0.5 h-8 ${currentStep > step ? 'bg-fk-blue' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-semibold ${isCurrent ? 'text-fk-blue' : (isCompleted ? 'text-gray-800' : 'text-gray-400')}`}>
                            {label}
                          </p>
                          <p className="text-[10px] text-gray-400">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="p-4 bg-fk-red-light text-fk-red text-center text-sm font-semibold border-b border-red-100">
                This order has been cancelled.
              </div>
            )}

            {/* Items */}
            <div className="p-4 md:p-6">
              <h3 className="text-xs font-bold text-gray-900 uppercase mb-3">Items Ordered</h3>
              <div className="space-y-3">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-14 h-16 bg-gray-50 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.price)} <span className="text-gray-400 font-normal text-xs">x {item.quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total Amount</span>
                <span className="text-lg font-bold text-fk-blue">{formatPrice(orderData.totalAmount)}</span>
              </div>
            </div>
            
            {/* Back Button (if came from phone search) */}
            {searchMode === "phone" && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <button onClick={() => { setOrderData(null); performSearch(searchInput, "phone"); }} className="text-fk-blue font-bold text-xs uppercase flex items-center justify-center gap-1 mx-auto hover:underline">
                  <ArrowLeft className="w-3 h-3" /> Back to Orders
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
