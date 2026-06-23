import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { Star, Trash2, Loader2, MessageSquare, ExternalLink, Calendar, User } from "lucide-react";

export default function ReviewsPage() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReviewsAndProducts();
  }, []);

  const fetchReviewsAndProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch all products to build product metadata lookup map
      const prodSnapshot = await getDocs(collection(db, "products"));
      const productsMap = {};
      prodSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        productsMap[doc.id] = {
          name: data.productName || "Unknown Product",
          image: data.imageUrls?.[0] || null,
        };
      });

      // 2. Fetch all reviews
      const reviewsSnapshot = await getDocs(collection(db, "reviews"));
      const reviewsList = reviewsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const productInfo = productsMap[data.productId] || { name: "Product Deleted", image: null };
        return {
          id: doc.id,
          ...data,
          productName: productInfo.name,
          productImage: productInfo.image,
        };
      });

      // Sort by date desc (seconds)
      reviewsList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setReviews(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews/products:", error);
      addToast({ type: "error", message: "Failed to load reviews." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? (क्या आप वाकई इस समीक्षा को हटाना चाहते हैं?)")) return;

    setDeletingId(reviewId);
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      addToast({ type: "success", message: "Review deleted successfully." });
    } catch (error) {
      console.error("Error deleting review:", error);
      addToast({ type: "error", message: "Failed to delete review." });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800 flex items-center gap-2">
          Customer Reviews <span className="text-sm font-normal text-slate-400 font-body">(ग्राहक समीक्षाएं)</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage and review customer comments and ratings (ग्राहकों की प्रतिक्रियाएं और स्टार रेटिंग प्रबंधित करें)
        </p>
      </div>

      {/* Main Reviews Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Product (उत्पाद)</th>
                <th className="px-6 py-4 font-semibold">Customer (ग्राहक)</th>
                <th className="px-6 py-4 font-semibold text-center">Rating (स्टार)</th>
                <th className="px-6 py-4 font-semibold">Comment (टिप्पणी)</th>
                <th className="px-6 py-4 font-semibold">Date (तारीख)</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">No reviews found (कोई समीक्षा नहीं मिली)</p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product Metadata */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {rev.productImage ? (
                            <img src={rev.productImage} alt={rev.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-slate-350" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-[160px] sm:max-w-xs" title={rev.productName}>
                            {rev.productName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">ID: {rev.productId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Customer details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{rev.userName}</p>
                          <p className="text-[10px] text-slate-400">{rev.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rating stars */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-current" : "opacity-25"}`} />
                        ))}
                      </div>
                    </td>

                    {/* Comment content */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 max-w-xs sm:max-w-md whitespace-normal">
                        <p className="text-slate-700 font-medium text-xs leading-relaxed line-clamp-2" title={rev.comment}>
                          {rev.comment}
                        </p>
                        {rev.imageUrl && (
                          <a 
                            href={rev.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                          >
                            <span>View Review Photo</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Date formatted */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Just now"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        disabled={deletingId === rev.id}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Delete Review"
                      >
                        {deletingId === rev.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
