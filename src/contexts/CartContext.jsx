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
      const localData = localStorage.getItem("vaishnoStoreCart");
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Error parsing cart data", e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem("vaishnoStoreCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1, clickEvent = null) => {
    // Calculate max stock available
    const maxStock = product.sizesAndStock && selectedSize 
      ? (product.sizesAndStock[selectedSize] || 0) 
      : (product.stockQuantity !== undefined ? product.stockQuantity : 999);

    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
    );

    const currentQty = existingItemIndex >= 0 ? cartItems[existingItemIndex].quantity : 0;

    // Check if adding exceeds stock
    if (currentQty + quantity > maxStock) {
      addToast({ type: "error", message: `Only ${maxStock} item(s) available in stock!` });
      return;
    }

    // Fly-to-Cart bubble trigger animation logic
    if (clickEvent) {
      const btn = clickEvent.currentTarget || clickEvent.target;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const cartBtn = document.querySelector('header .lucide-shopping-cart') || document.querySelector('header a[href="/cart"]');
        let targetX = window.innerWidth - 60 - rect.left;
        let targetY = 20 - rect.top;

        if (cartBtn) {
          const cartRect = cartBtn.getBoundingClientRect();
          targetX = cartRect.left - rect.left;
          targetY = cartRect.top - rect.top;
        }

        const bubble = document.createElement('div');
        bubble.className = 'fly-bubble';
        bubble.style.left = `${rect.left + rect.width / 2 - 20}px`;
        bubble.style.top = `${rect.top}px`;
        bubble.style.backgroundImage = `url(${product.imageUrls?.[0] || product.image})`;
        bubble.style.setProperty('--target-x', `${targetX}px`);
        bubble.style.setProperty('--target-y', `${targetY}px`);

        document.body.appendChild(bubble);
        setTimeout(() => {
          bubble.remove();
        }, 1000);
      }
    }

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
          quantity: quantity,
          maxStock: maxStock
        }];
      }
    });

    // Soft delay to let fly-to-cart animation complete before drawer opens
    setTimeout(() => {
      setIsCartOpen(true);
    }, 800);
  };

  const removeFromCart = (id, size, color) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size && item.color === color)));
  };

  const updateQuantity = (id, size, color, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }

    const item = cartItems.find(i => i.id === id && i.size === size && i.color === color);
    if (item && item.maxStock !== undefined && newQuantity > item.maxStock) {
      addToast({ type: "error", message: `Only ${item.maxStock} item(s) available!` });
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
