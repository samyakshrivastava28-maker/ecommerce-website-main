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

  app.use(cors({ origin: ['https://testingprime.netlify.app', 'http://localhost:5173', 'http://localhost:3000'], credentials: true }));
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
