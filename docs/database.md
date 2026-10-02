# 🗄️ ShopSphere — Database & Schema Architecture

ShopSphere utilizes **PostgreSQL hosted on Neon** managed via **Prisma ORM**.

---

## 1. Relational Entity Relationship Diagram

```text
  +------------------+         1:N         +------------------+
  |      User        |-------------------->|     Address      |
  +------------------+                     +------------------+
       |        |
    1:1|        | 1:N
       v        v
  +--------+ +------------------+          +------------------+
  |  Cart  | |      Order       |--------->|     Payment      |
  +--------+ +------------------+   1:N    +------------------+
       | 1:N          | 1:N
       v              v
  +----------+   +--------------+
  | CartItem |   |  OrderItem   |
  +----------+   +--------------+
       |               |
       v               v
  +-----------------------------+
  |           Product           |<---------+ Category (1:N)
  +-----------------------------+
       |               |
    1:N|            1:N|
       v               v
  +--------------+ +------------------------+
  | ProductImage | |  InventoryTransaction  |
  +--------------+ +------------------------+
```

---

## 2. Model Specifications

### 2.1 User (`users`)
* `id` (String / CUID / Primary Key)
* `name` (String)
* `email` (String / Unique / Indexed)
* `passwordHash` (String - bcrypt encrypted)
* `role` (Enum: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` / Indexed)
* `status` (Enum: `ACTIVE`, `SUSPENDED`, `INACTIVE` / Indexed)
* `createdAt` / `updatedAt` (DateTime)

### 2.2 Category (`categories`)
* `id` (String / CUID / Primary Key)
* `name` (String / Unique)
* `slug` (String / Unique / Indexed)
* `description` (String, Optional)
* `image` (String, Optional)
* `active` (Boolean / Indexed / Default: true)

### 2.3 Product (`products`)
* `id` (String / CUID / Primary Key)
* `name` (String)
* `slug` (String / Unique / Indexed)
* `description` (String)
* `sku` (String / Unique / Indexed)
* `price` (Float / Indexed)
* `discountPrice` (Float, Optional)
* `stockQuantity` (Int / Default: 0)
* `active` (Boolean / Indexed / Default: true)
* `categoryId` (Foreign Key -> Category)

### 2.4 Order (`orders`)
* `id` (String / CUID / Primary Key)
* `userId` (Foreign Key -> User / Indexed)
* `subtotal` (Float)
* `discount` (Float)
* `shippingAmount` (Float)
* `totalAmount` (Float)
* `status` (Enum: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` / Indexed)
* `paymentStatus` (Enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED` / Indexed)
* `shippingAddress` (JSON snapshot preserving name, phone, address, city, state, postal code)
* `createdAt` (DateTime / Indexed)

### 2.5 OrderItem (`order_items`)
* `id` (String / CUID / Primary Key)
* `orderId` (Foreign Key -> Order)
* `productId` (Foreign Key -> Product)
* `productName` (String snapshot at purchase time)
* `sku` (String snapshot at purchase time)
* `unitPrice` (Float snapshot at purchase time)
* `quantity` (Int)
* `subtotal` (Float)

### 2.6 InventoryTransaction (`inventory_transactions`)
* `id` (String / CUID / Primary Key)
* `productId` (Foreign Key -> Product / Indexed)
* `quantityChange` (Int)
* `previousQuantity` (Int)
* `newQuantity` (Int)
* `type` (Enum: `RESTOCK`, `SALE`, `CANCELLATION_RESTORE`, `MANUAL_ADJUSTMENT`, `RETURN` / Indexed)
* `reason` (String)
* `performedBy` (String -> User ID / Optional)
* `createdAt` (DateTime / Indexed)

### 2.7 AuditLog (`audit_logs`)
* `id` (String / CUID / Primary Key)
* `userId` (String -> User ID / Optional / Indexed)
* `action` (String / Indexed)
* `entity` (String / Indexed)
* `entityId` (String / Optional)
* `metadata` (JSON)
* `createdAt` (DateTime / Indexed)

---

## 3. Database Indexes Strategy

Indexes are explicitly applied to fields utilized in high-frequency queries:
- **Authentication**: `users(email)`, `users(role)`, `users(status)`.
- **Storefront Catalog**: `products(slug)`, `products(sku)`, `products(categoryId)`, `products(active)`, `products(price)`.
- **Order Queries**: `orders(userId)`, `orders(status)`, `orders(createdAt)`.
- **Auditing & Transactions**: `inventory_transactions(productId)`, `audit_logs(entity)`, `audit_logs(action)`.
