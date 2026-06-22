import { useState, useRef, useEffect, useCallback } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../shared/Toast";
import {
  CATEGORIES,
  SUB_CATEGORIES,
  AVAILABLE_COLORS,
  COLOR_SWATCHES,
  OCCASION_TAGS,
  MATERIAL_TYPES,
  RENTAL_STATUS,
  MAX_IMAGES,
  LOW_STOCK_THRESHOLD,
} from "../../utils/constants";
import {
  formatPrice,
  generateUniqueFileName,
  validateImageFile,
  generateSKU,
} from "../../utils/helpers";
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Tag,
  IndianRupee,
  PackageCheck,
  Star,
  Loader2,
  Copy,
  Printer,
  RefreshCw,
  AlertTriangle,
  Clock,
  Key,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Barcode,
  CalendarDays,
  Layers,
} from "lucide-react";

// ─── Initial State ─────────────────────────────────────────────────────────────
const buildInitialForm = () => ({
  productName: "",
  description: "",
  category: "",
  subCategory: "",
  sku: "",
  isRental: false,
  // --- Sale fields ---
  mrp: "",
  sellingPrice: "",
  stockQuantity: "",
  // --- Rental fields ---
  rentPrice: "",
  securityDeposit: "",
  replacementValue: "",
  rentalStatus: "Available",
  expectedReturnDate: "",
  // --- Attributes ---
  colors: [],
  sizeAgeGroup: "",
  materialType: "",
  occasionTags: [],
  // --- Extras ---
  isFeatured: false,
  isCodAvailable: true,
  isReturnable: true,
  externalImageUrls: "",
  videoUrl: "",
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ id, checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
          checked ? "bg-violet-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, accentColor = "violet" }) {
  const colorMap = {
    violet: "text-violet-500 bg-violet-50",
    rose: "text-rose-500 bg-rose-50",
    amber: "text-amber-500 bg-amber-50",
    emerald: "text-emerald-500 bg-emerald-50",
    blue: "text-blue-500 bg-blue-50",
    slate: "text-slate-500 bg-slate-100",
  };
  const cls = colorMap[accentColor] || colorMap.violet;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProductForm({ editId }) {
  const [form, setForm] = useState(buildInitialForm);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!!editId);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  const { addToast } = useToast();

  // ─── Load product for edit ─────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    const fetchProduct = async () => {
      try {
        const docSnap = await getDoc(doc(db, "products", editId));
        if (!docSnap.exists()) {
          addToast({ type: "error", message: "Product not found." });
          return;
        }
        const data = docSnap.data();
        setForm({
          productName: data.productName || "",
          description: data.description || "",
          category: data.category || "",
          subCategory: data.subCategory || "",
          sku: data.sku || "",
          isRental: data.isRental || false,
          mrp: data.mrp?.toString() || "",
          sellingPrice: data.sellingPrice?.toString() || data.finalPrice?.toString() || "",
          stockQuantity: data.stockQuantity?.toString() || "",
          rentPrice: data.rentPrice?.toString() || "",
          securityDeposit: data.securityDeposit?.toString() || "",
          replacementValue: data.replacementValue?.toString() || "",
          rentalStatus: data.rentalStatus || "Available",
          expectedReturnDate: data.expectedReturnDate || "",
          colors: data.colors || [],
          sizeAgeGroup: data.sizeAgeGroup || "",
          materialType: data.materialType || "",
          occasionTags: data.occasionTags || [],
          isFeatured: data.isFeatured || false,
          isCodAvailable: data.isCodAvailable !== undefined ? data.isCodAvailable : true,
          isReturnable: data.isReturnable !== undefined ? data.isReturnable : true,
          externalImageUrls: "",
          videoUrl: data.videoUrl || "",
        });
        if (data.imageUrls) {
          setImages(
            data.imageUrls.map((url) => ({ file: null, preview: url, url, progress: 100 }))
          );
        }
      } catch (err) {
        console.error(err);
        addToast({ type: "error", message: "Failed to fetch product." });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchProduct();
  }, [editId, addToast]);

  // ─── Derived values ────────────────────────────────────────────────────────
  const mrpNum = Number(form.mrp) || 0;
  const sellingNum = Number(form.sellingPrice) || 0;
  const profit = mrpNum > 0 && sellingNum > 0 ? mrpNum - sellingNum : null;
  const profitPct = profit !== null && mrpNum > 0 ? Math.round((profit / mrpNum) * 100) : 0;

  const isOverdue =
    form.isRental &&
    form.expectedReturnDate &&
    form.rentalStatus === "Rented Out" &&
    new Date(form.expectedReturnDate) < new Date();

  const stockNum = Number(form.stockQuantity) || 0;
  const isLowStock = !form.isRental && form.stockQuantity !== "" && stockNum <= LOW_STOCK_THRESHOLD && stockNum > 0;
  const isOutOfStock = !form.isRental && form.stockQuantity !== "" && stockNum === 0;

  const subCategoryOptions = SUB_CATEGORIES[form.category] || [];

  // ─── Field helpers ─────────────────────────────────────────────────────────
  const set = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "category") {
        next.subCategory = "";
        next.sku = generateSKU(value);
      }
      return next;
    });
  }, []);

  const toggleColor = (color) =>
    setForm((p) => ({
      ...p,
      colors: p.colors.includes(color) ? p.colors.filter((c) => c !== color) : [...p.colors, color],
    }));

  const toggleOccasion = (tag) =>
    setForm((p) => ({
      ...p,
      occasionTags: p.occasionTags.includes(tag)
        ? p.occasionTags.filter((t) => t !== tag)
        : [...p.occasionTags, tag],
    }));

  const refreshSKU = () => setForm((p) => ({ ...p, sku: generateSKU(p.category) }));

  const copySKU = () => {
    if (!form.sku) return;
    navigator.clipboard.writeText(form.sku);
    addToast({ type: "success", message: "SKU copied to clipboard!" });
  };

  const printLabel = () => {
    const win = window.open("", "_blank", "width=400,height=300");
    win.document.write(`
      <html><head><title>Product Label</title>
      <style>
        body{font-family:monospace;text-align:center;padding:20px;margin:0;}
        .sku{font-size:28px;font-weight:900;letter-spacing:4px;border:3px solid #000;padding:8px 20px;display:inline-block;margin-bottom:8px;}
        .name{font-size:14px;max-width:260px;word-break:break-word;}
        .shop{font-size:11px;color:#666;margin-top:6px;}
        @media print{body{padding:5px;}}
      </style></head>
      <body onload="window.print();window.close();">
        <div class="sku">${form.sku || "NO-SKU"}</div><br/>
        <div class="name">${form.productName || "Product Name"}</div>
        <div class="shop">Maa Vaishno Devi Ladies Corner</div>
      </body></html>
    `);
    win.document.close();
  };

  // ─── Duplicate product ─────────────────────────────────────────────────────
  const duplicateProduct = () => {
    setForm((p) => ({
      ...p,
      productName: `Copy of ${p.productName}`,
      sku: generateSKU(p.category),
    }));
    setIsDuplicate(true);
    addToast({ type: "info", message: "Form duplicated! Update name & details then save." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Image handlers ────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > MAX_IMAGES) {
      addToast({ type: "warning", message: `Max ${MAX_IMAGES} images allowed.` });
      return;
    }
    const newImgs = [];
    for (const file of files) {
      const v = validateImageFile(file);
      if (!v.valid) { addToast({ type: "error", message: v.error }); continue; }
      newImgs.push({ file, preview: URL.createObjectURL(file), progress: 0, url: null });
    }
    setImages((p) => [...p, ...newImgs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => {
    setImages((p) => {
      if (p[idx]?.preview && !p[idx].url) URL.revokeObjectURL(p[idx].preview);
      return p.filter((_, i) => i !== idx);
    });
  };

  // ─── Upload to Cloudinary ──────────────────────────────────────────────────
  const uploadImages = async () => {
    return Promise.all(
      images.map((img, idx) => {
        if (img.url) return Promise.resolve(img.url);
        return new Promise(async (resolve, reject) => {
          try {
            const fd = new FormData();
            fd.append("file", img.file);
            fd.append("upload_preset", "maa vaishno devi");
            fd.append("cloud_name", "dvzyaivr7");
            setImages((p) => { const u = [...p]; if (u[idx]) u[idx] = { ...u[idx], progress: 50 }; return u; });
            const res = await fetch("https://api.cloudinary.com/v1_1/dvzyaivr7/image/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error("Cloudinary upload failed");
            const data = await res.json();
            setImages((p) => { const u = [...p]; if (u[idx]) u[idx] = { ...u[idx], url: data.secure_url, progress: 100 }; return u; });
            resolve(data.secure_url);
          } catch (err) { reject(err); }
        });
      })
    );
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!form.productName.trim()) { addToast({ type: "error", message: "Product name is required." }); return false; }
    if (!form.category) { addToast({ type: "error", message: "Please select a category." }); return false; }
    if (form.isRental) {
      if (!form.rentPrice || Number(form.rentPrice) <= 0) { addToast({ type: "error", message: "Please enter a valid Rent Price." }); return false; }
    } else {
      if (!form.mrp || Number(form.mrp) <= 0) { addToast({ type: "error", message: "Please enter a valid MRP." }); return false; }
      if (!form.sellingPrice || Number(form.sellingPrice) <= 0) { addToast({ type: "error", message: "Please enter a Selling Price." }); return false; }
      if (Number(form.sellingPrice) > Number(form.mrp)) { addToast({ type: "error", message: "Selling Price cannot exceed MRP." }); return false; }
    }
    if (images.length === 0 && !form.externalImageUrls.trim()) {
      addToast({ type: "error", message: "Please upload at least one product image." }); return false;
    }
    return true;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Low stock warning (non-blocking)
    if (isLowStock) {
      addToast({ type: "warning", message: `⚠️ Stock sirf ${form.stockQuantity} bachi hai — reorder karein!` });
    }
    if (isOutOfStock) {
      addToast({ type: "warning", message: "⚠️ Stock zero hai! Product out of stock rahega." });
    }

    setSubmitting(true);
    setUploading(true);
    try {
      addToast({ type: "info", message: "Images upload ho rahi hain..." });
      let imageUrls = await uploadImages();
      if (form.externalImageUrls.trim()) {
        const external = form.externalImageUrls.split(",").map((u) => u.trim()).filter(Boolean);
        imageUrls = [...imageUrls, ...external];
      }
      setUploading(false);

      const sku = form.sku || generateSKU(form.category);

      const productData = {
        productName: form.productName.trim(),
        description: form.description.trim(),
        category: form.category,
        subCategory: form.subCategory,
        sku,
        isRental: form.isRental,
        // Pricing
        ...(form.isRental
          ? {
              rentPrice: Number(form.rentPrice),
              securityDeposit: Number(form.securityDeposit) || 0,
              replacementValue: Number(form.replacementValue) || 0,
              rentalStatus: form.rentalStatus,
              expectedReturnDate: form.expectedReturnDate || null,
              // Keep these for backward compat / display
              mrp: 0,
              finalPrice: Number(form.rentPrice),
              discountPercentage: 0,
            }
          : {
              mrp: Number(form.mrp),
              sellingPrice: Number(form.sellingPrice),
              finalPrice: Number(form.sellingPrice),
              discountPercentage: mrpNum > 0 ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100) : 0,
              stockQuantity: Number(form.stockQuantity) || 0,
            }),
        colors: form.colors,
        sizeAgeGroup: form.sizeAgeGroup.trim(),
        materialType: form.materialType,
        occasionTags: form.occasionTags,
        isFeatured: form.isFeatured,
        isCodAvailable: form.isCodAvailable,
        isReturnable: form.isReturnable,
        videoUrl: form.videoUrl.trim(),
        imageUrls,
        updatedAt: serverTimestamp(),
      };

      if (editId && !isDuplicate) {
        await updateDoc(doc(db, "products", editId), productData);
        addToast({ type: "success", title: "Updated!", message: `"${form.productName}" updated successfully.` });
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: serverTimestamp() });
        addToast({ type: "success", title: "Product Added!", message: `"${form.productName}" saved successfully.` });
        setForm(buildInitialForm());
        setImages([]);
        setIsDuplicate(false);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: "error", title: "Failed", message: err.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-24">
      {/* ── Page Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            {editId && !isDuplicate ? "✏️ Edit Product" : isDuplicate ? "📋 Duplicate Product" : "➕ Add New Product"}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isDuplicate ? "Duplicate se form bhar diya — naam aur details badlein" : "Naya product Firestore mein save karein"}
          </p>
        </div>
        {(editId || form.productName) && (
          <button
            type="button"
            onClick={duplicateProduct}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 text-sm font-medium transition-all"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
        )}
      </div>

      {/* ── Overdue Alert ── */}
      {isOverdue && (
        <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>⚠️ Overdue! Yeh item <strong>{form.expectedReturnDate}</strong> ko return hona tha — abhi bhi "Rented Out" hai.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ═══ 2-COLUMN GRID (desktop) ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ──────────── LEFT COLUMN ──────────── */}
          <div className="space-y-6">

            {/* ── SECTION 1: Basic Info ── */}
            <SectionCard icon={Tag} title="Basic Information" accentColor="violet">
              <div className="space-y-4">

                {/* Product Name */}
                <div>
                  <label htmlFor="pf-name" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="pf-name"
                    type="text"
                    value={form.productName}
                    onChange={(e) => set("productName", e.target.value)}
                    placeholder="e.g. Red AD Stone Bridal Set"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="pf-category" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="pf-category"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
                    required
                  >
                    <option value="">Category chunein...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Sub-category (dynamic) */}
                {subCategoryOptions.length > 0 && (
                  <div className="animate-fade-in">
                    <label htmlFor="pf-subcat" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Sub-category
                    </label>
                    <select
                      id="pf-subcat"
                      value={form.subCategory}
                      onChange={(e) => set("subCategory", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
                    >
                      <option value="">Sub-category chunein (optional)</option>
                      {subCategoryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label htmlFor="pf-desc" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="pf-desc"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Product ki details likhein — material, design, occasion..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5" /> Auto-Generated SKU
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="font-mono text-sm font-bold text-violet-700 tracking-wider flex-1">
                        {form.sku || (form.category ? "(Category chunein to SKU auto-generate hoga)" : "—")}
                      </span>
                    </div>
                    <button type="button" onClick={refreshSKU} title="Regenerate SKU"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={copySKU} title="Copy SKU"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={printLabel} title="Print Label"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">SKU auto-generate hota hai category select karne par. Baad mein regenerate bhi kar sakte hain.</p>
                </div>

                {/* Return Policy */}
                <div className="pt-2">
                  <Toggle
                    id="pf-returnable-toggle"
                    checked={form.isReturnable}
                    onChange={(v) => set("isReturnable", v)}
                    label="7-Day Return Available"
                    sub="Turn off for non-returnable items like Cakes, Food, or Custom orders."
                  />
                </div>
              </div>
            </SectionCard>

            {/* ── SECTION 2: Sale vs Rent Toggle ── */}
            <SectionCard icon={form.isRental ? Key : ShoppingBag} title="Item Type — Sale ya Rent?" accentColor={form.isRental ? "rose" : "emerald"}>
              <div className="space-y-5">
                {/* Toggle */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Toggle
                    id="pf-rental-toggle"
                    checked={form.isRental}
                    onChange={(v) => set("isRental", v)}
                    label={form.isRental ? "🔑 Rental Item (Kiraye pe)" : "🛍️ Normal Sale Item"}
                    sub={form.isRental ? "Bridal jewelry, costumes — rent par diye jaane wale items" : "Birthday items, regular gifts — seedha beche jaane wale"}
                  />
                </div>

                {/* ── SALE fields ── */}
                {!form.isRental && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      {/* MRP */}
                      <div>
                        <label htmlFor="pf-mrp" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          MRP (₹) <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input id="pf-mrp" type="number" min="0" value={form.mrp}
                            onChange={(e) => set("mrp", e.target.value)}
                            placeholder="999" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
                        </div>
                      </div>
                      {/* Selling Price */}
                      <div>
                        <label htmlFor="pf-sell" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Selling Price (₹) <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input id="pf-sell" type="number" min="0" value={form.sellingPrice}
                            onChange={(e) => set("sellingPrice", e.target.value)}
                            placeholder="799" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
                        </div>
                      </div>
                    </div>

                    {/* Profit Margin calculator */}
                    {profit !== null && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
                        profit > 0 ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"
                      }`}>
                        <IndianRupee className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {profit > 0
                            ? `Profit: ${formatPrice(profit)} (${profitPct}% margin)`
                            : `⚠️ Selling price MRP se zyada hai!`}
                        </span>
                        {profit > 0 && (
                          <span className="ml-auto text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                            {profitPct}% OFF for customer
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stock Quantity */}
                    <div>
                      <label htmlFor="pf-stock" className="block text-xs font-semibold text-slate-600 mb-1.5">
                        <PackageCheck className="w-3.5 h-3.5 inline mr-1" />
                        Stock Quantity
                      </label>
                      <input id="pf-stock" type="number" min="0" value={form.stockQuantity}
                        onChange={(e) => set("stockQuantity", e.target.value)}
                        placeholder="e.g. 25"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                          isOutOfStock ? "border-rose-400 bg-rose-50 focus:ring-rose-100" :
                          isLowStock ? "border-amber-400 bg-amber-50 focus:ring-amber-100 focus:border-amber-400" :
                          "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                        }`} />
                      {isLowStock && !isOutOfStock && (
                        <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1 animate-fade-in">
                          <AlertTriangle className="w-3.5 h-3.5" /> Stock bahut kam hai — reorder karein!
                        </p>
                      )}
                      {isOutOfStock && (
                        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 animate-fade-in">
                          <AlertTriangle className="w-3.5 h-3.5" /> Stock zero — product Out of Stock dikhega
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── RENTAL fields ── */}
                {form.isRental && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Rent Price */}
                      <div>
                        <label htmlFor="pf-rent" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Rent Price (₹/event) <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input id="pf-rent" type="number" min="0" value={form.rentPrice}
                            onChange={(e) => set("rentPrice", e.target.value)}
                            placeholder="500" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition" />
                        </div>
                      </div>
                      {/* Security Deposit */}
                      <div>
                        <label htmlFor="pf-deposit" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Security Deposit (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input id="pf-deposit" type="number" min="0" value={form.securityDeposit}
                            onChange={(e) => set("securityDeposit", e.target.value)}
                            placeholder="2000" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Replacement Value */}
                      <div>
                        <label htmlFor="pf-replace" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Replacement Value (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input id="pf-replace" type="number" min="0" value={form.replacementValue}
                            onChange={(e) => set("replacementValue", e.target.value)}
                            placeholder="8000" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition" />
                        </div>
                      </div>
                      {/* Current Status */}
                      <div>
                        <label htmlFor="pf-rstatus" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Current Status
                        </label>
                        <select id="pf-rstatus" value={form.rentalStatus}
                          onChange={(e) => set("rentalStatus", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white">
                          {RENTAL_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Expected Return Date */}
                    <div>
                      <label htmlFor="pf-retdate" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" /> Expected Return Date
                      </label>
                      <input id="pf-retdate" type="date" value={form.expectedReturnDate}
                        onChange={(e) => set("expectedReturnDate", e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                          isOverdue ? "border-rose-400 bg-rose-50 focus:ring-rose-100" : "border-slate-200 focus:border-rose-400 focus:ring-rose-100"
                        }`} />
                      {isOverdue && (
                        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-semibold animate-fade-in">
                          <Clock className="w-3.5 h-3.5" /> OVERDUE! Return date nikal chuki hai.
                        </p>
                      )}
                    </div>

                    {/* Rental info summary */}
                    {form.rentPrice && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 space-y-1 animate-fade-in">
                        <p>🔑 <strong>Kiraya:</strong> {formatPrice(Number(form.rentPrice))}/event</p>
                        {form.securityDeposit && <p>🛡️ <strong>Security:</strong> {formatPrice(Number(form.securityDeposit))} (advance lena hai)</p>}
                        {form.replacementValue && <p>⚠️ <strong>Replacement:</strong> {formatPrice(Number(form.replacementValue))} (agar toota/khoya)</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ──────────── RIGHT COLUMN ──────────── */}
          <div className="space-y-6">

            {/* ── SECTION 3: Images ── */}
            <SectionCard icon={ImageIcon} title="Product Images" accentColor="blue">
              <div>
                <p className="text-xs text-slate-400 mb-4">
                  Max {MAX_IMAGES} images — pehli photo main thumbnail hogi (JPG, PNG, WebP — 5MB each)
                </p>

                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all group"
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple onChange={handleImageSelect} className="hidden" />
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Click to upload images</p>
                  <p className="text-xs text-slate-400 mt-0.5">ya URLs paste karein neeche</p>
                </div>

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-100 aspect-square">
                        <img src={img.preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        {uploading && img.progress < 100 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                        {i === 0 && <span className="absolute top-1.5 left-1.5 bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">Main</span>}
                        <button type="button" onClick={() => removeImage(i)} disabled={submitting}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/30 transition-all">
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    )}
                  </div>
                )}

                {/* External URLs */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label htmlFor="pf-exturl" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Ya Image URLs paste karein (alternative)
                  </label>
                  <textarea id="pf-exturl" value={form.externalImageUrls}
                    onChange={(e) => set("externalImageUrls", e.target.value)}
                    placeholder="https://...jpg, https://...jpg (comma separated)"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none" />
                </div>
              </div>
            </SectionCard>

            {/* ── SECTION 4: Attributes ── */}
            <SectionCard icon={Layers} title="Product Attributes" accentColor="amber">
              <div className="space-y-5">

                {/* Colors */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((color) => {
                      const sel = form.colors.includes(color);
                      const swatch = COLOR_SWATCHES[color];
                      const isGrad = swatch?.includes("gradient");
                      return (
                        <button key={color} type="button" onClick={() => toggleColor(color)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            sel ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}>
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                            style={{ background: isGrad ? swatch : undefined, backgroundColor: isGrad ? undefined : swatch }} />
                          {color}
                          {sel && <CheckCircle2 className="w-3 h-3 text-violet-500" />}
                        </button>
                      );
                    })}
                  </div>
                  {form.colors.length > 0 && (
                    <p className="mt-2 text-xs text-violet-600">Selected: {form.colors.join(", ")}</p>
                  )}
                </div>

                {/* Size / Age Group */}
                <div>
                  <label htmlFor="pf-size" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Size / Age Group
                  </label>
                  <input id="pf-size" type="text" value={form.sizeAgeGroup}
                    onChange={(e) => set("sizeAgeGroup", e.target.value)}
                    placeholder="e.g. 2.4 inch, Free Size, 3-5 years, One Size"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
                </div>

                {/* Material Type */}
                <div>
                  <label htmlFor="pf-material" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Material Type
                  </label>
                  <select id="pf-material" value={form.materialType}
                    onChange={(e) => set("materialType", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white">
                    <option value="">Material chunein (optional)</option>
                    {MATERIAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Occasion Tags */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Occasion Tags
                    <span className="ml-1 text-slate-400 font-normal">(filter ke liye important)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASION_TAGS.map((tag) => {
                      const sel = form.occasionTags.includes(tag);
                      return (
                        <button key={tag} type="button" onClick={() => toggleOccasion(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            sel ? "bg-amber-500 border-amber-500 text-white shadow-sm" : "border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50"
                          }`}>
                          {sel && "✓ "}{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── SECTION 5: Extras ── */}
            <SectionCard icon={Star} title="Extra Settings" accentColor="slate">
              <div className="space-y-4">
                {/* Video URL */}
                <div>
                  <label htmlFor="pf-video" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Video URL (Optional)
                  </label>
                  <input id="pf-video" type="url" value={form.videoUrl}
                    onChange={(e) => set("videoUrl", e.target.value)}
                    placeholder="YouTube/Instagram reel link..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition" />
                </div>
                {/* Featured */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Toggle
                    id="pf-featured"
                    checked={form.isFeatured}
                    onChange={(v) => set("isFeatured", v)}
                    label="⭐ Featured Product"
                    sub='Homepage "Trending Now" section mein dikhao'
                  />
                </div>
                {/* COD Availability */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Toggle
                    id="pf-cod"
                    checked={form.isCodAvailable}
                    onChange={(v) => set("isCodAvailable", v)}
                    label="💵 Cash on Delivery Available"
                    sub="Agar band kiya, toh customer ko pehle online pay karna padega"
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── STICKY SAVE BAR ────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => { setForm(buildInitialForm()); setImages([]); setIsDuplicate(false); }}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50">
                <RotateCcw className="w-4 h-4" /> Clear
              </button>
              {isLowStock && (
                <span className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Warning
                </span>
              )}
              {isOverdue && (
                <span className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                  <Clock className="w-3.5 h-3.5" /> Overdue Item
                </span>
              )}
            </div>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? "Images upload ho rahi hain..." : "Save ho raha hai..."}</>
              ) : (
                <>{editId && !isDuplicate ? "✏️ Update Product" : "💾 Save Product"}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
