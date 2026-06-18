import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { PackageOpen, ArrowLeft, Loader2, Search, ArrowRight } from "lucide-react";
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
              <Link to="/track-order" className="text-sage-600 font-semibold hover:text-sage-800 text-sm">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-earth-900 mb-2">My Orders</h1>
            <p className="text-earth-500">View the history of orders placed from this device.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-sage-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-earth-100 animate-fade-in-up">
            <PackageOpen className="w-16 h-16 text-earth-300 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-earth-800 mb-2">No Orders Found</h2>
            <p className="text-earth-500 mb-6">You haven't placed any orders on this device yet.</p>
            <div className="flex justify-center gap-4">
              <Link to="/" className="btn-primary">Start Shopping</Link>
              <Link to="/track-order" className="btn-secondary">Track Existing Order</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden animate-fade-in-up">
                {/* Order Header */}
                <div className="p-4 sm:p-6 border-b border-earth-100 bg-earth-50/50 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-xs text-earth-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
                    <p className="font-mono text-earth-900">{order.id}</p>
                    <p className="text-xs text-earth-400 mt-1">
                      Placed on: {order.createdAt?.toDate().toLocaleString() || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    <Link to="/track-order" state={{ orderId: order.id }} className="p-2 text-earth-500 hover:text-sage-600 bg-white border border-earth-200 rounded-full hover:bg-sage-50 transition-colors" title="Track Order">
                       <Search className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items List */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-2">Items Ordered</h3>
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-16 h-20 rounded-lg bg-earth-100 overflow-hidden flex-shrink-0 border border-earth-200">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-earth-800 line-clamp-2">{item.name}</p>
                            <p className="text-xs text-earth-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs font-medium text-earth-600">Qty: {item.quantity}</span>
                              <span className="font-bold text-sm text-earth-900">{formatPrice(item.price)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-earth-50 rounded-2xl p-4 border border-earth-100 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-2">Summary</h3>
                      <p className="text-xs text-earth-600 mb-1">Items: {order.items?.length}</p>
                      <p className="text-xs text-earth-600 mb-1">Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</p>
                      {order.transactionId && (
                         <p className="text-xs text-earth-600 mb-1">Txn ID: {order.transactionId}</p>
                      )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-earth-200 flex justify-between items-end">
                      <span className="font-heading font-bold text-earth-800">Total</span>
                      <span className="text-xl font-bold text-sage-600">{formatPrice(order.totalAmount)}</span>
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
