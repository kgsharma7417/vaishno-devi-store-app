import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { PackageOpen, Clock, CheckCircle2, Truck, AlertCircle, Loader2, MapPin } from "lucide-react";

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
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center animate-fade-in">
        <PackageOpen className="w-16 h-16 text-earth-300 mb-4" />
        <h2 className="text-xl font-heading font-semibold text-earth-800 mb-2">No Orders Yet</h2>
        <p className="text-earth-500 max-w-md">When customers place orders, they will appear here. Start marketing your store to get your first order!</p>
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
      default: return 'bg-earth-100 text-earth-800 border-earth-200';
    }
  };

  const getPaymentColor = (status) => {
    if (status?.includes('Received')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status?.includes('Pending')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-earth-100 text-earth-800 border-earth-200';
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
          <div key={order.id} className="card overflow-hidden">
            
            {/* Header */}
            <div className="bg-earth-50 p-4 sm:p-6 border-b border-earth-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs text-earth-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
                <p className="font-mono text-earth-900">{order.id}</p>
                <p className="text-xs text-earth-400 mt-1">
                  Placed on: {order.createdAt?.toDate().toLocaleString() || 'Unknown'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  disabled={updatingId === order.id}
                  value={order.paymentStatus}
                  onChange={(e) => handleStatusChange(order.id, "paymentStatus", e.target.value)}
                  className={`text-xs font-bold border rounded-full px-3 py-1.5 cursor-pointer outline-none ${getPaymentColor(order.paymentStatus)}`}
                >
                  <option value="Pending (COD)">Payment: Pending (COD)</option>
                  <option value="Pending (UPI)">Payment: Pending (UPI)</option>
                  <option value="Paid (Razorpay)">Payment: Paid (Razorpay) ✅</option>
                  <option value="Received">Payment: Received ✅</option>
                  <option value="Failed">Payment: Failed ❌</option>
                </select>

                <select 
                  disabled={updatingId === order.id}
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(order.id, "orderStatus", e.target.value)}
                  className={`text-xs font-bold border rounded-full px-3 py-1.5 cursor-pointer outline-none ${getStatusColor(order.orderStatus)}`}
                >
                  <option value="Pending">Status: Pending</option>
                  <option value="Processing">Status: Processing</option>
                  <option value="Packed">Status: Packed</option>
                  <option value="Shipped">Status: Shipped</option>
                  <option value="Out for Delivery">Status: Out for Delivery</option>
                  <option value="Delivered">Status: Delivered</option>
                  <option value="Cancelled">Status: Cancelled</option>
                </select>
                
                {updatingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-sage-500" />}
              </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Details */}
              <div>
                <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4">Customer Details</h3>
                <div className="space-y-2 text-sm text-earth-700">
                  <p><span className="text-earth-400 w-20 inline-block">Name:</span> <span className="font-medium">{order.customerDetails?.fullName}</span></p>
                  <p><span className="text-earth-400 w-20 inline-block">Phone:</span> <a href={`tel:${order.customerDetails?.phone}`} className="text-sage-600 hover:underline">{order.customerDetails?.phone}</a></p>
                  {order.customerDetails?.email && (
                    <p><span className="text-earth-400 w-20 inline-block">Email:</span> {order.customerDetails?.email}</p>
                  )}
                  <div className="flex items-start mt-2">
                    <span className="text-earth-400 w-20 inline-block flex-shrink-0">Address:</span>
                    <div className="bg-earth-50 p-3 rounded-xl flex-1 border border-earth-100">
                      <p>
                        {order.customerDetails?.address}<br/>
                        {order.customerDetails?.city}, {order.customerDetails?.state} - {order.customerDetails?.pincode}
                      </p>
                      {order.customerDetails?.location && (
                        <a 
                          href={`https://www.google.com/maps?q=${order.customerDetails.location.lat},${order.customerDetails.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-sm text-sage-600 hover:text-sage-800 font-medium bg-white px-3 py-1.5 rounded-lg border border-sage-200"
                        >
                          <MapPin className="w-4 h-4" /> View on Map
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="text-sm font-bold text-earth-900 uppercase tracking-wider mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center border border-earth-100 p-2 rounded-xl bg-white">
                      <div className="w-12 h-12 rounded-lg bg-earth-50 overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-earth-900 truncate">{item.name}</p>
                        <p className="text-xs text-earth-500">Size: {item.size} | Color: {item.color}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-earth-900">{formatPrice(item.price)}</p>
                        <p className="text-xs text-earth-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-earth-100 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-earth-500 font-medium">Method: <span className="uppercase text-earth-800">{order.paymentMethod}</span></p>
                    {order.transactionId && (
                      <p className="text-xs text-earth-500 font-medium mt-1">
                        Txn ID / UTR: <span className="font-mono text-sage-700 font-bold bg-sage-50 px-1.5 py-0.5 rounded border border-sage-200">{order.transactionId}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-earth-500 uppercase tracking-widest mb-1">Grand Total</p>
                    <p className="text-xl font-heading font-black text-sage-600">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>

                {/* Courier / Shipping Details updates */}
                <div className="mt-4 pt-4 border-t border-dashed border-earth-100 space-y-3">
                  <p className="text-xs font-bold text-earth-800 uppercase tracking-wider">Courier & Shipping Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-earth-400 block mb-1">Courier Partner</label>
                      <input 
                        type="text"
                        placeholder="e.g., Delhivery, BlueDart"
                        defaultValue={order.courierName || ""}
                        id={`courier-${order.id}`}
                        className="input-field text-xs py-2 px-3 border border-earth-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-earth-400 block mb-1">Tracking ID / URL</label>
                      <input 
                        type="text"
                        placeholder="e.g., UTR123456 or track URL"
                        defaultValue={order.trackingNumber || ""}
                        id={`tracking-${order.id}`}
                        className="input-field text-xs py-2 px-3 border border-earth-200"
                      />
                    </div>
                    <div>
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
                        className="btn-primary w-full text-xs py-2 h-[38px] rounded"
                      >
                        Update Shipping
                      </button>
                    </div>
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
