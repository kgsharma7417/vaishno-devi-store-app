import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if serviceAccountKey.json exists
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: serviceAccountKey.json file not found!');
  console.log('Firebase Console -> Project Settings -> Service Accounts -> Generate new private key');
  console.log('Download the JSON file, rename it to serviceAccountKey.json and place it in this folder.');
  process.exit(1);
}

// Initialize Firebase Admin (Using Modular API for v12/v14)
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function generateSitemap() {
  console.log('🔄 Firestore se products fetch ho rahe hain...');
  
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    const categories = new Set();
    
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      products.push({ id: doc.id, ...data });
      if (data.category) {
        categories.add(data.category);
      }
    });

    console.log(`✅ ${products.length} products mile!`);
    console.log(`📁 ${categories.size} categories mili: ${Array.from(categories).join(', ')}`);

    const baseUrl = 'https://www.vaishnodevicorner.in';
    const date = new Date().toISOString().split('T')[0];

    // Core static URLs
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const staticRoutes = [
      { loc: '/', priority: '1.0', freq: 'daily' },
      { loc: '/track-order', priority: '0.8', freq: 'weekly' },
      { loc: '/my-orders', priority: '0.7', freq: 'weekly' },
      { loc: '/checkout', priority: '0.5', freq: 'monthly' }
    ];

    staticRoutes.forEach(route => {
      xml += `  <url>\n    <loc>${baseUrl}${route.loc}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${route.freq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
    });

    // Dynamic Product URLs
    products.forEach(product => {
      xml += `  <url>\n    <loc>${baseUrl}/product/${product.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    // Write to public/sitemap.xml
    const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xml);

    console.log(`🎉 sitemap.xml ready! Total URLs: ${staticRoutes.length + products.length}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fetching from Firestore:', error);
    process.exit(1);
  }
}

generateSitemap();
