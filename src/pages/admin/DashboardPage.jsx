import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { LOW_STOCK_THRESHOLD } from "../../utils/constants";
import { formatPrice, getLowStockSizes, getOutOfStockSizes } from "../../utils/helpers";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Boxes,
  ArrowRight,
  HelpCircle,
  Clock,
  CheckCircle2,
  Phone,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../../components/shared/Loader";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch products
        const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalValue = 0;

        products.forEach((product) => {
          const lowSizes = getLowStockSizes(product.sizesAndStock || {}, LOW_STOCK_THRESHOLD);
          const outSizes = getOutOfStockSizes(product.sizesAndStock || {});
          if (lowSizes.length > 0) lowStockCount++;
          if (outSizes.length > 0) outOfStockCount++;
          
          const stockSum = Object.values(product.sizesAndStock || {}).reduce((a, b) => a + b, 0);
          totalValue += (product.finalPrice || 0) * (stockSum || 1);
        });

        // Fetch orders
        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let pendingOrders = 0;
        let deliveredOrders = 0;
        let totalRevenue = 0;

        orders.forEach((order) => {
          if (order.orderStatus === "Pending") pendingOrders++;
          if (order.orderStatus === "Delivered") deliveredOrders++;
          if (order.orderStatus === "Delivered") {
            totalRevenue += order.totalAmount || 0;
          }
        });

        // Generate sales trend for past 7 days
        const dailyTrend = Array.from({ length: 7 }, (_, idx) => {
          const d = new Date();
          d.setDate(d.getDate() - idx);
          return {
            dateStr: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            rawDate: d,
            sales: 0
          };
        }).reverse();

        orders.forEach((order) => {
          if (order.orderStatus === "Delivered" && order.createdAt?.toDate) {
            const orderDate = order.createdAt.toDate();
            dailyTrend.forEach((day) => {
              if (
                orderDate.getDate() === day.rawDate.getDate() &&
                orderDate.getMonth() === day.rawDate.getMonth() &&
                orderDate.getFullYear() === day.rawDate.getFullYear()
              ) {
                day.sales += order.totalAmount || 0;
              }
            });
          }
        });

        setStats({
          totalProducts: products.length,
          lowStockCount,
          outOfStockCount,
          totalValue,
          totalOrders: orders.length,
          pendingOrders,
          deliveredOrders,
          totalRevenue,
        });

        setChartData(dailyTrend);
        setRecentProducts(products.slice(0, 5));
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Packed": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Shipped": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Out for Delivery": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Cancelled": return "bg-rose-100 text-rose-800 border-rose-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPaymentStatusColor = (status) => {
    if (status?.includes("Received") || status?.includes("Paid")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (status?.includes("Pending")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (status?.includes("Failed")) return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  if (loading) {
    return <Loader text="डैशबोर्ड लोड हो रहा है... (Loading dashboard...)" />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800 flex items-center gap-2">
            Dashboard <span className="text-sm font-normal text-slate-400 font-body">(डैशबोर्ड)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of your jewellery store & sales performance (आपकी दुकान की बिक्री और स्टॉक का संक्षिप्त विवरण)
          </p>
        </div>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            showHelp
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{showHelp ? "गाइड बंद करें (Hide Help)" : "गाइड चालू करें (Show Help)"}</span>
        </button>
      </div>

      {/* SECTION 1: Sales & Business Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-slate-700 flex items-center gap-2">
          <span>Sales & Orders</span>
          <span className="text-xs font-normal text-slate-400 font-body">(बिक्री और ऑर्डर्स की जानकारी)</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="card p-5 rounded-2xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Total Sales</p>
                  <p className="text-[10px] text-slate-400 font-body">(कुल कमाई)</p>
                </div>
                <p className="text-2xl font-heading font-bold text-emerald-600 truncate mt-0.5">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                💡 <strong>कुल कमाई:</strong> ग्राहकों के केवल उन ऑर्डर्स का कुल योग जो सफलतापूर्वक <strong>Delivered (वितरित)</strong> हो चुके हैं।
              </div>
            )}
          </div>

          {/* Total Orders */}
          <div className="card p-5 rounded-2xl border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Total Orders</p>
                  <p className="text-[10px] text-slate-400 font-body">(कुल ऑर्डर)</p>
                </div>
                <p className="text-2xl font-heading font-bold text-blue-600 truncate mt-0.5">
                  {stats.totalOrders}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                💡 <strong>कुल ऑर्डर:</strong> आपकी दुकान पर अब तक ग्राहकों द्वारा प्लेस किए गए सभी ऑर्डर्स की कुल संख्या।
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div className={`card p-5 rounded-2xl border-l-4 border-l-amber-500 ${stats.pendingOrders > 0 ? "shadow-[0_0_15px_rgba(245,158,11,0.08)]" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 ${stats.pendingOrders > 0 ? "animate-pulse" : ""}`}>
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Pending Orders</p>
                  <p className="text-[10px] text-slate-400 font-body">(बाकी ऑर्डर)</p>
                </div>
                <p className={`text-2xl font-heading font-bold truncate mt-0.5 ${stats.pendingOrders > 0 ? "text-amber-600" : "text-slate-600"}`}>
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-amber-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                💡 <strong>बाकी ऑर्डर:</strong> वे नए ऑर्डर्स जो अभी पेंडिंग हैं। इन्हें पैक करके शिप करना बाकी है।
              </div>
            )}
          </div>

          {/* Delivered Orders */}
          <div className="card p-5 rounded-2xl border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Delivered</p>
                  <p className="text-[10px] text-slate-400 font-body">(पहुँच गए)</p>
                </div>
                <p className="text-2xl font-heading font-bold text-indigo-600 truncate mt-0.5">
                  {stats.deliveredOrders}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-indigo-700 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                💡 <strong>डिलीवर हुए:</strong> वे सभी ऑर्डर्स जो ग्राहकों तक सुरक्षित रूप से पहुँच चुके हैं।
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: Earning Chart & Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2/3 width) */}
        <div className="lg:col-span-2 card p-6 rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-heading font-semibold text-slate-800">
                Weekly Revenue Trend <span className="text-sm font-normal text-slate-400 font-body">(साप्ताहिक कमाई का ग्राफ)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Sales from delivered orders over the past 7 days</p>
            </div>
            <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
              Live Tracker
            </div>
          </div>

          <div className="w-full flex justify-center py-2">
            <svg viewBox="0 0 500 200" className="w-full h-auto overflow-visible">
              {/* Reference Grid lines */}
              <line
                x1="30"
                y1="170"
                x2="470"
                y2="170"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />
              <line
                x1="30"
                y1="100"
                x2="470"
                y2="100"
                stroke="#f1f5f9"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <line
                x1="30"
                y1="30"
                x2="470"
                y2="30"
                stroke="#f1f5f9"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Bars */}
              {chartData.map((d, i) => {
                const maxSales = Math.max(...chartData.map(day => day.sales), 100);
                const padding = 30;
                const chartHeight = 140; 
                const chartWidth = 440; 
                const barWidth = chartWidth / 7 - 12;
                const x = padding + i * (chartWidth / 7) + 6;
                const barHeight = (d.sales / maxSales) * chartHeight;
                const y = 170 - barHeight;

                return (
                  <g key={i} className="group">
                    {/* Background Bar Hover Effect */}
                    <rect
                      x={x - 2}
                      y="20"
                      width={barWidth + 4}
                      height="150"
                      className="fill-transparent group-hover:fill-slate-50/70 transition-colors duration-200 cursor-pointer"
                      rx="6"
                    />
                    
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 4)} 
                      rx="4"
                      className="fill-blue-500 group-hover:fill-blue-600 transition-colors duration-150 cursor-pointer shadow-sm"
                    />

                    {/* Value above bar */}
                    {d.sales > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        textAnchor="middle"
                        className="text-[9px] sm:text-[10px] font-bold fill-blue-700 font-mono transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                      >
                        ₹{d.sales}
                      </text>
                    )}

                    {/* Date label */}
                    <text
                      x={x + barWidth / 2}
                      y="190"
                      textAnchor="middle"
                      className="text-[9px] sm:text-[10px] font-bold fill-slate-400 font-sans"
                    >
                      {d.dateStr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {showHelp && (
            <div className="mt-3 text-xs leading-relaxed text-blue-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              💡 <strong>Weekly Sales Chart:</strong> यह ग्राफ पिछले 7 दिनों की कुल दैनिक डिलीवर्ड कमाई दर्शाता है। किसी भी बार (Bar) पर माउस ले जाने से उस दिन की सटीक कमाई दिखेगी।
            </div>
          )}
        </div>

        {/* Today's Tasks (1/3 width) */}
        <div className="card p-6 rounded-2xl bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-800">
                  Today's Tasks <span className="text-sm font-normal text-slate-400 font-body">(आज के मुख्य कार्य)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Urgent operations needed for your store</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {stats.pendingOrders > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 animate-pulse">
                    !
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-905">Pack Pending Orders</p>
                    <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                      You have <strong>{stats.pendingOrders} order(s)</strong> waiting for packaging.
                    </p>
                    <Link to="/admin/orders" className="text-[10px] font-bold text-amber-800 underline block mt-1.5">
                      ऑर्डर पैक करें &rarr;
                    </Link>
                  </div>
                </div>
              ) : null}

              {stats.outOfStockCount > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    X
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-905">Restock Out-of-Stock Items</p>
                    <p className="text-[10px] text-rose-700 font-medium mt-0.5">
                      There are <strong>{stats.outOfStockCount} product(s)</strong> completely out of stock.
                    </p>
                    <Link to="/admin/inventory" className="text-[10px] font-bold text-rose-800 underline block mt-1.5">
                      स्टॉक बढ़ाएं &rarr;
                    </Link>
                  </div>
                </div>
              ) : null}

              {stats.lowStockCount > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    ▲
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-950">Low Stock Alert</p>
                    <p className="text-[10px] text-orange-700 font-medium mt-0.5">
                      <strong>{stats.lowStockCount} item(s)</strong> are running low (2 or less remaining).
                    </p>
                    <Link to="/admin/inventory" className="text-[10px] font-bold text-orange-800 underline block mt-1.5">
                      इन्वेंट्री चेक करें &rarr;
                    </Link>
                  </div>
                </div>
              ) : null}

              {stats.pendingOrders === 0 && stats.outOfStockCount === 0 && stats.lowStockCount === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-slate-800">All Tasks Completed!</p>
                  <p className="text-[10px] text-slate-400 mt-1">सभी काम पूरे हैं! कोई अर्जेंट एक्शन आवश्यक नहीं है।</p>
                </div>
              ) : null}
            </div>
          </div>
          
          {showHelp && (
            <div className="mt-4 text-xs leading-relaxed text-slate-650 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              💡 <strong>Task List:</strong> यह सेक्शन दुकान के पेंडिंग कामों को अपने आप खोजकर अलर्ट करता है ताकि ग्राहक का कोई भी काम न छूटे।
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Stock & Inventory Status */}
      <div className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-slate-700 flex items-center gap-2">
          <span>Inventory Status</span>
          <span className="text-xs font-normal text-slate-400 font-body">(सामान और स्टॉक की स्थिति)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Products */}
          <div className="card p-5 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Total Products</p>
                  <p className="text-[10px] text-slate-400 font-body">(कुल उत्पाद)</p>
                </div>
                <p className="text-2xl font-heading font-bold text-slate-800 truncate mt-0.5">
                  {stats.totalProducts}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200">
                💡 <strong>कुल उत्पाद:</strong> आपके स्टोर में डाले गए सभी प्रोडक्ट्स की कुल संख्या (चाहे वे स्टॉक में हों या नहीं)।
              </div>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="card p-5 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Low Stock</p>
                  <p className="text-[10px] text-slate-400 font-body">(कम स्टॉक वाले)</p>
                </div>
                <p className={`text-2xl font-heading font-bold truncate mt-0.5 ${stats.lowStockCount > 0 ? "text-orange-500" : "text-slate-700"}`}>
                  {stats.lowStockCount}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-orange-700 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                💡 <strong>कम स्टॉक:</strong> वे प्रोडक्ट्स जिनकी कोई साइज/कलर का स्टॉक {LOW_STOCK_THRESHOLD} या उससे कम बचा है। इन्हें जल्द रिस्टॉक करें।
              </div>
            )}
          </div>

          {/* Out of Stock Items */}
          <div className="card p-5 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <Boxes className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Out of Stock</p>
                  <p className="text-[10px] text-slate-400 font-body">(बिना स्टॉक के)</p>
                </div>
                <p className={`text-2xl font-heading font-bold truncate mt-0.5 ${stats.outOfStockCount > 0 ? "text-rose-500" : "text-slate-700"}`}>
                  {stats.outOfStockCount}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                💡 <strong>स्टॉक खत्म:</strong> वे प्रोडक्ट्स जिनका स्टॉक 0 हो चुका है और ग्राहक उन्हें स्टोर पर नहीं खरीद सकते।
              </div>
            )}
          </div>

          {/* Catalogue Value */}
          <div className="card p-5 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-400">Inventory Value</p>
                  <p className="text-[10px] text-slate-400 font-body">(कुल माल की कीमत)</p>
                </div>
                <p className="text-2xl font-heading font-bold text-purple-600 truncate mt-0.5">
                  {formatPrice(stats.totalValue)}
                </p>
              </div>
            </div>
            {showHelp && (
              <div className="mt-3 text-xs leading-relaxed text-purple-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                💡 <strong>माल की कुल कीमत:</strong> आपके स्टोर में रखे गए सभी प्रोडक्ट्स के कुल स्टॉक की सेलिंग प्राइस वैल्यू।
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Orders), Right (Quick Actions + Products) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-800">
                  Recent Orders <span className="text-sm font-normal text-slate-400 font-body">(हाल ही के ऑर्डर्स)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">List of last 5 orders placed by customers</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1 transition-all"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No orders received yet (कोई ऑर्डर नहीं आया है)</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Customer & ID Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                          #{order.id.slice(-8)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : "Unknown"}
                        </span>
                      </div>
                      
                      <div className="mt-1.5 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 truncate">
                          {order.customerDetails?.fullName || "Guest Customer"}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:${order.customerDetails?.phone}`} className="text-xs text-blue-600 hover:underline">
                          {order.customerDetails?.phone}
                        </a>
                      </div>
                    </div>

                    {/* Status & Amount */}
                    <div className="flex items-center md:justify-end gap-3 flex-wrap md:flex-nowrap">
                      {/* Amount */}
                      <div className="text-left md:text-right">
                        <p className="text-sm font-black text-slate-800">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-row md:flex-col gap-1.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border text-center whitespace-nowrap ${getOrderStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border text-center whitespace-nowrap ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus?.replace(" (Razorpay)", "")?.replace(" (COD)", "")}
                        </span>
                      </div>

                      {/* Action */}
                      <Link
                        to="/admin/orders"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors ml-auto md:ml-0"
                        title="Manage Order"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Recent Products */}
        <div className="space-y-6">
          
          {/* Quick Actions Card */}
          <div className="card p-6 rounded-2xl bg-gradient-to-br from-slate-55 to-white">
            <h2 className="text-lg font-heading font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">
              Quick Actions <span className="text-sm font-normal text-slate-400 font-body">(त्वरित विकल्प)</span>
            </h2>
            <div className="space-y-3">
              <Link
                to="/admin/upload"
                className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100/70 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-800">Add New Product</p>
                  <p className="text-[10px] text-blue-500 font-body">नया सामान जोड़ें</p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 ml-auto" />
              </Link>

              <Link
                to="/admin/orders"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-amber-800">Manage Orders</p>
                  <p className="text-[10px] text-amber-500 font-body">ऑर्डर्स देखें और बदलें</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 ml-auto" />
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Manage Inventory</p>
                  <p className="text-[10px] text-slate-500 font-body">स्टॉक और कीमत संभालें</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Recent Products Card */}
          <div className="card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-base font-heading font-semibold text-slate-800">
                Recent Products <span className="text-xs font-normal text-slate-400 font-body">(हाल ही के प्रोडक्ट्स)</span>
              </h2>
              <Link
                to="/admin/inventory"
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5 font-semibold"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No products added yet (कोई प्रोडक्ट नहीं है)
              </div>
            ) : (
              <div className="space-y-3">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {product.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{product.category}</p>
                    </div>

                    <p className="text-xs font-black text-slate-800 flex-shrink-0">
                      {formatPrice(product.finalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
