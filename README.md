# 🛒 MandviCart - Multi-Vendor Grocery Ecosystem

![MandviCart Banner](https://via.placeholder.com/1200x400/16a34a/ffffff?text=MandviCart+Multi-Vendor+Ecosystem)

Welcome to **MandviCart**, a comprehensive, full-stack, multi-vendor e-commerce platform custom-built for large-scale grocery operations. This is not just a standard storefront; it is a complex **role-based architecture** hosting five distinct portals to handle everything from platform-wide analytics and vendor payouts to real-time delivery tracking and customer shopping.

---

## 🌐 Live Demo

**Check out the live application here:** [Insert Your Live Production Link Here]

### 🧪 Portfolio Demo Mode (Test Accounts)
To make exploring the platform easier for recruiters and testers, a "Demo Credentials" panel is built directly into the Login screen. You can use the following accounts to access different dashboards without needing to sign up:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `MandviAdmin!2026` | Oversee users, orders, general products, and chat. |
| **Seller** | `seller@test.com` | `MandviSeller!2026` | Manage personal store inventory, dispatch orders. |
| **Rider** | `rider@test.com` | `MandviRider!2026` | Track active deliveries, update status, view earnings via map. |
| **Customer** | `user@test.com` | `MandviCustomer!2026` | Browse products, add to cart, checkout, view order history. |

*(Note: The Super Admin route is restricted and kept private for security management).*

---

## 🏗️ System Architecture & Roles

MandviCart is driven by a highly granular Role-Based Access Control (RBAC) system. 

1. **👑 Super Admin:** The master controller. Has exclusive access to system settings, global financial analytics, overriding user bans, detailed activity logs, and processing seller payload requests.
2. **🔵 Admin:** Platform managers. Responsible for moderating all users, tracking global orders, approving platform products, and resolving support chats.
3. **🟣 Seller:** Third-party vendors. They have a dedicated dashboard to list their products, track incoming sales, monitor their digital wallet, and request withdrawal payouts.
4. **🟠 Delivery Rider:** The logistics network. A mobile-optimized interface with live map integrations to accept available jobs, update order states (Picked up -> Delivered), and track their active delivery route.
5. **🟢 Customer:** The end users. They experience a highly optimized, animated, layout featuring cart tracking, order history, and extensive product browsing.

---

## 🚀 Tech Stack

### Frontend Client
* **Framework:** React.js (built with Vite)
* **Styling:** Tailwind CSS + custom glassmorphism utilities
* **Animations:** Framer Motion, Lottie React
* **State & Routing:** React Context API, React Router DOM
* **Charts & Visuals:** Recharts
* **Maps:** Leaflet & React-Leaflet
* **Authentication:** Clerk Auth (`@clerk/clerk-react`)

### Backend Server
* **Environment:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **Storage / Assets:** Cloudinary API
* **Security:** CORS, Environment variables configuration.

---

## ✨ Key Features

* **High-Fidelity Dashboards:** Data-heavy Recharts visualizations pulling actual database order history to calculate platform revenue, sales pacing, and vendor payouts dynamically.
* **Intelligent Routing & Auth Guards:** Custom React components (`PublicGuard`, `CustomerGuard`, `RoleGuard`) that securely trap staff in their relevant portals and prevent unauthorized switching.
* **Modern UI/UX Elements:** Global cart tracking animations, dynamic seasonal themes (e.g., Holi color modes), complex modal managers, and smooth page transition loading.
* **Rider Live Maps:** Interactive mapping allowing riders to see distance, ETA, and optimal delivery routes using Leaflet interfaces.
* **Performance Optimizations:** React lazy-loading/Suspense for chunk splitting heavily trafficked routes to ensure instant load times.

---

## 🛠️ Local Installation

If you would like to run the code locally, you will need Node.js and MongoDB installed.

### 1. Clone the repository
```bash
git clone https://github.com/ParthDevOp/MandviCart.git
cd MandviCart
```

### 2. Setup the Server Environment
1. Navigate to the `server` folder: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `server` directory and add the required variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   # Any other required keys (e.g. JWT secret if used alongside Clerk on backend)
   ```
4. Start the server: `npm start` (or `npm run dev`)

### 3. Setup the Client Environment
1. Open a new terminal and navigate to the `client` folder: `cd client`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `client` directory and add your Clerk public key:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   VITE_BACKEND_URL=http://localhost:5000
   ```
4. Start the Vite development server: `npm run dev`

---

> **Built with passion by Parth.** 
> Feel free to contact me or submit an issue if you have suggestions!
