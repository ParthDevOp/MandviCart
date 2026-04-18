import "dotenv/config"; 
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// 🟢 NEW: Imports for Real-Time WebSockets
import { createServer } from "http";
import { Server } from "socket.io";

// Enterprise Middlewares
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
// 🟢 REMOVED: express-rate-limit has been removed to allow unlimited requests

// Import Configs
import connectCloudinary from "./configs/cloudinary.js"; 

// Route Imports
import webhookRouter from "./routes/webhookRoute.js"; 
import addressRouter from "./routes/addressRoute.js";
import adminRouter from "./routes/adminRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import productRouter from "./routes/productRoute.js";
import riderRouter from "./routes/riderRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import settingsRouter from "./routes/settingsRoutes.js"; 
import userRouter from "./routes/userRoute.js";
import contentRouter from "./routes/contentRoute.js";
import cmsRouter from "./routes/cmsRoute.js"; 
import chatRouter from "./routes/chatRoute.js"; 
import payoutRouter from "./routes/payoutRoute.js";

// Middleware Imports
import { checkMaintenance } from "./middlewares/authRole.js"; 

const app = express();
const PORT = process.env.PORT || 4000;

// 🟢 Create HTTP Server and bind Socket.io to it
const httpServer = createServer(app);

// 🟢 FIX: Added your Vercel frontend URL to the allowed origins!
const allowedOrigins = [
  "http://localhost:5173", 
  "https://mandvi-cart.vercel.app", 
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 🟢 Attach IO to app so controllers can trigger real-time Admin events
app.set("io", io);

// ==========================================
// 🚀 REAL-TIME TRACKING ENGINE (SOCKET.IO)
// ==========================================
io.on("connection", (socket) => {
    console.log(`🔌 Live Connection Established: ${socket.id}`);

    // 1. Both Customer & Rider join a private "Order Room"
    socket.on("join_order", (orderId) => {
        socket.join(orderId);
        console.log(`📦 User joined Tracking Room: ${orderId}`);
    });

    // 2. Rider broadcasts their live GPS coordinates
    socket.on("rider_location_update", (data) => {
        socket.to(data.orderId).emit("live_location", data);
    });

    // 3. Register global user for generic notifications (Seller/User)
    socket.on("register_user", (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`👤 User joined Global Notification Room: ${userId}`);
        }
    });

    // 4. Broker Rider Arrivals to the destination party
    socket.on("rider_arrived", ({ orderId, targetUserId, type }) => {
        console.log(`🎯 Rider Arrived! Notifying ${type}: ${targetUserId} for order ${orderId}`);
        socket.to(targetUserId).emit("push_notification", 
            type === "pickup" 
                ? `🚲 Your rider has arrived at your store for order #${orderId.slice(-6).toUpperCase()}`
                : `📦 Your delivery has arrived! Your rider is outside.`
        );
    });

    socket.on("disconnect", () => {
        console.log(`🔌 Connection Dropped: ${socket.id}`);
    });
});

const initializeServer = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    await connectCloudinary();
    console.log(`✅ Cloudinary Ready`);

    app.use(helmet()); 
    app.use(compression()); 
    
    if (process.env.NODE_ENV !== 'production') {
        app.use(morgan('dev')); 
    }

    app.use(cors({
      origin: allowedOrigins, 
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    }));

    app.use("/api/webhooks", webhookRouter); 

    app.use(express.json({ limit: '2mb' })); 
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    app.use(cookieParser());

    // 🟢 RATE LIMITER COMPLETELY REMOVED HERE 
    // You now have unlimited API requests for development!

    app.use(checkMaintenance);

    // API ROUTES
    app.use("/api/address", addressRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/cart", cartRouter);
    app.use("/api/order", orderRouter);
    app.use("/api/product", productRouter);
    app.use("/api/rider", riderRouter);
    app.use("/api/seller", sellerRouter);
    app.use("/api/settings", settingsRouter); 
    app.use("/api/user", userRouter);        
    app.use("/api/content", contentRouter);  
    app.use("/api/cms", cmsRouter);          
    app.use("/api/chat", chatRouter);        
    app.use("/api/payout", payoutRouter);    

    app.get("/", (req, res) => {
      res.status(200).json({ success: true, message: "🌿 GreenCart Core API is active." });
    });

    app.use((err, req, res, next) => {
      console.error(`[ERROR]: ${err.message}`);
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        success: false,
        message: err.message,
      });
    });

    // Listen using the HTTP server, NOT the Express app, so Sockets work!
    httpServer.listen(PORT, () => {
      console.log(`🚀 Real-Time Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error(`❌ FATAL: Server Initialization Failed: ${error.message}`);
    process.exit(1);
  }
};

initializeServer();