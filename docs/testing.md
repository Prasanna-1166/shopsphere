# 🧪 ShopSphere — Automated Testing Strategy

ShopSphere includes an automated integration and unit test suite built with **Jest** and **Supertest**.

---

## 1. Test Suite Structure

```text
backend/tests/
├── setup.js          # Test environment configuration
├── auth.test.js      # Registration, login, invalid login, RBAC enforcement
├── products.test.js  # Catalog listing, keyword search, price & category filtering, slug lookup
├── cart.test.js      # Authoritative calculations, stock limits, duplicate handling, item CRUD
├── orders.test.js    # Atomic checkout, inventory deduction, IDOR protection, cancellation restore
└── admin.test.js     # Administrative RBAC, product CRUD, warehouse inventory audit adjustments
```

---

## 2. Running Automated Tests

Run the complete test suite from the root directory:

```bash
npm test
```

Or from the `backend/` directory:

```bash
npm --prefix backend test
```

---

## 3. Test Coverage Highlights

* **Authentication**: Verifies JWT issuance, password hashing with bcrypt, rejection of duplicate emails, rejection of invalid credentials, and role isolation.
* **Shopping Bag & Prices**: Verifies server recalculation, rejection of requests requesting more than warehouse stock, and unique composite item handling.
* **Transactions & Orders**: Verifies atomic execution of `prisma.$transaction`, accurate inventory reduction, rollback resilience, and inventory restoration upon cancellation.
* **IDOR Protection**: Verifies that User B cannot access User A's order by altering the URL ID.
* **Administrative RBAC**: Verifies that requests by ordinary `CUSTOMER` accounts to `/api/admin/*` are rejected with `403 Forbidden`.
