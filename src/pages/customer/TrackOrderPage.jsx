import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search, PackageSearch, ArrowLeft, CheckCircle2, Clock, Truck, Home, Phone, Hash } from "lucide-react";
import { formatPrice } from "../../utils/helpers";

export default function TrackOrderPage() {
  const location = useLocation();
  const [searchMode, setSearchMode] = useState("id"); // "id" or "phone"
  const [searchInput, setSearchInput] = useState(location.state?.orderId || "");
  const [loading, setLoading] = useState(false);
  
  // States for Order ID search
  const [orderData, setOrderData] = useState(null);
  
  // States for Phone search
  const [phoneOrders, setPhoneOrders] = useState([]);
  
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.orderId) {
      setSearchMode("id");
      setSearchInput(location.state.orderId);
      performSearch(location.state.orderId, "id");
    }
  }, [location.state?.orderId]);

  const performSearch = async (queryVal, mode) => {
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
          // Sort by date descending
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
  };

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
    if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'processing') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'shipped') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s === 'delivered') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-earth-100 text-earth-800 border-earth-200';
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-20 font-body animate-fade-in">
      <header className="bg-white/80 backdrop-blur-md border-b border-earth-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-earth-500 hover:text-earth-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="font-heading font-bold text-xl text-earth-800 tracking-tight">RADHE BANGLES</div>
            <div className="w-24 flex justify-end">
              <Link to="/my-orders" className="text-sage-600 font-semibold hover:text-sage-800 text-sm">
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <PackageSearch className="w-12 h-12 text-sage-600 mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold text-earth-900 mb-2">Track Your Order</h1>
          <p className="text-earth-500">Find your order status instantly.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-earth-100 mb-8">
          
          {/* Search Mode Toggle */}
          <div className="flex gap-2 p-1 bg-earth-100 rounded-xl mb-6 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => { setSearchMode("id"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${searchMode === "id" ? 'bg-white text-sage-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'}`}
            >
              <Hash className="w-4 h-4" /> Order ID
            </button>
            <button
              type="button"
              onClick={() => { setSearchMode("phone"); setSearchInput(""); setOrderData(null); setPhoneOrders([]); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${searchMode === "phone" ? 'bg-white text-sage-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'}`}
            >
              <Phone className="w-4 h-4" /> Phone No.
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <input
              type={searchMode === "phone" ? "tel" : "text"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchMode === "id" ? "e.g. jB3x...9Rz" : "e.g. 9876543210"}
              className="input-field flex-1 text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 px-8 py-3 sm:py-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" /> Search
                </>
              )}
            </button>
          </form>
          {error && <p className="text-rose-500 mt-4 text-center bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
        </div>

        {/* View: Multiple Orders (Phone Search Result) */}
        {phoneOrders.length > 0 && !orderData && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold text-earth-800 mb-4">Orders found for {searchInput}</h2>
            {phoneOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-earth-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-sage-300 transition-colors cursor-pointer" onClick={() => { setOrderData(order); setPhoneOrders([]); }}>
                <div>
                  <p className="text-sm font-mono text-earth-600 font-bold mb-1">ID: {order.id}</p>
                  <p className="text-xs text-earth-500 mb-2">Placed on: {order.createdAt?.toDate().toLocaleString()}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <p className="font-bold text-sage-600">{formatPrice(order.totalAmount)}</p>
                  <button className="text-xs font-semibold text-earth-600 bg-earth-100 hover:bg-earth-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                    View Details <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View: Single Order Timeline */}
        {orderData && (
          <div className="bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-earth-100 bg-earth-50/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-heading font-bold text-earth-900">Order Details</h2>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border 
                  ${isCancelled ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-sage-100 text-sage-800 border-sage-200'}
                `}>
                  {orderData.orderStatus}
                </span>
              </div>
              <p className="text-sm text-earth-500 font-mono">ID: {orderData.id}</p>
              <p className="text-sm text-earth-500">Placed on: {orderData.createdAt?.toDate().toLocaleString()}</p>
            </div>

            {/* Tracking Progress */}
            {!isCancelled && (
              <div className="p-8 border-b border-earth-100 overflow-x-auto">
                <div className="relative flex justify-between min-w-[400px]">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-earth-100 -translate-y-1/2 rounded-full" />
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-sage-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />

                  {/* Steps */}
                  {[
                    { step: 1, label: 'Pending', icon: Clock },
                    { step: 2, label: 'Processing', icon: PackageSearch },
                    { step: 3, label: 'Shipped', icon: Truck },
                    { step: 4, label: 'Delivered', icon: Home }
                  ].map(({ step, label, icon: Icon }) => {
                    const isCompleted = currentStep >= step;
                    const isCurrent = currentStep === step;
                    return (
                      <div key={step} className="relative z-10 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500
                          ${isCompleted ? 'bg-sage-500 text-white shadow-md' : 'bg-earth-200 text-earth-400'}
                        `}>
                          {isCompleted && step < 4 ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-3 font-semibold ${isCurrent ? 'text-sage-700' : (isCompleted ? 'text-earth-800' : 'text-earth-400')}`}>
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="p-6 bg-rose-50 text-rose-800 text-center border-b border-rose-100">
                This order has been cancelled.
              </div>
            )}

            {/* Items Summary */}
            <div className="p-6">
              <h3 className="font-bold text-earth-800 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-20 bg-earth-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-earth-800">{item.name}</p>
                      <p className="text-xs text-earth-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                      <p className="text-sm font-bold text-earth-900 mt-2">{formatPrice(item.price)} <span className="text-earth-500 font-normal text-xs ml-1">x {item.quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-earth-100 flex justify-between items-center">
                <span className="font-heading font-bold text-lg text-earth-800">Total Amount</span>
                <span className="text-2xl font-black text-sage-600">{formatPrice(orderData.totalAmount)}</span>
              </div>
            </div>
            
            {/* Back Button (if came from phone search) */}
            {searchMode === "phone" && (
              <div className="p-4 bg-earth-50 border-t border-earth-100 text-center">
                <button onClick={() => { setOrderData(null); performSearch(searchInput, "phone"); }} className="text-sage-600 font-semibold hover:text-sage-800 flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-4 h-4" /> Back to Orders
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
