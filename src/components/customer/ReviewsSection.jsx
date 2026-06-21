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
      formData.append("upload_preset", "library_upload");
      formData.append("cloud_name", "dz7vbpney");

      const response = await fetch("https://api.cloudinary.com/v1_1/dz7vbpney/image/upload", {
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
    <div id="review-form-anchor" className="bg-white p-4 md:p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Reviews</h3>
          <p className="text-xs text-gray-500 mt-1">{reviews.length} Ratings & Reviews</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(averageRating)) ? "fill-current" : ""}`} />
                ))}
              </div>
              <span className="text-[10px] text-fk-green font-semibold flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> 100% Certified
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Write review */}
      {checkingEligibility ? (
        <div className="text-xs text-gray-400 py-2">Verifying order status...</div>
      ) : canReview ? (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 border border-gray-200 space-y-3 rounded-sm">
          <p className="text-xs font-bold text-gray-800">{editingId ? "Edit your review" : "Rate this product"}</p>
          
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-amber-400 focus:outline-none"
              >
                <Star className={`w-6 h-6 hover:scale-110 transition-transform ${rating >= star ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>

          <div>
            <textarea
              required
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your experience with this jewellery set..."
              className="input-field text-sm resize-none bg-white"
            />
          </div>

          {/* Image upload section */}
          <div className="flex items-center gap-3">
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
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {imageUrl ? "Change Photo" : "Add Photo"}
            </button>
            {imageUrl && (
              <div className="relative w-12 h-12 border border-gray-200 rounded overflow-hidden">
                <img src={imageUrl} alt="Review upload" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setImageUrl("")}
                  className="absolute top-0 right-0 p-0.5 bg-black/75 text-white rounded-bl"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-fk-blue hover:bg-fk-blue-dark text-white font-bold px-4 py-2 text-xs uppercase tracking-wider rounded-sm"
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
                className="btn-secondary py-2 px-4 text-xs uppercase tracking-wider rounded-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 border border-dashed border-gray-200 rounded-sm text-center">
          <p className="text-xs text-gray-500 font-medium">
            🔒 Only customers who purchased this product and got it **Delivered** can write reviews.
          </p>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-xs text-gray-400">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">No reviews yet. Be the first to write one!</p>
          </div>
        ) : (
          reviews.map((rev) => {
            const myReview = isMyReview(rev);
            return (
              <div key={rev.id} className="border-b border-gray-100 pb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-fk-blue-light text-fk-blue rounded-full flex items-center justify-center">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-800">{rev.userName}</p>
                        {myReview && <span className="bg-fk-blue/10 text-fk-blue text-[9px] px-1 rounded-sm font-semibold">You</span>}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? "fill-current" : ""}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {myReview && (
                      <button
                        onClick={() => handleEditInit(rev)}
                        className="p-1 text-gray-400 hover:text-fk-blue transition-colors"
                        title="Edit Review"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "Just now"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed pl-9">{rev.comment}</p>
                
                {rev.imageUrl && (
                  <div className="pl-9 mt-1.5">
                    <div className="relative w-20 h-24 border border-gray-100 rounded overflow-hidden shadow-sm bg-gray-50">
                      <a href={rev.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={rev.imageUrl} alt="Review upload" className="w-full h-full object-cover hover:scale-105 transition-transform" />
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
