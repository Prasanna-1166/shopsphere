# 🛡️ ShopSphere — Security & Protection Mechanisms

Security is a foundational pillar of ShopSphere. The application enforces defense-in-depth across multiple layers:

---

## 1. Security Architecture Summary

```text
[ Incoming Request ]
        │
        ▼
[ 1. Helmet HTTP Security Headers ] ──> Content-Security-Policy, HSTS, X-Frame-Options
        │
        ▼
[ 2. Strict CORS Filter ] ────────────> Restricts requests to configured Customer & Admin origins
        │
        ▼
[ 3. Express Rate Limiter ] ──────────> Guards against brute-force (Auth: 20 req / 15 min, Checkout: 30 req / 15 min)
        │
        ▼
[ 4. Double-Submit CSRF Guard ] ──────> Validates x-csrf-token header against shopsphere_csrf cookie
        │
        ▼
[ 5. JWT Auth & httpOnly Cookie ] ────> Extracts & verifies cryptographic JWT signature
        │
        ▼
[ 6. RBAC Middleware ] ───────────────> Verifies required role (CUSTOMER, ADMIN, SUPER_ADMIN)
        │
        ▼
[ 7. IDOR Resource Ownership Guard ] ─> Verifies resource.userId === req.user.id
        │
        ▼
[ 8. Parameterized Prisma Queries ] ──> Immunizes application against SQL Injection
```

---

## 2. Insecure Direct Object Reference (IDOR) Protection

In ShopSphere, changing an ID in the URL parameter (e.g. `/api/orders/:id`, `/api/cart/items/:id`, `/api/addresses/:id`) can never grant access to another customer's data.

Every controller strictly checks:
```javascript
if (resource.userId !== req.user.id) {
  return sendError(res, 'Resource not found.', [], 404);
}
```
*Returning a 404 rather than 403 prevents attackers from confirming whether a foreign ID exists.*

---

## 3. Privilege Escalation Defenses

* **Public Registration Defense**: `POST /api/auth/register` hardcodes `role: 'CUSTOMER'`. Any `role` parameter sent in the body payload is completely ignored.
* **Admin Elevation Defense**: Ordinary `ADMIN` users cannot modify or elevate accounts to `SUPER_ADMIN`.
* **Administrative Login Isolation**: Customer credentials cannot authenticate through `/api/auth/admin-login`.

---

## 4. Payment Security & Data Privacy

* **Zero Card Storage**: ShopSphere never stores, processes, or retains credit card numbers, CVVs, or bank secrets.
* **Abstracted Payments**: Payments interact solely with abstract transaction tokens.
* **Audit Logging**: Sensitive administrative actions (stock adjustment, catalog change, status overrides) record an immutable `AuditLog` row without ever logging credentials or tokens.
