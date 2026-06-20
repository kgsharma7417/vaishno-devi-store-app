import { createContext, useContext, useState, useEffect } from "react";

const RecentlyViewedContext = createContext();

export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext);
}

const MAX_ITEMS = 8;

export function RecentlyViewedProvider({ children }) {
  const [recentItems, setRecentItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("radhe_recently_viewed") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("radhe_recently_viewed", JSON.stringify(recentItems));
  }, [recentItems]);

  const addRecentlyViewed = (product) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item.id !== product.id);
      const newItem = {
        id: product.id,
        name: product.productName,
        image: product.imageUrls?.[0],
        price: product.finalPrice,
        mrp: product.mrp,
        discount: product.discountPercentage,
        category: product.category,
        viewedAt: Date.now(),
      };
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentItems, addRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}
