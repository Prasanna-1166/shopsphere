# 📡 ShopSphere — REST API Documentation

All API responses follow a standardized JSON envelope structure:

### Success Response Format:
```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

---

## 1. System & Health Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and Neon DB latency | None |
| `GET` | `/api/auth/csrf-token` | Obtain CSRF token | None |

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer account (`{ name, email, password }`) | Public |
| `POST` | `/api/auth/login` | Customer login (`{ email, password }`) | Public |
| `POST` | `/api/auth/admin-login` | Dedicated Admin/Super Admin login (`{ email, password }`) | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently authenticated user and counts | Authenticated |

---

## 3. Product Catalog (`/api/products`)

| Method | Endpoint | Query Parameters / Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `page`, `limit` | Public |
| `GET` | `/api/products/showcase/featured` | Fetch featured, new arrivals, and flash deal products | Public |
| `GET` | `/api/products/slug/:slug` | Get full product details by unique slug | Public |
| `GET` | `/api/products/:id/related` | Fetch deterministic related products | Public |
| `GET` | `/api/products/:id` | Fetch product by ID | Public |

---

## 4. Categories (`/api/categories`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | List active categories with live product counts | Public |
| `GET` | `/api/categories/:slug` | Fetch category details by slug | Public |

---

## 5. Shopping Bag (`/api/cart`)

| Method | Endpoint | Body / Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Get authoritative cart with price and discount calculation | Customer |
| `POST` | `/api/cart/add` | `{ productId, quantity }` - Add product to bag | Customer |
| `PUT` | `/api/cart/items/:itemId` | `{ quantity }` - Update bag item quantity | Customer (IDOR Protected) |
| `DELETE`| `/api/cart/items/:itemId` | Remove item from bag | Customer (IDOR Protected) |
| `DELETE`| `/api/cart/clear` | Clear all items in customer cart | Customer |

---

## 6. Wishlist (`/api/wishlist`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | List saved wishlist products | Customer |
| `POST` | `/api/wishlist/toggle` | `{ productId }` - Add or remove product | Customer |
| `DELETE`| `/api/wishlist/:productId`| Remove product from wishlist | Customer |

---

## 7. Customer Addresses (`/api/addresses`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/addresses` | List customer delivery addresses | Customer |
| `POST` | `/api/addresses` | Create new address | Customer |
| `PUT` | `/api/addresses/:id` | Update address details | Customer (IDOR Protected) |
| `DELETE`| `/api/addresses/:id` | Delete address | Customer (IDOR Protected) |
| `PATCH` | `/api/addresses/:id/default`| Set address as primary default | Customer (IDOR Protected) |

---

## 8. Orders & Checkout (`/api/orders`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/checkout` | `{ addressId, shippingAddress, paymentMethod }` - Atomic checkout transaction | Customer |
| `GET` | `/api/orders/my-orders` | Fetch customer order history | Customer |
| `GET` | `/api/orders/:id` | Get order details and timeline | Customer (IDOR Protected) |
| `POST` | `/api/orders/:id/cancel`| Cancel order and restore warehouse stock | Customer (IDOR Protected) |

---

## 9. Admin Console Endpoints (`/api/admin`)

*All `/api/admin/*` endpoints strictly require `ADMIN` or `SUPER_ADMIN` role.*

### Dashboard & Analytics
* `GET /api/admin/dashboard/metrics` - Server aggregated revenue, orders, inventory, and recent orders.
* `GET /api/admin/analytics` - Category breakdown, 30-day trends, and AOV metrics.

### Catalog & Inventory Management
* `GET /api/admin/products` - Filtered & paginated admin products list.
* `POST /api/admin/products` - Create new product with image URLs.
* `PUT /api/admin/products/:id` - Update product details.
* `PATCH /api/admin/products/:id/toggle` - Toggle active visibility.
* `POST /api/admin/products/bulk-toggle` - Bulk activate/deactivate.
* `DELETE /api/admin/products/:id` - Safe delete / deactivate.
* `GET /api/admin/products/export/csv` - Download catalog CSV.
* `POST /api/admin/products/import/csv` - Validate and batch import CSV.
* `GET /api/admin/inventory` - Warehouse stock list & low-stock alerts.
* `POST /api/admin/inventory/adjust` - Manual stock adjustment with reason.
* `GET /api/admin/inventory/history` - Inventory transaction history.

### Orders & Customers Management
* `GET /api/admin/orders` - Filtered order fulfillment list.
* `GET /api/admin/orders/:id` - Detailed order and payment metadata.
* `PATCH /api/admin/orders/:id/status` - Transition order fulfillment status.
* `GET /api/admin/customers` - Customer list with lifetime spend.
* `GET /api/admin/customers/:id` - Customer details & order history.
* `PATCH /api/admin/customers/:id/status` - Toggle `ACTIVE`/`SUSPENDED`.

### Security Audit
* `GET /api/admin/audit-logs` - Filterable audit event stream with JSON metadata.
