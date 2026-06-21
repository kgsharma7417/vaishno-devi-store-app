import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzc_SaBXmtrVVULw9bKT2mZpsD3JfO31c",
  authDomain: "maa-vaishno-devi-ladies-49ea5.firebaseapp.com",
  projectId: "maa-vaishno-devi-ladies-49ea5",
  storageBucket: "maa-vaishno-devi-ladies-49ea5.firebasestorage.app",
  messagingSenderId: "283680578990",
  appId: "1:283680578990:web:021f02d0a557364364fc3f",
  measurementId: "G-NVHGT73E11"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyProducts = [
  {
    productName: "Royal Rajwadi Bridal Chuda",
    description: "Stunning handcrafted red and gold bridal chuda perfect for your special day. Made with premium materials that don't lose their shine.",
    category: "Bridal Chuda",
    colors: ["Red", "Gold", "Maroon"],
    sizesAndStock: { "2.4": 10, "2.6": 5, "2.8": 2 },
    mrp: 3999,
    discountPercentage: 20,
    finalPrice: 3199,
    imageUrls: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599643478524-fb524fa0a8a7?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "",
    isFeatured: true,
  },
  {
    productName: "Elegant Kundan Bangles Set",
    description: "Set of 4 Kundan bangles, perfect for party wear. Intricate detailing with a royal finish.",
    category: "Party Wear",
    colors: ["Gold", "White"],
    sizesAndStock: { "2.2": 0, "2.4": 8, "2.6": 12 },
    mrp: 1499,
    discountPercentage: 10,
    finalPrice: 1349,
    imageUrls: [
      "https://images.unsplash.com/photo-1515562141207-7a8efbc88bda?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "",
    isFeatured: false,
  },
  {
    productName: "Daily Wear Oxidised Silver Bangles",
    description: "Lightweight oxidised silver bangles for everyday use. Goes perfectly with ethnic and western wear.",
    category: "Daily Wear",
    colors: ["Silver"],
    sizesAndStock: { "2.6": 20, "2.8": 15 },
    mrp: 599,
    discountPercentage: 0,
    finalPrice: 599,
    imageUrls: [
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "",
    isFeatured: false,
  },
  {
    productName: "Haldi Special Yellow Pearl Bangles",
    description: "Vibrant yellow thread bangles decorated with artificial pearls, made especially for Haldi ceremonies.",
    category: "Haldi Special",
    colors: ["Yellow", "Gold", "White"],
    sizesAndStock: { "2.4": 1, "2.6": 5 },
    mrp: 899,
    discountPercentage: 15,
    finalPrice: 764,
    imageUrls: [
      "https://plus.unsplash.com/premium_photo-1681276170683-70ddfbff40f1?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "",
    isFeatured: true,
  },
  {
    productName: "Premium Diamond Cut Bangles",
    description: "Shiny American diamond bangles that sparkle under any light.",
    category: "Party Wear",
    colors: ["Silver", "White"],
    sizesAndStock: { "2.4": 3, "2.6": 0 },
    mrp: 2499,
    discountPercentage: 30,
    finalPrice: 1749,
    imageUrls: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "",
    isFeatured: true,
  }
];

async function seed() {
  console.log("Seeding dummy products to Firestore...");
  for (const product of dummyProducts) {
    product.createdAt = serverTimestamp();
    product.updatedAt = serverTimestamp();
    try {
      await addDoc(collection(db, "products"), product);
      console.log(`✅ Added: ${product.productName}`);
    } catch (e) {
      console.error(`❌ Error adding ${product.productName}:`, e);
    }
  }
  console.log("Seeding complete! You can now check the website.");
  process.exit(0);
}

seed();
