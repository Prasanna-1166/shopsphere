# 🌐 ShopSphere — Architecture & System Design

## 1. Executive Summary

**ShopSphere — At the End of Your Streets** is a full-stack, portfolio-grade e-commerce system built with modern engineering principles. It utilizes a **clean modular monolith** architecture designed for maintainability, security, and effortless deployment without excessive distributed systems complexity (such as Kafka, Kubernetes, or microservices).

---

## 2. High-Level System Architecture

```text
                               +--------------------------------------------------+
                               |                 CLIENT BROWSERS                  |
                               +------------------------+-------------------------+
                                                        |
                                +-----------------------+-----------------------+
                                |                                               |
                                v                                               v
                   +--------------------------+                   +--------------------------+
                   |       CUSTOMER APP       |                   |        ADMIN APP         |
                   |   (apps/customer-web)    |                   |    (apps/admin-web)      |
                   |   React 18 + Vite 5      |                   |   React 18 + Vite 5      |
                   |   Tailwind CSS (Dark)    |                   |   Tailwind CSS (Admin)   |
                   |   Port: 5173 / CDN       |                   |   Port: 5174 / CDN       |
                   +------------+-------------+                   +-------------+------------+
                                |                                               |
                                | HTTPS Requests / httpOnly Cookies             |
                                +-----------------------+-----------------------+
                                                        |
                                                        v
                                       +---------------------------------+
                                       |      EXPRESS REST API ENGINE    |
                                       |          (backend/src)          |
                                       |                                 |
                                       |  • Helmet Security & CORS       |
                                       |  • Double-Submit CSRF Guard     |
                                       |  • JWT Cookie Authentication    |
                                       |  • Rate Limiting & IDOR Guards  |
                                       |  • Modular Routers & Services   |
                                       |  • Port: 5000 / 0.0.0.0         |
                                       +----------------+----------------+
                                                        |
                                                        | Prisma ORM (Connection Pool)
                                                        v
                                       +---------------------------------+
                                       |         NEON POSTGRESQL         |
                                       |       (Serverless Cloud DB)     |
                                       |                                 |
                                       |  • Normalized Relational Schema |
                                       |  • ACID Database Transactions   |
                                       |  • Indexed Search & Filters     |
                                       |  • Immutable Audit Ledgers      |
                                       +---------------------------------+
```

---

## 3. Component Boundaries

### 3.1 Customer Storefront (`apps/customer-web`)
* **Role**: Public commercial storefront where customers browse products, manage shopping bags, save wishlists, and execute checkouts.
* **Separation**: Absolutely no admin links, login options, or administrative control panels exist in this codebase.
* **Technology**: React 18, Vite 5, Tailwind CSS, Lucide React, React Router 6.

### 3.2 Private Admin Console (`apps/admin-web`)
* **Role**: Dedicated operational portal for Store Managers and Super Admins.
* **Capabilities**: Catalog management, validated CSV import/export, warehouse stock auditing, order fulfillment state machine workflows, customer account management, and security audit log streams.
* **Separation**: Accessible on a distinct origin with strict server-side RBAC validation.

### 3.3 Backend API Engine (`backend/src`)
* **Role**: Authoritative modular monolith exposing RESTful API endpoints.
* **Responsibilities**:
  - Authentication (JWT in httpOnly cookies, password hashing with bcrypt).
  - Business Logic (Authoritative price calculations, atomic inventory deductions, transactional rollbacks).
  - Authorization & IDOR protection.
  - Payment abstraction via `PaymentService`.
  - Database connectivity through Prisma ORM.

---

## 4. Key Design Patterns

1. **Authoritative Server Pricing**: Client requests never dictate prices or totals. All cart calculations and checkout transactions derive prices strictly from database records.
2. **Atomic Checkout Transactions**: Checkout utilizes `prisma.$transaction` to guarantee that stock deduction, order item snapshots, payment status, and cart clearing either all succeed together or rollback completely without overselling.
3. **Double-Submit Cookie CSRF Defense**: Protects cookie-authenticated mutating requests across origins.
4. **Adapter Payment Gateway**: Decouples payment processors behind a uniform `PaymentService` interface, allowing plug-and-play transitions between Mock, Stripe, and Razorpay.
