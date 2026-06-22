import { useState, useEffect } from "react";
import { X, ShoppingCart, Heart, Check, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useToast } from "../shared/Toast";
import { formatPrice } from "../../utils/helpers";
import { COLOR_SWATCHES } from "../../utils/constants";

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImg, setMainImg] = useState(0);

  const wishlisted = isWishlisted(product?.id);

  useEffect(() => {
    if (!product) return;
    if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
    if (product.sizesAndStock) {
      const first = Object.keys(product.sizesAndStock).find(
        (s) => product.sizesAndStock[s] > 0
      );
      if (first) setSelectedSize(first);
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const availableSizes = Object.keys(product.sizesAndStock || {});

  const handleAddToCart = () => {
    if (!selectedColor) {
      addToast({ type: "warning", message: "Please select a color." });
      return;
    }
    if (!selectedSize) {
      addToast({ type: "warning", message: "Please select a size." });
      return;
    }
    addToCart(product, selectedSize, selectedColor, 1);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[151] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl animate-scale-in">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-48 flex-shrink-0 bg-gray-50 relative overflow-hidden">
            <div className="aspect-square sm:aspect-[3/4] overflow-hidden">
              <img
                src={product.imageUrls?.[mainImg]}
                alt={product.productName}
                className="w-full h-full object-cover zoom-hover-img"
              />
            </div>
            {product.discountPercentage > 0 && (
              <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md shadow-sm">
                {product.discountPercentage}% OFF
              </span>
            )}
            {/* Thumbnails */}
            {product.imageUrls?.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {product.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`w-12 h-14 flex-shrink-0 border-2 overflow-hidden transition-all rounded-lg ${
                      mainImg === i ? "border-violet-600 shadow-md" : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-5 md:p-6 space-y-4">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-1">{product.category}</p>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                {product.productName}
              </h3>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-2xl font-black text-slate-900">
                {formatPrice(product.finalPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-sm font-medium text-slate-400 line-through mb-1">
                    {formatPrice(product.mrp)}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-1">
                    {product.discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2.5">
                  Color: <span className="font-bold text-slate-500 capitalize">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const swatch = COLOR_SWATCHES[color];
                    const isGrad = swatch?.includes("gradient");
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all shadow-sm ${
                          selectedColor === color
                            ? "border-violet-600 scale-110 ring-4 ring-violet-50 ring-offset-0"
                            : "border-slate-200 hover:scale-110 hover:border-slate-300"
                        }`}
                        style={{
                          background: isGrad ? swatch : swatch,
                          backgroundColor: isGrad ? undefined : swatch,
                        }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            {availableSizes.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2.5">Size</p>
                {availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size") ? (
                  <div className="inline-block bg-violet-50 text-violet-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-violet-100">
                    ✨ Free Size / Fits All
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const stock = product.sizesAndStock[size];
                      const oos = stock === 0;
                      return (
                        <button
                          key={size}
                          disabled={oos}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[44px] h-10 px-3 text-xs font-bold border-2 rounded-xl transition-all ${
                            selectedSize === size
                              ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                              : oos
                              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                              : "bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white font-black py-3.5 rounded-xl text-sm uppercase tracking-wider hover:bg-violet-700 transition-all shadow-md shadow-violet-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90 ${
                  wishlisted
                    ? "border-rose-200 bg-rose-50 text-rose-500 shadow-inner"
                    : "border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50"
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500" : ""}`} />
              </button>
            </div>

            {/* View full page link */}
            <Link
              to={`/product/${product.id}`}
              onClick={onClose}
              className="text-xs text-violet-600 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:text-violet-800 hover:bg-violet-50 py-2 rounded-lg transition-colors mt-2"
            >
              View Full Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
