import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { PackageOpen, Clock, CheckCircle2, Truck, AlertCircle, Loader2, MapPin, User, Phone, Mail, Copy, Navigation, CreditCard, ShieldCheck } from "lucide-react";

export default function OrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      addToast({ type: "error", message: "Failed to fetch orders." });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, field, newValue) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        [field]: newValue
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, [field]: newValue } : order
      ));
      
      addToast({ type: "success", message: `Order updated successfully.` });
    } catch (error) {
      console.error("Error updating order:", error);
      addToast({ type: "error", message: "Failed to update order." });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center animate-fade-in shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <PackageOpen className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Orders Yet</h2>
        <p className="text-slate-500 max-w-md">When customers place orders, they will appear here. Keep marketing your store!</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Packed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Out for Delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPaymentColor = (status) => {
    if (status?.includes('Received') || status?.includes('Paid')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status?.includes('Pending')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (status?.includes('Failed')) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const filteredOrders = orders.filter(order => {
    if (filterType === 'all') return true;
    if (filterType === 'new') return order.orderStatus === 'Pending';
    if (filterType === 'undelivered') return ['Processing', 'Shipped'].includes(order.orderStatus);
    if (filterType === 'delivered') return order.orderStatus === 'Delivered';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800">
            Orders
          </h1>
          <p className="text-slate-400 mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {['all', 'new', 'undelivered', 'delivered'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filterType === type 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type === 'all' && 'All Orders'}
            {type === 'new' && 'New Orders'}
            {type === 'undelivered' && 'Undelivered'}
            {type === 'delivered' && 'Delivered'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">
             No orders found for this filter.
          </div>
        ) : filteredOrders.map((order) => (
          <div key={order.id} className={`bg-white rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${order.paymentMethod === 'cod' && order.orderStatus === 'Pending' ? 'border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'border-slate-100'}`}>
            
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b flex flex-wrap justify-between items-center gap-4 ${order.paymentMethod === 'cod' && order.orderStatus === 'Pending' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Order ID</p>
                  {order.paymentMethod === 'cod' && order.orderStatus === 'Pending' && (
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                      Action Required: Collect Cash
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-slate-800 text-lg">{order.id}</p>
                  <button onClick={() => {navigator.clipboard.writeText(order.id); addToast({type:'success', message:'Order ID copied'})}} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-violet-600 hover:border-violet-200 transition-colors" title="Copy ID">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {order.createdAt?.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) || 'Unknown'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <select 
                    disabled={updatingId === order.id}
                    value={order.paymentStatus}
                    onChange={(e) => handleStatusChange(order.id, "paymentStatus", e.target.value)}
                    className={`text-xs font-bold border rounded-xl px-3 py-2 cursor-pointer outline-none shadow-sm appearance-none pr-8 transition-all hover:brightness-95 ${getPaymentColor(order.paymentStatus)}`}
                  >
                    <option value="Pending (COD)">Payment: Pending (COD)</option>
                    <option value="Pending (UPI)">Payment: Pending (UPI)</option>
                    <option value="Paid (Razorpay)">Payment: Paid (Razorpay) ✅</option>
                    <option value="Received">Payment: Received ✅</option>
                    <option value="Failed">Payment: Failed ❌</option>
                  </select>
                </div>

                <div className="relative group">
                  <select 
                    disabled={updatingId === order.id}
                    value={order.orderStatus}
                    onChange={(e) => handleStatusChange(order.id, "orderStatus", e.target.value)}
                    className={`text-sm font-bold border rounded-xl px-4 py-2 cursor-pointer outline-none shadow-sm appearance-none pr-8 transition-all hover:brightness-95 ${getStatusColor(order.orderStatus)}`}
                  >
                    <option value="Pending">🕒 Pending</option>
                    <option value="Processing">⚙️ Processing</option>
                    <option value="Packed">📦 Packed</option>
                    <option value="Shipped">🚚 Shipped</option>
                    <option value="Out for Delivery">🛵 Out for Delivery</option>
                    <option value="Delivered">✅ Delivered</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </div>
                
                {updatingId === order.id && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
              </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Col: Customer Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Customer Details
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3">
                    <p className="text-base font-bold text-slate-800">{order.customerDetails?.fullName}</p>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Phone className="w-4 h-4" />
                      </div>
                      <a href={`tel:${order.customerDetails?.phone}`} className="hover:text-blue-600 hover:underline font-medium">
                        {order.customerDetails?.phone}
                      </a>
                    </div>

                    {order.customerDetails?.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0 text-violet-600">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span>{order.customerDetails?.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Shipping Address
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {order.customerDetails?.address}<br/>
                      {order.customerDetails?.city}, {order.customerDetails?.state}<br/>
                      <span className="font-bold text-slate-900 tracking-widest mt-1 block">PIN: {order.customerDetails?.pincode}</span>
                    </p>
                    {order.customerDetails?.location && (
                      <a 
                        href={`https://www.google.com/maps?q=${order.customerDetails.location.lat},${order.customerDetails.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors w-fit"
                      >
                        <Navigation className="w-3.5 h-3.5" /> View Exact Location on Map
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Items Summary */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PackageOpen className="w-4 h-4 text-slate-400" /> Items Ordered
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.size && <span className="mr-2">Size: <strong className="text-slate-700">{item.size}</strong></span>}
                              {item.color && <span>Color: <strong className="text-slate-700">{item.color}</strong></span>}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-slate-900">{formatPrice(item.price)}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                          {order.paymentMethod === 'cod' ? <ShieldCheck className="w-4 h-4 text-amber-600"/> : <CreditCard className="w-4 h-4 text-blue-600"/>}
                          Method: <span className="uppercase font-bold text-slate-700">{order.paymentMethod}</span>
                        </div>
                        {order.transactionId && (
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                            Txn ID: <span className="font-mono text-violet-700 font-bold bg-violet-100 px-2 py-0.5 rounded border border-violet-200">{order.transactionId}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Grand Total</p>
                        <p className="text-2xl font-black text-violet-600">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courier / Shipping Details updates */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-400" /> Courier Info
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Courier Partner</label>
                        <input 
                          type="text"
                          placeholder="e.g. Delhivery, BlueDart"
                          defaultValue={order.courierName || ""}
                          id={`courier-${order.id}`}
                          className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tracking ID / URL</label>
                        <input 
                          type="text"
                          placeholder="e.g. UTR123456 or track URL"
                          defaultValue={order.trackingNumber || ""}
                          id={`tracking-${order.id}`}
                          className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={async () => {
                        const courierVal = document.getElementById(`courier-${order.id}`).value.trim();
                        const trackingVal = document.getElementById(`tracking-${order.id}`).value.trim();
                        setUpdatingId(order.id);
                        try {
                          await updateDoc(doc(db, "orders", order.id), {
                            courierName: courierVal,
                            trackingNumber: trackingVal
                          });
                          setOrders(prev => prev.map(o => 
                            o.id === order.id ? { ...o, courierName: courierVal, trackingNumber: trackingVal } : o
                          ));
                          addToast({ type: "success", message: "Shipping details updated." });
                        } catch (err) {
                          console.error("Error updating shipping:", err);
                          addToast({ type: "error", message: "Failed to update shipping." });
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      className="w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-sm"
                    >
                      Save Shipping Details
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
