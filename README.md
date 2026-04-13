<div align="center">
  <img src="https://img.icons8.com/color/120/000000/shopping-cart--v1.png" alt="MandviCart Logo"/>
  <h1>🛒 MandviCart</h1>
  <p><strong>A Next-Generation, Real-Time Multi-Vendor eCommerce Platform</strong></p>

  [![React](https://img.shields.io/badge/React-19.0-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-success.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.IO-Real%20Time-black.svg?style=flat&logo=socketdotio)](https://socket.io/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-0ED7B5.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
</div>

<br />

MandviCart is a deeply architected **MERN Stack** grocery and eCommerce platform bridging the gap between Customers, Vendors, and Delivery Riders. Leveraging a complex **5-Tier Role System** with **Real-Time GPS Tracking** and dynamic **Financial Ledger splits**, this platform simulates a production-grade enterprise application.

---

## 🌟 Platform Highlights
- **Real-Time Logistics Engine:** Live order tracking, rider driver map synchronization, and real-time socket emitting.
- **Airtight Financial Engine:** Fully calculates commissions, platform fees, delivery splits, and securely manages automated backend payout ledgers between sellers and riders.
- **Complex Role Hierarchy:** Dedicated workspaces and dashboards with protected routing for Guests, Customers, Sellers, Delivery Riders, Admins, and SuperAdmins.
- **Vendor Product Pipeline:** Zero-trust system where Seller-created products drop into a queue for Admin approval before going live on the marketplace.
- **Modern Immersive UI:** Framer Motion, GSAP, and Lottie integrations for silky-smooth cart animations and page transitions.

---

## 👥 Multi-Role Ecosystem

### 🛒 1. Customer Context
- Intelligent persistent cart system tied to database states or local guest state.
- Multiple Address management with fallback structures for backward compatibility.
- Interactive cart UI with real-time dynamic Free Delivery thresholds driven from the backend.
- Full checkout gateways and live tracking map interfaces.

### 🏪 2. Seller Context
- Dedicated Seller Dashboard for managing active stock, orders, and total earnings payouts.
- Product creation with detailed Variant & Size options (e.g., 500g vs 1kg).
- Strict OTP handoff systems—Sellers generate a secure OTP when releasing the package to a Rider.

### 🛵 3. Delivery Rider Context
- Rider Dispatch Map UI showing "Available Jobs" around their location.
- Live GPS polling pushes directly via Socket.io to the customer's active tracking screen.
- Final "Delivery OTP" validation required to confirm drop-off and trigger wallet payments.

### 👑 4. Admin & SuperAdmin Context
- Product Approval Dashboard: Enforce quality control on new vendor submissions.
- SuperAdmin Ledger: Adjust platform commission metrics (`platformFeePercent`, `freeDeliveryThreshold`) on-the-fly globally.
- Ban configurations, Rider recruitment oversight, and complete financial auditing.

---

## 🏗️ Technology Stack

| Domain | Technology / Tools |
| :--- | :--- |
| **Frontend UI** | React.js (Vite), TailwindCSS, GSAP, Lottie React |
| **State & Auth** | Context API, Axios Interceptors, Clerk Auth Integrations |
| **Backend Core** | Node.js, Express.js (Modular REST APIs) |
| **Database** | MongoDB & Mongoose Schema Mapping |
| **Real-Time Processing**| Socket.IO, GPS Coordinate translation (Leaflet APIs) |
| **Media Hosting** | Cloudinary integration for product arrays and profiles |

---

## 🚀 Installation & Local Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/ParthDevOp/MandviCart.git
cd MandviCart
```

### 2. Environment Configuration (⚠️ REQUIRED)
> **SECURITY NOTICE:** Dedicated `.env` files are intentionally excluded from this repository. MandviCart handles dynamic commission splits and requires secure credentialing to operate locally.





### 3. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*Wait for the `✅ MongoDB Connected` and `🚀 Real-Time Server running` console logs.*

### 4. Start the Frontend Application
```bash
cd client
npm install
npm run dev
```

---

## 🗺️ High-Level Directory Overview

```text
MandviCart/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Global & Role-agnostic components
│   │   ├── context/            # AppContext.jsx (Core Global State)
│   │   ├── pages/
│   │   │   ├── admin/          # Protected Admin Overviews
│   │   │   ├── rider/          # Protected Rider Maps & Wallets
│   │   │   ├── seller/         # Protected Seller Tools
│   │   │   └── superadmin/     # System Configuration Dashboards
│
├── server/                     # Express.js Backend
│   ├── configs/                # DB & Cloudinary Configuration
│   ├── controllers/            # Deep Logic (Ledgers, Tracking, Flow)
│   ├── models/                 # Mongoose Schemas (User, Product, SystemSetting)
│   ├── routes/                 # RESTful Endpoints
│   └── server.js               # Core Entry & Socket.IO initialization
```

---

## 🔒 Security Posture
- **Financial Validation:** Client-side cart subtotals are completely discarded during checkout. The API autonomously calculates order values by fetching hardened `offerPrice` attributes directly from the database mapping to prevent spoofing.
- **Route Fencing:** JWT-backed route guards violently redirect `Customers` attempting to inject into `Staff` paths, and vice-versa.
- **Data Encapsulation:** Mongoose `minimize: false` prevents schema data loss, ensuring deterministic payout structures. 

---

## 🤝 Contribution & License

**Author:** [Parth Shah](https://github.com/ParthDevOp)

Contributions to improve optimizations, microservices extraction, or UI polish are welcome! Please branch from `main` and execute a Pull Request.

**License:** MIT License

*Prepared and built for performance, scale, and enterprise-level logistics workflows.*
