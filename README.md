# 🌐 ShopSphere — At the End of Your Streets

> **A portfolio-grade, full-stack commercial e-commerce platform with isolated customer storefront and administrative console.**

Built with **React 18, Vite 5, Tailwind CSS, Node.js, Express.js, Prisma ORM, and PostgreSQL hosted on Neon**.

---

## 🌟 Key Highlights

* 🛍️ **Customer Storefront (`apps/customer-web`)**:
  - Contemporary dark-themed visual identity with glassmorphism and subtle micro-animations.
  - Interactive product catalog with multi-filter sidebar (categories, price sliders, in-stock availability, multi-parameter search, and sorting).
  - Multi-image interactive gallery, product specs, and deterministic related item recommendations.
  - Authoritative shopping bag with live calculations and slide-over quick bag drawer.
  - Customer wishlist with one-click move to cart.
  - Complete delivery address book manager.
  - Smooth checkout flow with simulated mock payment provider (Cards, UPI, NetBanking).
  - Visual order fulfillment timeline (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).
  - Customer self-service order cancellation with automatic warehouse stock restoration.

* 🛡️ **Private Admin Console (`apps/admin-web`)**:
  - Separate private administrative application (completely absent from customer UI).
  - Real database server-aggregated dashboard (Revenue, Orders, Low Stock Alerts, Top Products).
  - Product catalog management with image URLs, status toggles, and bulk actions.
  - Validated CSV Export and row-by-row validated CSV Import.
  - Department / Category hierarchy management with orphan product prevention.
  - Warehouse inventory control with manual adjustments and immutable transaction audit ledger.
  - Order fulfillment workflow editor with strict state machine validation.
  - Customer directory with lifetime spend calculation and account suspension toggles.
  - Business analytics (Category sales breakdown, daily revenue trends, Average Order Value).
  - Security audit log stream with JSON metadata viewer.

* 🔒 **Enterprise-Grade Security Architecture**:
  - Stateless JWT delivered in secure HTTP-only cookies.
  - Double-Submit CSRF protection on mutating requests.
  - Strict Role-Based Access Control (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`).
  - Strict Insecure Direct Object Reference (IDOR) protection across all user endpoints.
  - Zero Card Storage / Abstracted `PaymentService`.
  - Express rate limiting on authentication and checkout endpoints.
  - Parameterized Prisma queries preventing SQL Injection.

---

## 🏗️ Repository Architecture

```text
shopsphere/
├── apps/
│   ├── customer-web/      # Public Customer React + Vite Storefront (Port 5173)
│   └── admin-web/         # Private Admin React + Vite Console (Port 5174)
├── backend/               # Express REST API Server (Port 5000)
├── prisma/                # PostgreSQL Prisma Schema & Seed Script
├── docs/                  # Architecture, API, DB, Auth, Security, Deploy docs
├── .env.example           # Documented environment variables
├── render.yaml            # Render Cloud Full-Stack Deployment Blueprint
└── package.json           # Monorepo Workspace Configuration
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **PostgreSQL**: Neon Cloud Database Connection String

### 1. Install Monorepo Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template to `.env`:
```bash
cp .env.example .env
```
Fill in your Neon PostgreSQL connection string:
```env
DATABASE_URL="postgresql://username:password@ep-your-db.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="super_secret_jwt_key_32_characters_long_min"
COOKIE_SECRET="super_secret_cookie_parser_key_min_32_chars"
```

### 3. Generate Prisma Client, Run Migrations & Seed Database
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Start Development Servers Concurrently
```bash
npm run dev
```

* **Customer Web Storefront**: [http://localhost:5173](http://localhost:5173)
* **Admin Web Console**: [http://localhost:5174](http://localhost:5174)
* **Backend REST API**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔐 Demo Accounts (Pre-Seeded)

| Portal | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@shopsphere.com` | `SuperAdmin@123` | `SUPER_ADMIN` |
| **Store Manager** | `admin@shopsphere.com` | `Admin@123` | `ADMIN` |
| **Customer** | `customer@shopsphere.com` | `Customer@123` | `CUSTOMER` |
| **Customer 2** | `priya@example.com` | `Customer@123` | `CUSTOMER` |

*(Fast 1-click Auto-Fill buttons are integrated on both login pages for effortless testing!)*

---

## 🧪 Running Automated Tests

```bash
npm test
```

---

## 📚 Complete Project Documentation

* [Architecture & System Design](docs/architecture.md)
* [REST API Reference](docs/api.md)
* [Database Schema & ERD](docs/database.md)
* [Authentication & RBAC](docs/authentication.md)
* [Deployment & Custom Domains](docs/deployment.md)
* [Security & Defense-in-Depth](docs/security.md)
* [Automated Testing Strategy](docs/testing.md)

---

## 📄 License

MIT © ShopSphere Team
