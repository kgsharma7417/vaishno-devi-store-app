import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "../components/shared/Toast";

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { addToast } = useToast();

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("radhe_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("radhe_wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const isWishlisted = (productId) =>
    wishlistItems.some((item) => item.id === productId);

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) {
      setWishlistItems((prev) => prev.filter((item) => item.id !== product.id));
      addToast({ type: "info", message: `Removed from wishlist` });
    } else {
      setWishlistItems((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.productName,
          image: product.imageUrls?.[0],
          price: product.finalPrice,
          mrp: product.mrp,
          discount: product.discountPercentage,
          category: product.category,
          savedAt: Date.now(),
        },
      ]);
      addToast({ type: "success", message: `❤️ Added to wishlist!` });
    }
  };

  const clearWishlist = () => setWishlistItems([]);

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, isWishlisted, toggleWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
