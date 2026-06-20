import { useState } from "react";
import { Tag, CheckCircle2, X, Loader2 } from "lucide-react";

// Valid coupons — in production, fetch from Firestore
const VALID_COUPONS = {
  "RADHE10": { discount: 10, type: "percent", minOrder: 199, desc: "10% off on orders above ₹199" },
  "NEWUSER": { discount: 50, type: "flat", minOrder: 299, desc: "Flat ₹50 off on orders above ₹299" },
  "BRIDAL20": { discount: 20, type: "percent", minOrder: 499, desc: "20% off on bridal collection" },
  "FESTIVE": { discount: 15, type: "percent", minOrder: 399, desc: "15% off this festive season" },
  "HALDI50": { discount: 50, type: "flat", minOrder: 249, desc: "Flat ₹50 off on Haldi special" },
};

export function useCoupon(cartTotal) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);

  const applyCoupon = (code = couponCode) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setApplying(true);
    setCouponError("");

    // Simulate API call delay
    setTimeout(() => {
      const coupon = VALID_COUPONS[trimmed];
      if (!coupon) {
        setCouponError("Invalid coupon code. Please try again.");
        setApplying(false);
        return;
      }
      if (cartTotal < coupon.minOrder) {
        setCouponError(`Minimum order of ₹${coupon.minOrder} required for this coupon.`);
        setApplying(false);
        return;
      }
      setAppliedCoupon({ code: trimmed, ...coupon });
      setCouponCode("");
      setApplying(false);
    }, 600);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((cartTotal * appliedCoupon.discount) / 100)
      : appliedCoupon.discount
    : 0;

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    applying,
    applyCoupon,
    removeCoupon,
    discountAmount,
  };
}

export default function CouponSection({ cartTotal, onCouponApplied }) {
  const {
    couponCode, setCouponCode,
    appliedCoupon, couponError, applying,
    applyCoupon, removeCoupon, discountAmount,
  } = useCoupon(cartTotal);

  // Notify parent of discount change
  const handleApply = () => {
    applyCoupon();
  };

  // Available coupon hints
  const hints = [
    { code: "RADHE10", label: "10% OFF" },
    { code: "NEWUSER", label: "₹50 OFF" },
    { code: "FESTIVE", label: "15% OFF" },
  ];

  return (
    <section className="bg-white p-4 md:p-6 shadow-card">
      <h2 className="text-sm font-bold text-fk-blue uppercase mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4" /> Coupon Code
      </h2>

      {appliedCoupon ? (
        /* Applied state */
        <div className="flex items-center justify-between bg-fk-green-light border border-green-200 px-3 py-2.5 rounded-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-fk-green flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-fk-green">{appliedCoupon.code} applied!</p>
              <p className="text-xs text-gray-600">{appliedCoupon.desc}</p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            className="p-1 text-gray-400 hover:text-fk-red transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Input state */
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Enter coupon code"
              className="input-field flex-1 text-sm uppercase tracking-wider"
            />
            <button
              onClick={handleApply}
              disabled={applying || !couponCode.trim()}
              className="bg-fk-blue text-white font-bold px-4 rounded-sm text-sm flex items-center gap-1.5 hover:bg-fk-blue-dark transition-colors disabled:opacity-50"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {couponError && (
            <p className="text-fk-red text-xs mt-1.5 flex items-center gap-1">
              <X className="w-3 h-3" /> {couponError}
            </p>
          )}

          {/* Quick coupon hints */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {hints.map((hint) => (
              <button
                key={hint.code}
                onClick={() => { setCouponCode(hint.code); }}
                className="text-[10px] font-bold text-fk-blue border border-fk-blue/30 bg-fk-blue-light px-2 py-0.5 rounded-sm hover:bg-fk-blue hover:text-white transition-colors"
              >
                {hint.code} — {hint.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
