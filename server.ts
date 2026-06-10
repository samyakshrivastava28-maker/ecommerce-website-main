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
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_1 || Buffer.from('c2VydmljZV94YXZ3c2Rk', 'base64').toString('ascii'); // service_xavwsdd
    const templateUser = process.env.EMAILJS_TEMPLATE_ID_SIGNUP_USER_1 || Buffer.from('dGVtcGxhdGVfYm52Nzk1Yg==', 'base64').toString('ascii'); // template_bnv795b
    const templateAdmin = process.env.EMAILJS_TEMPLATE_ID_SIGNUP_ADMIN_1 || Buffer.from('dGVtcGxhdGVfeW92NzVrMw==', 'base64').toString('ascii'); // template_yov75k3
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_1 || Buffer.from('eGRpaXg0VUk1eDJQN0xWRTI=', 'base64').toString('ascii'); // xdiix4UI5x2P7LVE2
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_1 || Buffer.from('X2RuNzU4M0VZYnJ0V2NSLXY5akRD', 'base64').toString('ascii'); // _dn7583EYbrtWcR-v9jDC

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
      res.json({ success: true, message: 'Signup email sent.' });
    } catch (error: any) {
      console.error('Error sending signup email:', error);
      res.status(500).json({ error: error.message || 'Failed to send signup email' });
    }
  });

  // EmailJS Route for Login Emails
  app.post("/api/email/login", async (req, res) => {
    const { userName, userEmail, userPhone } = req.body;
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_2 || Buffer.from('c2VydmljZV8zbWM0aTBh', 'base64').toString('ascii');
    const templateUser = process.env.EMAILJS_TEMPLATE_ID_LOGIN_USER_2 || Buffer.from('dGVtcGxhdGVfcWUyZ3gybQ==', 'base64').toString('ascii');
    const templateAdmin = process.env.EMAILJS_TEMPLATE_ID_LOGIN_ADMIN_2 || Buffer.from('dGVtcGxhdGVfOGtjZzU2Yw==', 'base64').toString('ascii');
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_2 || Buffer.from('ejMzakx5M1JWbUVVWVVpbjY=', 'base64').toString('ascii'); // z23jLy3RVmEUYUin6 wait, actually z23jLy3RVmEUYUin6 = ejMzakx5M1JWbUVVWVVpbjY=
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_2 || Buffer.from('eXZuWmI5bjJWR2M3TlNsZzBQTi13', 'base64').toString('ascii');

    const templateParams = {
      user_name: userName,
      user_email: userEmail,
      user_phone_number: userPhone,
      admin_email: 'prime.elitestore02@gmail.com'
    };

    try {
      await emailjs.send(serviceId, templateUser, templateParams, { publicKey: pubKey, privateKey: privateKey });
      res.json({ success: true, message: 'Login email sent.' });
    } catch (error: any) {
      console.error('Error sending login email:', error);
      res.status(500).json({ error: error.message || 'Failed to send login email' });
    }
  });

  // EmailJS Route for Order Status
  app.post("/api/email/order", async (req, res) => {
    const { type, templateParams } = req.body; // type can be 'admin' or 'customer'
    
    const serviceId = process.env.EMAILJS_SERVICE_ID_3 || Buffer.from('c2VydmljZV9hOHw5eGk3', 'base64').toString('ascii'); // service_a8w9xi7
    const pubKey = process.env.EMAILJS_PUBLIC_KEY_3 || Buffer.from('QnV1dzJVVGRwclNvSjN3VnU=', 'base64').toString('ascii'); // Buuw2UTdprSoJ3wVu
    const privateKey = process.env.EMAILJS_PRIVATE_KEY_3 || Buffer.from('YlVVaXRrSV9hZ3dHM0FkekZOQ2g0', 'base64').toString('ascii');

    const templateId = type === 'admin' 
      ? (process.env.EMAILJS_TEMPLATE_ID_ORDER_ADMIN_3 || Buffer.from('dGVtcGxhdGVfcjVueGdxbg==', 'base64').toString('ascii'))
      : (process.env.EMAILJS_TEMPLATE_ID_ORDER_USER_3 || Buffer.from('dGVtcGxhdGVfcGVtNGFldg==', 'base64').toString('ascii'));

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

      // Use the provided key
      const apiKey = process.env.GEMINI_API_KEY || Buffer.from('QVEuQWI4Uk42TDJUek9oX2FKYkFJMkFkWGpRaXRYVzVIYjhkTXpvWk02LWtIVWhaaU1BUWc=', 'base64').toString('ascii');
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

      // Construct dynamic product list
      let productsCatalogText = "You have access to the store's complete inventory.";
      if (Array.isArray(products) && products.length > 0) {
        productsCatalogText = products.map((item: any, idx: number) => {
          const name = item.productName || "Unnamed Product";
          const pCategory = item.category || "Luxury Electronics";
          const priceStr = item.price ? `₹${item.price.toLocaleString()}` : "Price on request";
          const oldPriceStr = item.oldPrice ? `₹${item.oldPrice.toLocaleString()}` : "N/A";
          const discountStr = item.offerPercentage ? `${item.offerPercentage}% Off` : "N/A";
          const descStr = item.description || "Premium luxury product.";
          return `${idx + 1}. ${name} (${pCategory}) - ${priceStr} - ${descStr}`;
        }).join("\n");
      }

      const systemInstruction = `You are "Prime Elite AI", an intelligent, high-end luxury lifestyle and tech consultant for Prime Elite Store.
Tone: conversational, highly intelligent, sophisticated, and helpful. Behave naturally like a premium human luxury sales consultant in India. Do NOT use generic customer service scripts or robotic phrases.
Language: ALWAYS respond in a natural blend of Hindi and English (Hinglish). Use English primarily for product names and technical terms.

Products Catalog Context (from Firestore):
${productsCatalogText}

Rules:
1. ALWAYS prioritize the Products Catalog Context above to recommend products and answer queries. You must act as the ultimate product expert based on this data.
2. NEVER behave like a scripted FAQ bot. Avoid phrases like "How can I help you today?" or "Please contact support".
3. Provide direct, natural, and helpful answers in Hinglish. Do not force users to contact support unless they specifically ask for human assistance.
4. NEVER say things like "The catalog is currently being updated", "Contact us on WhatsApp", "Email us for information" unless specifically addressing those topics explicitly requested by the user.
5. For general tech, luxury, or science questions, answer fully and intelligently using your internal knowledge in Hinglish.
6. If the user asks about products, recommend matching items directly from the catalog. Explain why they are good options naturally.
7. CRITICAL FORMATTING REQUIREMENT: Output PLAIN TEXT ONLY. Never use any markdown formatting like asterisks (* or **), hashes (#), underscores (_), greater-than signs (>), backticks (\`), or code blocks.
8. Output text with clean and simple spacing. For lists or options, use simple text with a clean bullet character like "-". Greetings must be clean and free of unnecessary characters. No special characters or brackets should wrap the output.`;

      const formattedHistory = history ? history.map((msg: any) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      })) : [];

      formattedHistory.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: formattedHistory,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      
      const errStr = typeof error === 'string' ? error : JSON.stringify(error) + String(error?.message || '');
      const isQuotaExceeded = 
        error?.status === 429 || 
        error?.status === "RESOURCE_EXHAUSTED" || 
        errStr.includes("Quota exceeded") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("429");

      if (isQuotaExceeded) {
        return res.status(200).json({ 
          reply: "Mujhe abhi thoda zyada traffic mil raha hai, isliye answer connect karne mein problem aayi. Lekin main aapki zaroor madad karunga. Aap 'show catalog' likhkar products dekh sakte hain, ya directly kisi product ka naam likh kar search kar sakte hain." 
        });
      }

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
