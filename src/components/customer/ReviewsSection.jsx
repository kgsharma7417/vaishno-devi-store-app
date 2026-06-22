import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Star, MessageSquare, User, Calendar, CheckCircle, Edit, Trash2, Camera, X, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../shared/Toast";

export default function ReviewsSection({ productId }) {
  const { currentUser, userProfile } = useAuth();
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReviews();
    checkReviewEligibility();
  }, [productId, currentUser]);

  const checkReviewEligibility = async () => {
    setCheckingEligibility(true);
    try {
      let eligible = false;
      const localOrderIds = JSON.parse(localStorage.getItem('my_bangle_orders') || '[]');

      // 1. Check local storage order IDs first (useful for non-logged in or phone checkouts)
      if (localOrderIds.length > 0) {
        for (const orderId of localOrderIds) {
          try {
            const docRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const orderData = docSnap.data();
              if (orderData.orderStatus === "Delivered") {
                const hasItem = orderData.items?.some(item => item.id === productId);
                if (hasItem) {
                  eligible = true;
                  break;
                }
              }
            }
          } catch (e) {
            console.error("Error checking local order status:", e);
          }
        }
      }

      // 2. If not eligible yet and logged in, check by email query
      if (!eligible && userProfile?.email) {
        const q = query(
          collection(db, "orders"),
          where("customerDetails.email", "==", userProfile.email),
          where("orderStatus", "==", "Delivered")
        );
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          const orderData = doc.data();
          const hasItem = orderData.items?.some(item => item.id === productId);
          if (hasItem) {
            eligible = true;
          }
        });
      }

      setCanReview(eligible);
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      setCanReview(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch reviews without orderBy first to avoid Firestore Index required issues in new set
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId)
      );
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort manually in memory to prevent index crashes
      fetched.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setReviews(fetched);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "maa vaishno devi");
      formData.append("cloud_name", "dvzyaivr7");

      const response = await fetch("https://api.cloudinary.com/v1_1/dvzyaivr7/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();
      setImageUrl(data.secure_url);
      addToast({ type: "success", message: "Image uploaded successfully!" });
    } catch (err) {
      console.error("Cloudinary review image upload error:", err);
      addToast({ type: "error", message: "Failed to upload image. Please try again." });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      addToast({ type: "warning", message: "Please write a comment." });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update review
        const reviewRef = doc(db, "reviews", editingId);
        await updateDoc(reviewRef, {
          rating,
          comment: comment.trim(),
          imageUrl: imageUrl || null,
          updatedAt: serverTimestamp(),
        });
        addToast({ type: "success", message: "Review updated successfully!" });
        setEditingId(null);
      } else {
        // Create new review
        const reviewData = {
          productId,
          userId: currentUser?.uid || "anonymous",
          userName: userProfile?.name || "Verified Customer",
          userEmail: userProfile?.email || "guest",
          rating,
          comment: comment.trim(),
          imageUrl: imageUrl || null,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "reviews"), reviewData);
        addToast({ type: "success", message: "Review posted successfully!" });
      }

      setComment("");
      setImageUrl("");
      setRating(5);
      fetchReviews();
    } catch (err) {
      console.error("Error saving review:", err);
      addToast({ type: "error", message: "Failed to save review. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setImageUrl(review.imageUrl || "");
    // Scroll to review form smoothly
    window.scrollTo({ top: document.getElementById("review-form-anchor")?.offsetTop - 100, behavior: "smooth" });
  };

  const isMyReview = (review) => {
    if (currentUser?.uid && currentUser.uid !== "anonymous" && review.userId === currentUser.uid) {
      return true;
    }
    if (userProfile?.email && review.userEmail === userProfile.email) {
      return true;
    }
    return false;
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0";

  return (
    <div id="review-form-anchor" className="bg-white p-6 md:p-8 shadow-xl rounded-3xl border border-slate-100 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Customer Reviews</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">{reviews.length} Ratings & Reviews</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <span className="text-4xl font-black text-slate-900">{averageRating}</span>
            <div className="flex flex-col gap-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? "fill-current" : ""}`} />
                ))}
              </div>
              <span className="text-[11px] text-emerald-600 font-black tracking-widest uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 100% Certified
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Write review */}
      {checkingEligibility ? (
        <div className="text-sm text-slate-400 py-4 flex items-center gap-2 font-medium"><Loader2 className="w-4 h-4 animate-spin" /> Verifying order status...</div>
      ) : canReview ? (
        <form onSubmit={handleSubmit} className="bg-slate-50/50 p-6 border border-slate-200 shadow-sm space-y-5 rounded-2xl">
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{editingId ? "Edit your review" : "Rate this product"}</p>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-amber-400 focus:outline-none transition-transform hover:scale-110"
              >
                <Star className={`w-8 h-8 ${rating >= star ? "fill-current drop-shadow-sm" : "opacity-30"}`} />
              </button>
            ))}
          </div>

          <div>
            <textarea
              required
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your experience with this jewellery set..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-medium text-slate-900 bg-white resize-none shadow-sm"
            />
          </div>

          {/* Image upload section */}
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="bg-white border-2 border-slate-200 hover:border-violet-400 hover:text-violet-700 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {imageUrl ? "Change Photo" : "Add Photo"}
            </button>
            {imageUrl && (
              <div className="relative w-16 h-16 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <img src={imageUrl} alt="Review upload" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setImageUrl("")}
                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/80 text-white rounded-md backdrop-blur-sm transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700 text-white font-black px-6 py-3 text-xs uppercase tracking-widest rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update Review" : "Submit Review"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setComment("");
                  setRating(5);
                  setImageUrl("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 text-xs uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="bg-amber-50 p-5 border border-dashed border-amber-200 rounded-2xl text-center shadow-inner">
          <p className="text-sm text-amber-800 font-medium flex items-center justify-center gap-2">
            🔒 Only customers who purchased this product and got it **Delivered** can write reviews.
          </p>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-6 pt-4">
        {loading ? (
          <p className="text-sm text-slate-400 font-medium flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">No reviews yet. Be the first to write one!</p>
          </div>
        ) : (
          reviews.map((rev) => {
            const myReview = isMyReview(rev);
            return (
              <div key={rev.id} className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-slate-900">{rev.userName}</p>
                        {myReview && <span className="bg-violet-100 border border-violet-200 text-violet-700 text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md">You</span>}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "fill-current" : ""}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {myReview && (
                      <button
                        onClick={() => handleEditInit(rev)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                        title="Edit Review"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "Just now"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 font-medium leading-relaxed pl-14">{rev.comment}</p>
                
                {rev.imageUrl && (
                  <div className="pl-14 mt-3">
                    <div className="relative w-24 h-32 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
                      <a href={rev.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={rev.imageUrl} alt="Review upload" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
