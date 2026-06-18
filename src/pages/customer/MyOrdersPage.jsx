import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { PackageOpen, ArrowLeft, Loader2, Search, ChevronRight, Package } from "lucide-react";
import { formatPrice } from "../../utils/helpers";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const savedOrders = JSON.parse(localStorage.getItem('my_bangle_orders') || '[]');
      
      if (savedOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const fetchedOrders = [];
      // Fetch each order from Firestore
      for (const orderId of savedOrders) {
        try {
          const docRef = doc(db, "orders", orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetchedOrders.push({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error(`Error fetching order ${orderId}:`, err);
        }
      }

      // Sort by newest first
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error loading orders from local storage:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-white font-bold text-base flex-1">My Orders</h1>
            <Link to="/track-order" className="text-white text-xs font-bold uppercase hover:text-white/80">
              Track Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-fk-blue" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 md:p-12 text-center shadow-card animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-2">No Orders Yet</h2>
            <p className="text-sm text-gray-500 mb-6">You haven't placed any orders on this device.</p>
            <div className="flex justify-center gap-3">
              <Link to="/" className="bg-fk-blue text-white font-bold py-2.5 px-5 rounded-sm text-xs uppercase">Shop Now</Link>
              <Link to="/track-order" className="bg-white text-fk-blue font-bold py-2.5 px-5 rounded-sm text-xs uppercase border border-gray-200">Track Order</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow-card overflow-hidden animate-fade-in">
                
                {/* Order Items */}
                {order.items?.map((item, idx) => (
                  <div key={idx} className={`p-3 md:p-4 flex gap-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                    {/* Image */}
                    <div className="w-16 h-20 bg-gray-50 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                      <p className="font-bold text-sm text-gray-900 mt-1">{formatPrice(item.price)}</p>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-end justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Order Footer */}
                <div className="px-3 md:px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500">
                      Order #{order.id.slice(-8)} • {order.paymentMethod?.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900">{formatPrice(order.totalAmount)}</span>
                    <Link 
                      to="/track-order" 
                      state={{ orderId: order.id }}
                      className="text-fk-blue text-xs font-bold flex items-center gap-0.5 hover:underline"
                    >
                      TRACK <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
