import { useState } from "react";
import { Tag, CheckCircle2, X, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";

// Valid coupons — in production, fetch from Firestore
// Valid coupons — in production, fetch from Firestore
export const VALID_COUPONS = {
  "RADHE10": { discount: 10, type: "percent", minOrder: 299, maxDiscount: 30, desc: "10% off (up to ₹30) on orders above ₹299" }, // Min 299, Max 30
  "RADHE12": { discount: 12, type: "percent", minOrder: 399, maxDiscount: 50, desc: "12% off (up to ₹50) on orders above ₹399" }, // Min 399, Max 50
  "NEWUSER": { discount: 50, type: "flat", minOrder: 499, desc: "Flat ₹50 off on orders above ₹499" },
  "BRIDAL20": { discount: 20, type: "percent", minOrder: 499, desc: "20% off on bridal collection" },
  "FESTIVE": { discount: 15, type: "percent", minOrder: 399, desc: "15% off this festive season" },
  "HALDI50": { discount: 50, type: "flat", minOrder: 249, desc: "Flat ₹50 off on Haldi special" },
  "RADHE100": { discount: 100, type: "flat", minOrder: 999, desc: "Flat ₹100 off on orders above ₹999" },
};

export function useCoupon(cartTotal) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const { userProfile } = useAuth();

  const applyCoupon = async (code = couponCode, customerPhone = "", customerEmail = "") => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setApplying(true);
    setCouponError("");

    try {
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

      // Check if user has already used this coupon in Firestore orders
      const emailsToCheck = [userProfile?.email, customerEmail].filter(Boolean);
      const phonesToCheck = [customerPhone].filter(Boolean);

      let alreadyUsed = false;

      if (emailsToCheck.length > 0) {
        for (const email of emailsToCheck) {
          const q = query(
            collection(db, "orders"),
            where("customerDetails.email", "==", email),
            where("coupon.code", "==", trimmed)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            alreadyUsed = true;
            break;
          }
        }
      }

      if (!alreadyUsed && phonesToCheck.length > 0) {
        for (const phone of phonesToCheck) {
          const q = query(
            collection(db, "orders"),
            where("customerDetails.phone", "==", phone),
            where("coupon.code", "==", trimmed)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            alreadyUsed = true;
            break;
          }
        }
      }

      if (alreadyUsed) {
        setCouponError("You have already used this coupon code once.");
        setApplying(false);
        return;
      }

      setAppliedCoupon({ code: trimmed, ...coupon });
      setCouponCode("");
    } catch (err) {
      console.error("Error validating coupon usage:", err);
      setCouponError("Unable to validate coupon usage. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      const calculated = Math.round((cartTotal * appliedCoupon.discount) / 100);
      discountAmount = appliedCoupon.maxDiscount 
        ? Math.min(calculated, appliedCoupon.maxDiscount) 
        : calculated;
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }

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

export default function CouponSection({ 
  couponCode, 
  setCouponCode, 
  appliedCoupon, 
  couponError, 
  applying, 
  applyCoupon, 
  removeCoupon 
}) {

  // Notify parent of discount change
  const handleApply = () => {
    applyCoupon();
  };

  // Available coupon hints
  const hints = [
    { code: "RADHE100", label: "₹100 OFF (Min ₹999)" },
    { code: "RADHE12", label: "12% OFF (Min ₹399, Max ₹50)" },
    { code: "RADHE10", label: "10% OFF (Min ₹299, Max ₹30)" },
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
