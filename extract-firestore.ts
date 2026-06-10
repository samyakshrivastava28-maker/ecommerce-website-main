import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = {
  projectId: "gen-lang-client-0984598055",
  appId: "1:873457968893:web:91ab232ec662436058c094",
  apiKey: "AIzaSyCspo0oTlrnB7khnE9Ix6bvH90yawS1S-U",
  authDomain: "gen-lang-client-0984598055.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-71b9a01d-ee68-4417-8649-179522871bea");

async function main() {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    const exportedData = {
      store_details: {
        name: "Prime Elite Store",
        tagline: "Premium Watches & Smart Devices",
        description: "Ultra-premium futuristic luxury ecommerce store for luxury electronics, smart watches, and audio devices.",
        url: "https://primeelitestore02.netlify.app",
        contact: {
          phone: "6263629683",
          whatsapp: "https://wa.me/916263629683",
          instagram: "https://www.instagram.com/prime_elite_store/",
          instagram_username: "@prime_elite_store",
          email: "prime.elitestore02@gmail.com"
        },
        shipping_and_delivery_policy: {
          coverage: "Worldwide delivery available",
          payment_terms: "50% advance payment is required for order dispatch. The remaining 50% is paid upon door-step delivery.",
          order_processing: "Once an order is placed, our administration team manually reviews and approves it. A confirmation email is sent when the order is officially approved and dispatched."
        }
      },
      products: products.map(p => ({
        id: p.id,
        name: p.productName || 'N/A',
        description: p.description || p.productDescription || 'N/A',
        category: p.category || 'N/A',
        link: `https://primeelitestore02.netlify.app/products/${p.id}`,
        images: p.images || (p.image ? [p.image] : []),
        price: p.price != null ? p.price : (p.basePrice != null ? p.basePrice : 'N/A'),
        advanceBookingPolicy: p.advanceBooking || "50% upfront payment required",
        specs: p.specs || p.specifications || {},
        features: p.features || [],
        variants: Array.isArray(p.variants) ? p.variants.map((v: any) => ({
          name: v.color || v.name || 'N/A',
          image: v.image || v.imageUrl || 'N/A',
          price: v.price || null
        })) : []
      }))
    };

    fs.writeFileSync('product_export.json', JSON.stringify(exportedData, null, 2));
    console.log("Successfully extracted to product_export.json");
    process.exit(0);
  } catch (err) {
    console.error("Error reading from Firestore:", err);
    process.exit(1);
  }
}

main();
