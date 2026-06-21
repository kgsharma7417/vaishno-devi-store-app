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
        className="fixed inset-0 bg-black/60 z-[150] animate-fade-in"
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
          <div className="sm:w-48 flex-shrink-0 bg-gray-50 relative">
            <div className="aspect-square sm:aspect-[3/4] overflow-hidden">
              <img
                src={product.imageUrls?.[mainImg]}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            </div>
            {product.discountPercentage > 0 && (
              <span className="absolute top-2 left-2 bg-fk-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                {product.discountPercentage}% OFF
              </span>
            )}
            {/* Thumbnails */}
            {product.imageUrls?.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {product.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`w-10 h-10 flex-shrink-0 border-2 overflow-hidden transition-all ${
                      mainImg === i ? "border-fk-blue" : "border-gray-200 opacity-60"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">{product.category}</p>
              <h3 className="text-sm font-semibold text-gray-800 leading-snug mt-0.5">
                {product.productName}
              </h3>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(product.finalPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.mrp)}
                  </span>
                  <span className="text-xs text-fk-green font-medium">
                    {product.discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Color: <span className="font-normal text-gray-500 capitalize">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const swatch = COLOR_SWATCHES[color];
                    const isGrad = swatch?.includes("gradient");
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-fk-blue scale-110 ring-2 ring-fk-blue/30 ring-offset-1"
                            : "border-gray-200 hover:scale-110"
                        }`}
                        style={{
                          background: isGrad ? swatch : swatch,
                          backgroundColor: isGrad ? undefined : swatch,
                        }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                            <Check className="w-3 h-3 text-white" />
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
                <p className="text-xs font-bold text-gray-700 uppercase mb-1.5">Size</p>
                {availableSizes.length === 1 && (availableSizes[0] === "Free Size" || availableSizes[0] === "Standard Size") ? (
                  <div className="inline-block bg-sage-50 text-sage-700 text-xs font-semibold px-3 py-1.5 rounded border border-sage-100">
                    ✨ Free Size / Fits All
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map((size) => {
                      const stock = product.sizesAndStock[size];
                      const oos = stock === 0;
                      return (
                        <button
                          key={size}
                          disabled={oos}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-8 text-xs font-semibold border-2 rounded-sm transition-all ${
                            selectedSize === size
                              ? "bg-fk-blue text-white border-fk-blue"
                              : oos
                              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through"
                              : "bg-white text-gray-700 border-gray-200 hover:border-fk-blue"
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
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock}
                className="flex-1 flex items-center justify-center gap-1.5 bg-fk-yellow text-white font-bold py-2.5 rounded-sm text-sm uppercase hover:bg-fk-yellow-dark transition-colors disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-10 h-10 rounded-sm border-2 flex items-center justify-center transition-all ${
                  wishlisted
                    ? "border-fk-red bg-fk-red-light text-fk-red"
                    : "border-gray-200 text-gray-400 hover:border-fk-red hover:text-fk-red"
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? "fill-fk-red" : ""}`} />
              </button>
            </div>

            {/* View full page link */}
            <Link
              to={`/product/${product.id}`}
              onClick={onClose}
              className="text-xs text-fk-blue font-medium flex items-center gap-0.5 hover:underline"
            >
              View Full Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
