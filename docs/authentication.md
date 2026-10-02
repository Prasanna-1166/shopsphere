# 🔐 ShopSphere — Authentication & RBAC Design

## 1. Authentication Architecture

ShopSphere implements a secure, stateless JWT token approach delivered via **HTTP-only Cookies** with optional Authorization Bearer header support for automated testing and client flexibility.

```text
Browser Client                           Express Server                        Neon DB
      |                                        |                                  |
      |--- POST /api/auth/login -------------->|                                  |
      |    { email, password }                 |--- Query User by Email --------->|
      |                                        |<-- Return passwordHash ----------|
      |                                        |                                  |
      |                                        |-- bcrypt.compare(pass, hash)     |
      |                                        |-- signToken({ id, email, role }) |
      |<-- Set-Cookie: shopsphere_token -------|                                  |
      |    (httpOnly, secure in prod)          |                                  |
      |                                        |                                  |
      |--- GET /api/orders/my-orders --------->|                                  |
      |    (Cookie attached automatically)     |-- verifyToken(cookie)            |
      |                                        |-- req.user = decoded             |
      |                                        |--- Query user-scoped orders ---->|
      |<-- Return 200 OK + Data ---------------|<-- Return user records ----------|
```

---

## 2. Role-Based Access Control (RBAC)

ShopSphere enforces three distinct user roles:

| Role | Permissions & Scope | Accessible Applications |
| :--- | :--- | :--- |
| `CUSTOMER` | Storefront catalog browsing, personal cart, wishlist, address CRUD, checkout execution, personal order history and self-cancellation. | Customer Web |
| `ADMIN` | Full catalog management (products & categories), warehouse inventory adjustments, order status workflow processing, customer directory inspection, analytics. | Admin Web |
| `SUPER_ADMIN` | All `ADMIN` capabilities plus sensitive administrative functions and account status overrides. | Admin Web |

### Security Guarantees:
* Public registration (`POST /api/auth/register`) **strictly assigns `CUSTOMER` role** regardless of any payload properties passed by client.
* Store Manager (`ADMIN`) accounts **cannot suspend or modify `ADMIN` or `SUPER_ADMIN` accounts**.
* `ADMIN` users **cannot self-elevate** to `SUPER_ADMIN`.
* Customer credentials cannot authenticate through `/api/auth/admin-login` (returns `403 Forbidden`).
