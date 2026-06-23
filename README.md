# 🛍️ Vaishno Devi Store (Bangle Store Web App)

A modern, fast, and responsive e-commerce web application built to provide a seamless shopping experience for customers. The platform features an intuitive UI, real-time cart management, progressive web app (PWA) capabilities, and secure backend integration.

## ✨ Features

- **🛍️ Seamless Shopping Experience:** Browse products with "Quick View" modals for faster decision-making.
- **🛒 Dynamic Cart Management:** Real-time cart updates and state management using React Context.
- **📱 Progressive Web App (PWA):** Installable on mobile and desktop for a native-like app experience and offline fallback.
- **💬 WhatsApp Integration:** Floating WhatsApp widget for instant customer support.
- **🔍 SEO Optimized:** Custom SEO hooks for better search engine visibility.
- **📦 Order Tracking:** Dedicated pages for customers to view and track their orders.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** React Router DOM
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons & UI:** Lucide React, Canvas Confetti

### Backend & Services
- **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Firebase Admin)
- **Media Hosting:** [Cloudinary](https://cloudinary.com/)

### Tooling
- **PWA:** vite-plugin-pwa
- **Linting:** ESLint
- **Other:** PostCSS, dotenv, qrcode.react

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites
Make sure you have Node.js installed on your machine.
- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your-username/vaishno-devi-store-app.git
   ```
2. Navigate to the project directory
   ```sh
   cd vaishno-devi-store-app
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Create a `.env` file in the root directory and add your Firebase and Cloudinary credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Run the development server
   ```sh
   npm run dev
   ```

## 📂 Project Structure Highlights
- `/src/components`: Reusable UI components (Modals, Toast, WhatsAppFloat).
- `/src/contexts`: Global state management (CartContext).
- `/src/pages`: Main application routes (Home, MyOrders, NotFound).
- `/src/hooks`: Custom React hooks (useSEO).
- `/public`: Static assets and PWA service workers.

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.