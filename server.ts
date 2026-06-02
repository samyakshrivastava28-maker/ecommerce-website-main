import express from "express";
import cors from "cors";
import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Unified Express backend configuration integrated with Vite in development
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Basic health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Unified fullstack server is up and running!" });
  });

  // EmailJS Route for Signup Emails
  app.post("/api/email/signup", async (req, res) => {
    const { userName, userEmail, userPhone, signupDate } = req.body;
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_1 || 'service_xavwsdd';
    const templateUser = process.env.EMAILJS_TEMPLATE_ID_SIGNUP_USER_1 || 'template_bnv795b';
    const templateAdmin = process.env.EMAILJS_TEMPLATE_ID_SIGNUP_ADMIN_1 || 'template_yov75k3';
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_1 || 'xdiix4UI5x2P7LVE2';
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_1 || '_dn7583EYbrtWcR-v9jDC';

    const templateParams = {
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      user_phone_number: userPhone,
      signup_date: signupDate || new Date().toISOString(),
      admin_email: 'prime.elitestore02@gmail.com'
    };

    try {
      await emailjs.send(serviceId, templateUser, templateParams, { publicKey: pubKey, privateKey: privateKey });
      await emailjs.send(serviceId, templateAdmin, templateParams, { publicKey: pubKey, privateKey: privateKey });
      res.json({ success: true, message: 'Signup emails sent.' });
    } catch (error: any) {
      console.error('Error sending signup email:', error);
      res.status(500).json({ error: error.message || 'Failed to send signup emails' });
    }
  });

  // EmailJS Route for Login Emails
  app.post("/api/email/login", async (req, res) => {
    const { userName, userEmail, userPhone } = req.body;
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_2 || 'service_3mc4i0a';
    const templateUser = process.env.EMAILJS_TEMPLATE_ID_LOGIN_USER_2 || 'template_qe2gx2m';
    const templateAdmin = process.env.EMAILJS_TEMPLATE_ID_LOGIN_ADMIN_2 || 'template_8kcg56c';
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_2 || 'z23jLy3RVmEUYUin6';
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_2 || 'yvnZb9n2VGc7NSlg0PN-w';

    const templateParams = {
      user_name: userName,
      user_email: userEmail,
      user_phone_number: userPhone,
      admin_email: 'prime.elitestore02@gmail.com'
    };

    try {
      await emailjs.send(serviceId, templateUser, templateParams, { publicKey: pubKey, privateKey: privateKey });
      await emailjs.send(serviceId, templateAdmin, templateParams, { publicKey: pubKey, privateKey: privateKey });
      res.json({ success: true, message: 'Login emails sent.' });
    } catch (error: any) {
      console.error('Error sending login email:', error);
      res.status(500).json({ error: error.message || 'Failed to send login emails' });
    }
  });

  // EmailJS Route for Order Status
  app.post("/api/email/order", async (req, res) => {
    const { type, templateParams } = req.body; // type can be 'admin' or 'customer'
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_3 || 'service_a8w9xi7';
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_3 || 'Buuw2UTdprSoJ3wVu';
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_3 || 'bUUitkI_agwG3AdzFNCh4';

    const templateId = type === 'admin' 
      ? (process.env.EMAILJS_TEMPLATE_ID_ORDER_ADMIN_3 || 'template_r5nxgqn')
      : (process.env.EMAILJS_TEMPLATE_ID_ORDER_USER_3 || 'template_pem4aev');

    try {
      await emailjs.send(serviceId, templateId, templateParams, { publicKey: pubKey, privateKey: privateKey });
      res.json({ success: true, message: 'Order email sent.' });
    } catch (error: any) {
      console.error(`Error sending ${type} order email:`, error);
      res.status(500).json({ error: error.message || 'Failed to send order email' });
    }
  });

  // API for Gemini Support Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, products } = req.body;
      const { GoogleGenAI } = await import("@google/genai");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct dynamic product list from admin/website products passed in or loaded
      let productsCatalogText = "The store catalog is currently being updated by the administrator.";
      if (Array.isArray(products) && products.length > 0) {
        productsCatalogText = products.map((item: any, idx: number) => {
          const name = item.productName || "Unnamed Product";
          const pCategory = item.category || "Luxury Electronics";
          const priceStr = item.price ? `₹${item.price.toLocaleString()}` : "Contact Support";
          const oldPriceStr = item.oldPrice ? `₹${item.oldPrice.toLocaleString()}` : "N/A";
          const discountStr = item.offerPercentage ? `${item.offerPercentage}% Off` : "N/A";
          const badgeStr = item.badge || "Standard Edition";
          const minQtyStr = item.moq || 2;
          const advanceStr = item.advanceBooking || "50% upfront booking payment required";
          const descStr = item.description || "Premium luxury product.";
          
          let variantsInfo = "Standard";
          if (item.variants && item.variants.length > 0) {
            variantsInfo = item.variants.map((v: any) => v.color || "Default").join(", ");
          } else if (item.colors && item.colors.length > 0) {
            variantsInfo = item.colors.join(", ");
          }

          return `${idx + 1}. Product Name: ${name}
   - Category: ${pCategory}
   - Price: ${priceStr} (Original Price: ${oldPriceStr} | Offer: ${discountStr})
   - Badge/Label: ${badgeStr}
   - Minimum Order Quantity (MOQ): ${minQtyStr}
   - Advance Booking Requirement: ${advanceStr}
   - Description: ${descStr}
   - Available Variants/Colors: ${variantsInfo}`;
        }).join("\n\n");
      }

      const systemInstruction = `You are "Prime Elite Store AI Assistant", a highly professional, polite, and luxury-oriented support assistant for "Prime Elite Store" (an elite collection of luxury watches and hardware accessories).

Store Policy & Critical Info:
- Minimum Order Quantity (MOQ): We strictly enforce a Minimum Order Quantity (MOQ) as specified on each product (usually 2 products across the catalog unless stated otherwise).
- Advance Booking Policy: To ensure premium processing, we require 50% advance booking payment upfront before an order is processed, and the remaining 50% is paid post-processing/dispatch.
- Global Expedited Shipping: Fast global expedited shipping is offered on all premium orders.
- Manual Ordering & Support: For direct manual billing, custom order updates, or inquiries, customers can reached us via WhatsApp at 6263629683.

Product Catalog Information (Website Dynamic Products added by Admin):
${productsCatalogText}

Response Guidelines:
- Store Questions: If a user asks about available items, product descriptions, pricing, discount offers, variants, or store shipping/booking policies, answer them accurately based strictly on the Dynamic Products list above.
- Outside / General Questions: If a user asks any question outside of the store (e.g., general knowledge, helping with code, explaining facts, writing, or recipes), you must act as a fully capable, helpful AI assistant and answer them clearly and politely. Do NOT decline or say you can only talk about the store.
- Tone: Keep responses warm, sophisticated, professional, and concise. Use clean markdown formatting (like bold text or bullet points) to keep responses highly readable in a chat widget.`;

      const formattedHistory = history ? history.map((msg: any) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      })) : [];

      formattedHistory.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedHistory,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response." });
    }
  });

  // Serve static client assets or integrate Vite dev-middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting dynamic Vite dev-server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving static content from build directory (production mode)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] listen started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Startup failed:", err);
});
