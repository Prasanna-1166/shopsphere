# 🚀 ShopSphere — Deployment & Production Guide

ShopSphere is designed for clean, zero-lockin cloud deployment on modern hosting platforms (e.g. Render, Railway, Fly.io, Vercel, Netlify) paired with **Neon Serverless PostgreSQL**.

---

## 1. Cloud Architecture Overview

```text
                                 +-----------------------------------+
                                 |         CUSTOM DOMAIN DNS         |
                                 +-----------------+-----------------+
                                                   |
             +-------------------------------------+-------------------------------------+
             |                                     |                                     |
             v                                     v                                     v
+--------------------------+          +--------------------------+          +--------------------------+
|  shop.yourdomain.com     |          |  admin.yourdomain.com    |          |   api.yourdomain.com     |
|  (Customer Static Site)  |          |  (Admin Static Site)     |          |   (Express Node Service) |
+--------------------------+          +--------------------------+          +------------+-------------+
                                                                                         |
                                                                                         | DATABASE_URL
                                                                                         v
                                                                            +--------------------------+
                                                                            |     NEON POSTGRESQL      |
                                                                            |  (ep-xyz.neon.tech/db)   |
                                                                            +--------------------------+
```

---

## 2. Environment Variables Specification

Configure the following environment variables on your backend service:

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Web service listen port | `10000` (Render assigns automatically) |
| `DATABASE_URL` | Neon PostgreSQL connection string (Pooled) | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | 32+ character random secret string | `prod_jwt_secret_shopsphere_min_32_characters_long` |
| `COOKIE_SECRET` | 32+ character cookie parser secret | `prod_cookie_secret_key_shopsphere_32_chars` |
| `CUSTOMER_ORIGIN` | Allowed Customer Frontend URL | `https://shop.yourdomain.com` |
| `ADMIN_ORIGIN` | Allowed Admin Frontend URL | `https://admin.yourdomain.com` |
| `PAYMENT_PROVIDER` | Payment Gateway Provider | `MOCK` (or `STRIPE` / `RAZORPAY`) |

On Frontend Static Sites (`apps/customer-web` & `apps/admin-web`):
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL pointing to backend API | `https://api.yourdomain.com/api` |

---

## 3. Step-by-Step Render Deployment

1. **Create Neon Database**:
   - Go to [neon.tech](https://neon.tech), create a new PostgreSQL project named `shopsphere`.
   - Copy the Connection String from the dashboard.

2. **Deploy Backend (Render Web Service)**:
   - Create a new **Web Service** connected to your repository.
   - Root Directory: `backend` (or use workspace).
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Add Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `CUSTOMER_ORIGIN`, `ADMIN_ORIGIN`, `NODE_ENV=production`.
   - Run initial migrations/seed: Run `npx prisma db push && node prisma/seed.js` from Render shell or build command.

3. **Deploy Customer Web (Render Static Site / Vercel)**:
   - Build Command: `npm --prefix apps/customer-web install && npm --prefix apps/customer-web run build`
   - Publish Directory: `apps/customer-web/dist`
   - Environment Variable: `VITE_API_BASE_URL=https://<your-backend-url>/api`

4. **Deploy Admin Web (Render Static Site / Vercel)**:
   - Build Command: `npm --prefix apps/admin-web install && npm --prefix apps/admin-web run build`
   - Publish Directory: `apps/admin-web/dist`
   - Environment Variable: `VITE_API_BASE_URL=https://<your-backend-url>/api`
