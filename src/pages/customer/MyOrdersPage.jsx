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
            <h1 className="text-slate-900 font-black text-lg flex-1 tracking-tight">My Orders</h1>
            <Link to="/track-order" className="text-violet-600 text-[11px] font-black uppercase tracking-widest hover:text-violet-800 hover:bg-violet-50 px-3 py-1.5 rounded-full transition-colors">
              Track Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-10 md:p-16 text-center shadow-xl rounded-3xl border border-slate-100 animate-fade-in">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <PackageOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No Orders Yet</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">You haven't placed any orders on this device.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/" className="bg-violet-600 hover:bg-violet-700 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5">Shop Now</Link>
              <Link to="/track-order" className="bg-white text-slate-600 hover:text-violet-700 hover:border-violet-300 font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-wider border-2 border-slate-200 transition-all">Track Order</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow-xl rounded-3xl border border-slate-100 overflow-hidden animate-fade-in transition-all hover:shadow-2xl">
                
                {/* Order Items */}
                {order.items?.map((item, idx) => (
                  <div key={idx} className={`p-4 md:p-6 flex gap-4 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                    {/* Clickable Image & Details */}
                    <Link to={`/product/${item.id}`} className="flex gap-4 flex-1 min-w-0 group transition-all">
                      {/* Image */}
                      <div className="w-20 h-24 bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 rounded-xl">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">{item.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1.5">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                        <p className="font-black text-sm text-slate-900 mt-2">{formatPrice(item.price)}</p>
                      </div>
                    </Link>

                    {/* Status */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0 py-1">
                      <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Courier / Shipping Details */}
                {(order.courierName || order.trackingNumber) && (
                  <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-violet-50/50">
                    <p className="text-xs text-violet-900 font-bold flex items-center gap-2">
                      <Truck className="w-4 h-4 text-violet-600" />
                      {order.courierName ? `Shipped via ${order.courierName}` : 'Shipped via Courier'}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-[11px] font-medium text-violet-700 mt-2 ml-6">
                        Tracking ID / URL: <span className="font-bold font-mono text-violet-900 bg-white px-2 py-1 rounded-md border border-violet-200 inline-block mt-1 shadow-sm">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Order Footer */}
                <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Order #{order.id.slice(-8)}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center sm:justify-end gap-2">
                      {order.paymentMethod?.toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online Payment'} 
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest ${order.paymentStatus?.includes('Received') || order.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                        {order.paymentStatus?.includes('Received') || order.paymentStatus?.includes('Paid') ? 'PAID' : 'PENDING'}
                      </span>
                    </p>
                    <div className="flex items-center sm:justify-end justify-between gap-4">
                      <span className="font-black text-lg text-slate-900">{formatPrice(order.totalAmount)}</span>
                      <Link 
                        to="/track-order" 
                        state={{ orderId: order.id }}
                        className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        TRACK <ChevronRight className="w-3.5 h-3.5" />
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
