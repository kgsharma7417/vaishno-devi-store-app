import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { 
  PackageOpen, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Copy, 
  Navigation, 
  CreditCard, 
  ShieldCheck,
  Printer,
  Share2,
  Download
} from "lucide-react";

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

  const downloadCSV = () => {
    let csvContent = "\uFEFF"; 
    csvContent += "Order ID,Date,Customer Name,Phone,Email,Address,City,State,Pincode,Payment Method,Payment Status,Order Status,Grand Total,Items Ordered\n";
    
    filteredOrders.forEach((o) => {
      const itemsStr = o.items?.map(item => `${item.name} (${item.size || 'No Size'} x ${item.quantity})`).join(" | ") || "";
      const dateStr = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('en-IN') : "Unknown";
      
      const row = [
        o.id,
        dateStr,
        `"${o.customerDetails?.fullName || ''}"`,
        `"${o.customerDetails?.phone || ''}"`,
        `"${o.customerDetails?.email || ''}"`,
        `"${(o.customerDetails?.address || '').replace(/"/g, '""')}"`,
        `"${o.customerDetails?.city || ''}"`,
        `"${o.customerDetails?.state || ''}"`,
        `"${o.customerDetails?.pincode || ''}"`,
        o.paymentMethod || '',
        o.paymentStatus || '',
        o.orderStatus || '',
        o.totalAmount || 0,
        `"${itemsStr.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vaishno_devi_orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: "success", message: "Report downloaded successfully." });
  };

  const shareOnWhatsApp = (order) => {
    const itemsText = order.items?.map(item => `• *${item.name}* (Size: ${item.size || 'N/A'}, Qty: ${item.quantity}) - ₹${item.price}`).join("\n") || "";
    const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : "Unknown";
    
    const message = `*वैष्णो देवी स्टोर - ऑर्डर बिल* 🙏\n\n` +
      `*ऑर्डर नंबर:* #${order.id.slice(-8)}\n` +
      `*तारीख:* ${dateStr}\n\n` +
      `*ग्राहक विवरण:*\n` +
      `• नाम: ${order.customerDetails?.fullName}\n` +
      `• फ़ोन: ${order.customerDetails?.phone}\n` +
      `• पता: ${order.customerDetails?.address}, ${order.customerDetails?.city} - ${order.customerDetails?.pincode}\n\n` +
      `*सामान की सूची:*\n${itemsText}\n\n` +
      `*पेमेंट मेथड:* ${order.paymentMethod?.toUpperCase()}\n` +
      `*पेमेंट स्टेटस:* ${order.paymentStatus}\n` +
      `*ऑर्डर स्टेटस:* ${order.orderStatus}\n\n` +
      `*कुल राशि:* *₹${order.totalAmount}*\n\n` +
      `ऑर्डर देने के लिए धन्यवाद! 😊`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${order.customerDetails?.phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const printInvoice = (order) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    const itemsRows = order.items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <strong>${item.name}</strong><br/>
          <small style="color: #666;">Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${item.price * item.quantity}</td>
      </tr>
    `).join("") || "";

    const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : "Unknown";

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id.slice(-8)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: bold; color: #1e3a8a; }
            .invoice-title { font-size: 32px; font-weight: bold; text-align: right; color: #1e3a8a; }
            .divider { border-top: 3px solid #1e3a8a; margin: 20px 0; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .info-table td { width: 50%; vertical-align: top; font-size: 14px; line-height: 1.6; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #f3f4f6; padding: 12px 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #ddd; text-align: left; }
            .total-table { float: right; width: 300px; border-collapse: collapse; margin-top: 10px; }
            .total-table td { padding: 8px 10px; font-size: 14px; }
            .footer { text-align: center; margin-top: 80px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="logo">MAA VAISHNO DEVI BANGLE STORE</div>
                <div style="font-size: 13px; color: #555; margin-top: 4px;">
                  Fancy Jewellery, Gifts, Bangle sets & more<br/>
                  Phone: +91 74176 XXXXX
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="invoice-title">INVOICE</div>
                <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">Order ID: #${order.id}</div>
                <div style="font-size: 13px; color: #555; margin-top: 3px;">Date: ${dateStr}</div>
              </td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="info-table">
            <tr>
              <td>
                <h4 style="margin: 0 0 8px 0; color: #1e3a8a;">BILLED TO:</h4>
                <strong>${order.customerDetails?.fullName}</strong><br/>
                Phone: ${order.customerDetails?.phone}<br/>
                Address: ${order.customerDetails?.address}<br/>
                City: ${order.customerDetails?.city}, ${order.customerDetails?.state} - ${order.customerDetails?.pincode}
              </td>
              <td style="text-align: right;">
                <h4 style="margin: 0 0 8px 0; color: #1e3a8a;">PAYMENT DETAILS:</h4>
                Method: <strong>${order.paymentMethod?.toUpperCase()}</strong><br/>
                Status: <strong>${order.paymentStatus}</strong><br/>
                ${order.transactionId ? `Txn ID: <code style="background: #f3f4f6; padding: 2px 5px; border-radius: 4px;">${order.transactionId}</code>` : ''}
              </td>
            </tr>
          </table>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item Description</th>
                <th style="width: 100px; text-align: center;">Price</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          
          <table class="total-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${order.totalAmount}</td>
            </tr>
            <tr style="border-top: 1.5px solid #1e3a8a; font-weight: bold; font-size: 16px; color: #1e3a8a;">
              <td style="padding-top: 10px;">Grand Total:</td>
              <td style="text-align: right; padding-top: 10px;">₹${order.totalAmount}</td>
            </tr>
          </table>
          
          <div style="clear: both;"></div>
          
          <div class="footer">
            Thank you for shopping with us! If you have any questions, please contact our support.<br/>
            <strong>Maa Vaishno Devi Bangle Store</strong>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800 flex items-center gap-2">
            Orders <span className="text-sm font-normal text-slate-400 font-body">(ऑर्डर)</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage and track all customer orders (ग्राहकों के ऑर्डर्स प्रबंधित करें)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={downloadCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV (रिपोर्ट डाउनलोड करें)</span>
          </button>
          <div className="hidden sm:block text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
            Total Orders: {orders.length}
          </div>
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
          <div className="card p-12 text-center text-slate-500 rounded-2xl shadow-sm">
             No orders found for this filter.
          </div>
        ) : filteredOrders.map((order) => (
          <div key={order.id} className={`bg-white rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${order.paymentMethod === 'cod' && order.orderStatus === 'Pending' ? 'border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.12)]' : 'border-slate-100'}`}>
            
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${order.paymentMethod === 'cod' && order.orderStatus === 'Pending' ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/80 border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Order ID</p>
                  {order.paymentMethod === 'cod' && order.orderStatus === 'Pending' && (
                    <span className="text-[9px] sm:text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                      Action Required: Collect Cash
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Full ID on desktop, Truncated on mobile */}
                  <p className="hidden sm:block font-mono font-bold text-slate-800 text-base sm:text-lg break-all">
                    {order.id}
                  </p>
                  <p className="block sm:hidden font-mono font-bold text-slate-800 text-sm break-all bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    #{order.id.slice(0, 8)}...{order.id.slice(-6)}
                  </p>
                  <button onClick={() => {navigator.clipboard.writeText(order.id); addToast({type:'success', message:'Order ID copied'})}} className="p-1 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-violet-600 hover:border-violet-200 transition-colors flex-shrink-0" title="Copy ID">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {order.createdAt?.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) || 'Unknown'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-200/60 md:border-t-0">
                <div className="relative w-full">
                  <select 
                    disabled={updatingId === order.id}
                    value={order.paymentStatus}
                    onChange={(e) => handleStatusChange(order.id, "paymentStatus", e.target.value)}
                    className={`w-full text-[10px] sm:text-xs font-bold border rounded-lg px-2.5 py-2 cursor-pointer outline-none shadow-sm appearance-none pr-6 transition-all hover:brightness-95 truncate ${getPaymentColor(order.paymentStatus)}`}
                  >
                    <option value="Pending (COD)">Pending (COD)</option>
                    <option value="Pending (UPI)">Pending (UPI)</option>
                    <option value="Paid (Razorpay)">Paid (Razorpay) ✅</option>
                    <option value="Received">Received ✅</option>
                    <option value="Failed">Failed ❌</option>
                  </select>
                </div>

                <div className="relative w-full">
                  <select 
                    disabled={updatingId === order.id}
                    value={order.orderStatus}
                    onChange={(e) => handleStatusChange(order.id, "orderStatus", e.target.value)}
                    className={`w-full text-[10px] sm:text-xs font-bold border rounded-lg px-2.5 py-2 cursor-pointer outline-none shadow-sm appearance-none pr-6 transition-all hover:brightness-95 truncate ${getStatusColor(order.orderStatus)}`}
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
                
                {updatingId === order.id && (
                  <div className="col-span-2 flex justify-center py-1 sm:hidden">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Left Col: Customer Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Customer Details
                  </h3>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 shadow-sm space-y-3">
                    <p className="text-sm sm:text-base font-bold text-slate-800">{order.customerDetails?.fullName}</p>
                    
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-650">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <a href={`tel:${order.customerDetails?.phone}`} className="hover:text-blue-600 hover:underline font-semibold text-slate-700">
                        {order.customerDetails?.phone}
                      </a>
                    </div>

                    {order.customerDetails?.email && (
                      <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-650">
                        <div className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0 text-violet-600">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-slate-705 font-medium truncate">{order.customerDetails?.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Shipping Address
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                    <p className="text-xs sm:text-sm text-slate-750 leading-relaxed font-medium">
                      {order.customerDetails?.address}<br/>
                      {order.customerDetails?.city}, {order.customerDetails?.state}<br/>
                      <span className="font-bold text-slate-900 tracking-wider mt-1 block">PIN: {order.customerDetails?.pincode}</span>
                    </p>
                    {order.customerDetails?.location && (
                      <a 
                        href={`https://www.google.com/maps?q=${order.customerDetails.location.lat},${order.customerDetails.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors w-fit"
                      >
                        <Navigation className="w-3 h-3" /> View Location on Map
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Items Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <PackageOpen className="w-3.5 h-3.5 text-slate-400" /> Items Ordered
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center p-3 hover:bg-slate-50/50 transition-colors">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {item.size && <span className="mr-2">Size: <strong className="text-slate-700">{item.size}</strong></span>}
                              {item.color && <span>Color: <strong className="text-slate-700">{item.color}</strong></span>}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs sm:text-sm font-black text-slate-900">{formatPrice(item.price)}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      {/* Left: Payment Method Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 font-medium mb-1">
                          {order.paymentMethod === 'cod' ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600"/> : <CreditCard className="w-3.5 h-3.5 text-blue-600"/>}
                          Method: <span className="uppercase font-bold text-slate-700">{order.paymentMethod}</span>
                        </div>
                        {order.transactionId && (
                          <p className="text-[10px] text-slate-500 font-medium flex flex-wrap items-center gap-1.5">
                            Txn ID: <span className="font-mono text-violet-750 font-bold bg-violet-50/50 px-1.5 py-0.5 rounded border border-violet-100 break-all">{order.transactionId}</span>
                          </p>
                        )}
                      </div>

                      {/* Right: Buttons and Grand Total */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => shareOnWhatsApp(order)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp Bill</span>
                          </button>
                          <button
                            onClick={() => printInvoice(order)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                            title="Print Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>
                        </div>

                        <div className="text-right border-t sm:border-none border-slate-200/60 pt-2.5 sm:pt-0 pl-0 sm:pl-4">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Grand Total</p>
                          <p className="text-lg sm:text-xl font-black text-violet-600">{formatPrice(order.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courier / Shipping Details updates */}
                <div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" /> Courier Info
                  </h3>
                  <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3.5 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Courier Partner</label>
                        <input 
                          type="text"
                          placeholder="e.g. Delhivery, BlueDart"
                          defaultValue={order.courierName || ""}
                          id={`courier-${order.id}`}
                          className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 outline-none transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tracking ID / URL</label>
                        <input 
                          type="text"
                          placeholder="e.g. UTR123456 or track URL"
                          defaultValue={order.trackingNumber || ""}
                          id={`tracking-${order.id}`}
                          className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 outline-none transition-all bg-white"
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
                      className="w-full text-[10px] sm:text-xs font-bold uppercase tracking-wider py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-sm"
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
