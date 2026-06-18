import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "../components/shared/Toast";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { addToast } = useToast();
  
  // Initialize from LocalStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("bangleStoreCart");
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Error parsing cart data", e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem("bangleStoreCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
    );

    if (existingItemIndex >= 0) {
      addToast({ type: "success", message: `Updated quantity for ${product.productName}` });
    } else {
      addToast({ type: "success", message: `Added ${product.productName} to cart` });
    }

    setCartItems(prev => {
      // Check if item with same size and color already exists
      const existing = prev.findIndex(
        item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
      );

      if (existing >= 0) {
        // Update quantity
        const newItems = [...prev];
        newItems[existing].quantity += quantity;
        return newItems;
      } else {
        // Add new item
        return [...prev, {
          id: product.id,
          name: product.productName,
          image: product.imageUrls[0],
          price: product.finalPrice,
          mrp: product.mrp,
          size: selectedSize,
          color: selectedColor,
          quantity: quantity
        }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id, size, color) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size && item.color === color)));
  };

  const updateQuantity = (id, size, color, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    setCartItems(prev => prev.map(item => 
      (item.id === id && item.size === size && item.color === color) 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
