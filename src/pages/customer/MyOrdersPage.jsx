import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { PackageOpen, ArrowLeft, Loader2, ChevronRight, Truck } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import { useSEO } from "../../hooks/useSEO";
import { useAuth } from "../../hooks/useAuth";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useSEO({ title: "My Orders", description: "View all your Maa Vaishno Devi Ladies Corner & Gift Center orders. Track status, view items, and manage your purchases." });

  useEffect(() => {
    fetchMyOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const savedIds = JSON.parse(localStorage.getItem('my_bangle_orders') || '[]');
      const allOrderIds = new Set(savedIds);

      // If user logged in via Google, also fetch by phone (if they placed orders with their number)
      let phoneOrders = [];
      if (userProfile?.email) {
        try {
          const q = query(
            collection(db, "orders"),
            where("customerDetails.email", "==", userProfile.email)
          );
          const snap = await getDocs(q);
          snap.docs.forEach(d => allOrderIds.add(d.id));
          phoneOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.error("Error fetching orders by email:", e);
        }
      }

      if (allOrderIds.size === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const fetchedOrders = [...phoneOrders];
      const fetchedIds = new Set(phoneOrders.map(o => o.id));

      // Fetch localStorage-only order IDs from Firestore
      for (const orderId of savedIds) {
        if (fetchedIds.has(orderId)) continue;
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
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'processing') return 'bg-blue-100 text-blue-800';
    if (s === 'packed') return 'bg-indigo-100 text-indigo-800';
    if (s === 'shipped') return 'bg-purple-100 text-purple-800';
    if (s === 'out for delivery') return 'bg-orange-100 text-orange-800';
    if (s === 'delivered') return 'bg-green-50 text-amazon-green';
    if (s === 'cancelled') return 'bg-red-50 text-amazon-red';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-body animate-fade-in">
      {/* Header */}
      <header className="bg-amazon-dark sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center h-12 md:h-14 gap-3">
            <Link to="/" className="text-white p-1 hover:outline hover:outline-1 hover:outline-white rounded-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-white font-bold text-base flex-1">My Orders</h1>
            <Link to="/track-order" className="text-white text-xs font-bold uppercase hover:text-amazon-yellow">
              Track Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amazon-orange" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 md:p-12 text-center shadow-card animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-2">No Orders Yet</h2>
            <p className="text-sm text-gray-500 mb-6">You haven't placed any orders on this device.</p>
            <div className="flex justify-center gap-3">
              <Link to="/" className="bg-amazon-orange hover:bg-amazon-orange/90 text-amazon-dark font-bold py-2.5 px-5 rounded-full text-xs uppercase">Shop Now</Link>
              <Link to="/track-order" className="bg-white text-amazon-link font-bold py-2.5 px-5 rounded-full text-xs uppercase border border-gray-200">Track Order</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow-card overflow-hidden animate-fade-in">
                
                {/* Order Items */}
                {order.items?.map((item, idx) => (
                  <div key={idx} className={`p-3 md:p-4 flex gap-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                    {/* Clickable Image & Details */}
                    <Link to={`/product/${item.id}`} className="flex gap-3 flex-1 min-w-0 hover:opacity-90 group transition-opacity">
                      {/* Image */}
                      <div className="w-16 h-20 bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 rounded-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium group-hover:text-amazon-link transition-colors line-clamp-2">{item.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                        <p className="font-bold text-sm text-gray-900 mt-1">{formatPrice(item.price)}</p>
                      </div>
                    </Link>

                    {/* Status */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Courier / Shipping Details */}
                {(order.courierName || order.trackingNumber) && (
                  <div className="px-3 md:px-4 py-3 border-t border-gray-100 bg-blue-50/30">
                    <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      {order.courierName ? `Shipped via ${order.courierName}` : 'Shipped via Courier'}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-xs text-gray-600 mt-1 ml-5">
                        Tracking ID / URL: <span className="font-bold font-mono text-gray-800 bg-white px-1.5 py-0.5 rounded border border-gray-200 inline-block mt-0.5">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Order Footer */}
                <div className="px-3 md:px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">
                      Order #{order.id.slice(-8)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800 mb-0.5">
                      {order.paymentMethod?.toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online Payment'} 
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${order.paymentStatus?.includes('Received') || order.paymentStatus?.includes('Paid') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {order.paymentStatus?.includes('Received') || order.paymentStatus?.includes('Paid') ? 'PAID' : 'PENDING'}
                      </span>
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-1">
                      <span className="font-bold text-sm text-gray-900">{formatPrice(order.totalAmount)}</span>
                      <Link 
                        to="/track-order" 
                        state={{ orderId: order.id }}
                        className="text-amazon-link text-xs font-bold flex items-center gap-0.5 hover:underline"
                      >
                        TRACK <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
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
