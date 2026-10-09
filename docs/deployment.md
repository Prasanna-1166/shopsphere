# 🚀 ShopSphere — Deployment & Production Guide

ShopSphere is designed for clean, zero-lockin cloud deployment on modern hosting platforms (e.g. Render, Railway, Fly.io, Vercel, Netlify) paired with **Neon Serverless PostgreSQL** and **Razorpay Standard Gateway**.

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
| `PORT` | Web service listen port | `10000` (Assigned automatically by host) |
| `DATABASE_URL` | Neon PostgreSQL connection string (Pooled) | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | 32+ character random secret string | `prod_jwt_secret_shopsphere_min_32_characters_long` |
| `COOKIE_SECRET` | 32+ character cookie parser secret | `prod_cookie_secret_key_shopsphere_32_chars` |
| `CUSTOMER_ORIGIN` | Allowed Customer Frontend URL | `https://shop.yourdomain.com` |
| `ADMIN_ORIGIN` | Allowed Admin Frontend URL | `https://admin.yourdomain.com` |
| `PAYMENT_PROVIDER` | Payment Gateway Provider | `RAZORPAY` (or `MOCK` for local sandbox) |
| `PAYMENT_MODE` | Payment Mode | `test` or `live` |
| `RAZORPAY_KEY_ID` | Razorpay Public Key ID | `rzp_test_...` (or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Server-side secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | Webhook secret configured on Razorpay dashboard |

On Frontend Static Sites (`apps/customer-web` & `apps/admin-web`):
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL pointing to backend API | `https://api.yourdomain.com/api` |

---

## 3. Razorpay Standard Checkout & Webhook Setup

### 3.1 Razorpay Dashboard Configuration
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings -> API Keys** and generate Key ID and Key Secret for Test/Live mode.
3. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your backend environment variables.
4. Set `PAYMENT_PROVIDER=RAZORPAY` and `PAYMENT_MODE=test` (switch to `live` when account activation is completed).

### 3.2 Webhook Setup
1. Go to **Settings -> Webhooks** in the Razorpay Dashboard.
2. Click **Add New Webhook**.
3. **Webhook URL**: `https://api.yourdomain.com/api/payments/webhook`
4. **Secret**: Enter a strong secret string and copy it into `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Save the webhook. ShopSphere will verify incoming payloads with cryptographic HMAC-SHA256 signatures against the raw request body.

---

## 4. Step-by-Step Deployment Guide

1. **Create Neon Database**:
   - Go to [neon.tech](https://neon.tech), create a new PostgreSQL project named `shopsphere`.
   - Copy the Connection String from the dashboard.

2. **Deploy Backend (e.g. Render Web Service)**:
   - Create a new **Web Service** connected to your repository.
   - Root Directory: `backend` (or use workspace).
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Add Environment Variables listed above.
   - Run initial seed: `node prisma/seed.js` to seed 106 realistic products with verified images.

3. **Deploy Customer Web (Render Static Site / Vercel)**:
   - Build Command: `npm --prefix apps/customer-web install && npm --prefix apps/customer-web run build`
   - Publish Directory: `apps/customer-web/dist`
   - Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`

4. **Deploy Admin Web (Render Static Site / Vercel)**:
   - Build Command: `npm --prefix apps/admin-web install && npm --prefix apps/admin-web run build`
   - Publish Directory: `apps/admin-web/dist`
   - Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`
