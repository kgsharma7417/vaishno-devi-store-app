import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../shared/Toast";
import {
  CATEGORIES,
  BANGLE_SIZES,
  AVAILABLE_COLORS,
  COLOR_SWATCHES,
  MAX_IMAGES,
  STORAGE_PRODUCTS_PATH,
} from "../../utils/constants";
import {
  calculateFinalPrice,
  formatPrice,
  generateUniqueFileName,
  validateImageFile,
} from "../../utils/helpers";
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Tag,
  IndianRupee,
  Percent,
  PackageCheck,
  Video,
  Star,
  Loader2,
  GripVertical,
} from "lucide-react";

const INITIAL_FORM = {
  productName: "",
  description: "",
  category: "",
  colors: [],
  sizesAndStock: [{ size: "", stock: "" }],
  mrp: "",
  discountPercentage: "",
  videoUrl: "",
  externalImageUrls: "",
  isFeatured: false,
};

export default function ProductForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState([]); // { file, preview, progress, url }
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const finalPrice = calculateFinalPrice(
    Number(form.mrp),
    Number(form.discountPercentage)
  );

  // --- Field handlers ---
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // --- Color handlers ---
  const toggleColor = (color) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  // --- Size & Stock handlers ---
  const addSizeRow = () => {
    setForm((prev) => ({
      ...prev,
      sizesAndStock: [...prev.sizesAndStock, { size: "", stock: "" }],
    }));
  };

  const removeSizeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      sizesAndStock: prev.sizesAndStock.filter((_, i) => i !== index),
    }));
  };

  const updateSizeRow = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.sizesAndStock];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sizesAndStock: updated };
    });
  };

  // --- Image handlers ---
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > MAX_IMAGES) {
      addToast({
        type: "warning",
        message: `You can upload a maximum of ${MAX_IMAGES} images.`,
      });
      return;
    }

    const newImages = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        addToast({ type: "error", message: validation.error });
        continue;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        url: null,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- Upload images to Cloudinary ---
  const uploadImages = async () => {
    const uploadPromises = images.map((img, index) => {
      if (img.url) return Promise.resolve(img.url); // Already uploaded

      return new Promise(async (resolve, reject) => {
        try {
          const formData = new FormData();
          formData.append("file", img.file);
          formData.append("upload_preset", "library_upload");
          formData.append("cloud_name", "dz7vbpney");

          // Simulate starting progress
          setImages((prev) => {
            const updated = [...prev];
            if (updated[index]) updated[index] = { ...updated[index], progress: 50 };
            return updated;
          });

          const response = await fetch("https://api.cloudinary.com/v1_1/dz7vbpney/image/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
          }

          const data = await response.json();
          
          setImages((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = { ...updated[index], url: data.secure_url, progress: 100 };
            }
            return updated;
          });
          
          resolve(data.secure_url);
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        }
      });
    });

    return Promise.all(uploadPromises);
  };

  // --- Form validation ---
  const validateForm = () => {
    if (!form.productName.trim()) {
      addToast({ type: "error", message: "Product name is required." });
      return false;
    }
    if (!form.category) {
      addToast({ type: "error", message: "Please select a category." });
      return false;
    }
    if (form.colors.length === 0) {
      addToast({ type: "error", message: "Please select at least one color." });
      return false;
    }
    const validSizes = form.sizesAndStock.filter(
      (s) => s.stock !== ""
    );
    if (validSizes.length === 0) {
      addToast({
        type: "error",
        message: "Please add stock for at least one item.",
      });
      return false;
    }
    if (!form.mrp || Number(form.mrp) <= 0) {
      addToast({ type: "error", message: "Please enter a valid MRP." });
      return false;
    }
    if (images.length === 0 && (!form.externalImageUrls || form.externalImageUrls.trim() === "")) {
      addToast({
        type: "error",
        message: "Please upload or paste at least one product image URL.",
      });
      return false;
    }
    return true;
  };

  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setUploading(true);

    try {
      // 1. Upload images
      addToast({ type: "info", message: "Processing images..." });
      let imageUrls = await uploadImages();
      
      // Combine with external URLs
      if (form.externalImageUrls && form.externalImageUrls.trim() !== "") {
        const external = form.externalImageUrls.split(",").map(u => u.trim()).filter(Boolean);
        imageUrls = [...imageUrls, ...external];
      }
      setUploading(false);

      // 2. Build sizesAndStock map
      const sizesAndStockMap = {};
      form.sizesAndStock
        .filter((s) => s.stock !== "")
        .forEach((s) => {
          const finalSize = s.size || "Free Size";
          sizesAndStockMap[finalSize] = Number(s.stock);
        });

      // 3. Build product document
      const productData = {
        productName: form.productName.trim(),
        description: form.description.trim(),
        category: form.category,
        colors: form.colors,
        sizesAndStock: sizesAndStockMap,
        mrp: Number(form.mrp),
        discountPercentage: Number(form.discountPercentage) || 0,
        finalPrice,
        imageUrls,
        videoUrl: form.videoUrl.trim(),
        isFeatured: form.isFeatured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 4. Save to Firestore
      await addDoc(collection(db, "products"), productData);

      addToast({
        type: "success",
        title: "Product Added!",
        message: `"${form.productName}" has been saved successfully.`,
      });

      // 5. Reset form
      setForm(INITIAL_FORM);
      setImages([]);
    } catch (error) {
      console.error("Error saving product:", error);
      addToast({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // Get available sizes (not already added)
  const usedSizes = form.sizesAndStock.map((s) => s.size).filter(Boolean);
  const availableSizes = BANGLE_SIZES.filter((s) => !usedSizes.includes(s));

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-earth-800">
          Upload Product
        </h1>
        <p className="text-earth-400 mt-1">
          Add a new bangle or jewellery item to your store
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ===== BASIC INFO SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-sage-500" />
            Basic Information
          </h2>

          <div className="space-y-5">
            {/* Product Name */}
            <div>
              <label htmlFor="product-name" className="input-label">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={form.productName}
                onChange={(e) => updateField("productName", e.target.value)}
                placeholder="e.g., Gold Shimmer Bridal Chuda Set"
                className="input-field"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="product-desc" className="input-label">
                Description
              </label>
              <textarea
                id="product-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the product — material, design details, occasion..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="product-category" className="input-label">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                id="product-category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="select-field"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ===== COLORS SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-rose-400 via-gold-400 to-sage-400" />
            Colors <span className="text-rose-400">*</span>
          </h2>
          <p className="text-sm text-earth-400 mb-4">
            Select all available colors for this product
          </p>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_COLORS.map((color) => {
              const isSelected = form.colors.includes(color);
              const swatch = COLOR_SWATCHES[color];
              const isGradient = swatch?.includes("gradient");

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                             border transition-all duration-200
                             ${
                               isSelected
                                 ? "border-sage-400 bg-sage-50 text-sage-700 shadow-sm"
                                 : "border-earth-200 bg-white text-earth-600 hover:border-earth-300"
                             }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                    style={{
                      background: isGradient ? swatch : swatch,
                      backgroundColor: isGradient ? undefined : swatch,
                    }}
                  />
                  {color}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  )}
                </button>
              );
            })}
          </div>

          {form.colors.length > 0 && (
            <div className="mt-3 text-sm text-sage-600">
              Selected: {form.colors.join(", ")}
            </div>
          )}
        </section>

        {/* ===== SIZES & STOCK SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-2 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-sage-500" />
            Sizes & Stock <span className="text-rose-400">*</span>
          </h2>
          <p className="text-sm text-earth-400 mb-5">
            Add sizes and stock quantities. If the item has no size (e.g. Ring, Necklace), just leave the size blank and enter stock.
          </p>

          <div className="space-y-3">
            {form.sizesAndStock.map((row, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-scale-in"
              >
                <GripVertical className="w-4 h-4 text-earth-300 flex-shrink-0 hidden sm:block" />

                {/* Size select */}
                <div className="flex-1">
                  <select
                    value={row.size}
                    onChange={(e) =>
                      updateSizeRow(index, "size", e.target.value)
                    }
                    className="select-field text-sm"
                  >
                    <option value="">Select Size</option>
                    {BANGLE_SIZES.map((size) => (
                      <option
                        key={size}
                        value={size}
                        disabled={usedSizes.includes(size) && row.size !== size}
                      >
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock input */}
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={(e) =>
                      updateSizeRow(index, "stock", e.target.value)
                    }
                    placeholder="Stock qty"
                    className="input-field text-sm"
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeSizeRow(index)}
                  disabled={form.sizesAndStock.length <= 1}
                  className="p-2 text-earth-400 hover:text-rose-500 hover:bg-rose-50 
                             rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add size button */}
          {availableSizes.length > 0 && (
            <button
              type="button"
              onClick={addSizeRow}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 
                         text-sm font-medium text-sage-600 bg-sage-50 
                         border border-sage-200 rounded-xl
                         hover:bg-sage-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Size
            </button>
          )}
        </section>

        {/* ===== PRICING SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-6 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-sage-500" />
            Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* MRP */}
            <div>
              <label htmlFor="product-mrp" className="input-label">
                MRP (₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 text-sm">
                  ₹
                </span>
                <input
                  id="product-mrp"
                  type="number"
                  min="0"
                  value={form.mrp}
                  onChange={(e) => updateField("mrp", e.target.value)}
                  placeholder="2999"
                  className="input-field pl-8"
                  required
                />
              </div>
            </div>

            {/* Discount */}
            <div>
              <label htmlFor="product-discount" className="input-label">
                Discount (%)
              </label>
              <div className="relative">
                <input
                  id="product-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) =>
                    updateField("discountPercentage", e.target.value)
                  }
                  placeholder="25"
                  className="input-field pr-8"
                />
                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
              </div>
            </div>

            {/* Final Price (auto-calculated) */}
            <div>
              <label className="input-label">Final Price</label>
              <div className="flex items-center h-[50px] px-4 bg-sage-50 border border-sage-200 rounded-xl">
                <span className="text-lg font-heading font-bold text-sage-700">
                  {form.mrp ? formatPrice(finalPrice) : "—"}
                </span>
                {form.mrp && Number(form.discountPercentage) > 0 && (
                  <span className="ml-2 badge-gold text-xs">
                    {form.discountPercentage}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price preview */}
          {form.mrp && Number(form.discountPercentage) > 0 && (
            <div className="mt-4 p-3 bg-earth-50 rounded-xl text-sm text-earth-500 animate-scale-in">
              <span className="line-through text-earth-400">
                {formatPrice(Number(form.mrp))}
              </span>
              <span className="mx-2">→</span>
              <span className="font-semibold text-sage-700">
                {formatPrice(finalPrice)}
              </span>
              <span className="text-earth-400 ml-1">
                (Save {formatPrice(Number(form.mrp) - finalPrice)})
              </span>
            </div>
          )}
        </section>

        {/* ===== IMAGES SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sage-500" />
            Product Images <span className="text-rose-400">*</span>
          </h2>
          <p className="text-sm text-earth-400 mb-5">
            Upload up to {MAX_IMAGES} images. First image will be the main
            display. (JPG, PNG, WebP — max 5MB each)
          </p>

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-earth-200 rounded-2xl p-8
                       text-center cursor-pointer
                       hover:border-sage-400 hover:bg-sage-50/50 
                       transition-all duration-300 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-earth-100 group-hover:bg-sage-100 
                              flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-earth-400 group-hover:text-sage-500 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-earth-600">
                  Click to upload images
                </p>
                <p className="text-sm text-earth-400 mt-0.5">
                  or drag and drop files here
                </p>
              </div>
            </div>
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden border border-earth-100 
                             aspect-square animate-scale-in"
                >
                  <img
                    src={img.preview}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Upload progress overlay */}
                  {uploading && img.progress < 100 && !img.url && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
                      <span className="text-white text-sm font-medium">
                        {img.progress}%
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  {index === 0 && (
                    <span className="absolute top-2 left-2 badge-sage text-xs">
                      Main
                    </span>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={submitting}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg
                               opacity-0 group-hover:opacity-100 transition-opacity
                               hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-earth-200
                             flex flex-col items-center justify-center gap-2
                             text-earth-400 hover:border-sage-400 hover:text-sage-500
                             hover:bg-sage-50/50 transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Add More</span>
                </button>
              )}
            </div>
          )}

          {/* External URLs */}
          <div className="mt-8 pt-6 border-t border-earth-100">
            <label htmlFor="external-urls" className="input-label">
              Or Paste Image URLs (Alternative)
            </label>
            <textarea
              id="external-urls"
              value={form.externalImageUrls}
              onChange={(e) => updateField("externalImageUrls", e.target.value)}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              rows={2}
              className="input-field resize-none text-sm"
            />
            <p className="mt-1 text-xs text-earth-400">
              Separate multiple URLs with commas. Perfect for quickly adding images from Google or Unsplash to bypass CORS issues.
            </p>
          </div>
        </section>

        {/* ===== VIDEO & EXTRAS SECTION ===== */}
        <section className="card p-6 lg:p-8">
          <h2 className="text-lg font-heading font-semibold text-earth-700 mb-6 flex items-center gap-2">
            <Video className="w-5 h-5 text-sage-500" />
            Video & Extras
          </h2>

          <div className="space-y-5">
            {/* Video URL */}
            <div>
              <label htmlFor="product-video" className="input-label">
                Video URL (Optional)
              </label>
              <input
                id="product-video"
                type="url"
                value={form.videoUrl}
                onChange={(e) => updateField("videoUrl", e.target.value)}
                placeholder="https://youtube.com/shorts/... or direct video link"
                className="input-field"
              />
              <p className="mt-1 text-xs text-earth-400">
                Add a short reel or video showcasing the product
              </p>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-4 bg-earth-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gold-500" />
                <div>
                  <p className="text-sm font-medium text-earth-700">
                    Featured Product
                  </p>
                  <p className="text-xs text-earth-400">
                    Show in "Trending Now" section on homepage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateField("isFeatured", !form.isFeatured)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300
                           ${form.isFeatured ? "bg-sage-500" : "bg-earth-300"}`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md
                             transition-transform duration-300
                             ${form.isFeatured ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ===== SUBMIT BUTTON ===== */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_FORM);
              setImages([]);
            }}
            className="btn-secondary"
            disabled={submitting}
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-base px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploading ? "Uploading Images..." : "Saving Product..."}
              </>
            ) : (
              <>
                <PackageCheck className="w-5 h-5" />
                Upload Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
