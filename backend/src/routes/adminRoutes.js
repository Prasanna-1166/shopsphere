const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

const adminDashboardController = require('../controllers/admin/adminDashboardController');
const adminProductController = require('../controllers/admin/adminProductController');
const adminCategoryController = require('../controllers/admin/adminCategoryController');
const adminInventoryController = require('../controllers/admin/adminInventoryController');
const adminOrderController = require('../controllers/admin/adminOrderController');
const adminCustomerController = require('../controllers/admin/adminCustomerController');
const adminAnalyticsController = require('../controllers/admin/adminAnalyticsController');
const adminAuditController = require('../controllers/admin/adminAuditController');

// All admin routes strictly require authentication and ADMIN/SUPER_ADMIN role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard/metrics', adminDashboardController.getDashboardMetrics);

// Product Management
router.get('/products', adminProductController.getAdminProducts);
router.post('/products', adminProductController.createProduct);
router.put('/products/:id', adminProductController.updateProduct);
router.patch('/products/:id/toggle', adminProductController.toggleProductActive);
router.post('/products/bulk-toggle', adminProductController.bulkToggleProductActive);
router.delete('/products/:id', adminProductController.deleteProduct);
router.get('/products/export/csv', adminProductController.exportProductsCSV);
router.post('/products/import/csv', adminProductController.importProductsCSV);

// Category Management
router.get('/categories', adminCategoryController.getAdminCategories);
router.post('/categories', adminCategoryController.createCategory);
router.put('/categories/:id', adminCategoryController.updateCategory);
router.patch('/categories/:id/toggle', adminCategoryController.toggleCategoryActive);
router.delete('/categories/:id', adminCategoryController.deleteCategory);

// Inventory Management
router.get('/inventory', adminInventoryController.getInventory);
router.post('/inventory/adjust', adminInventoryController.adjustStock);
router.get('/inventory/history', adminInventoryController.getInventoryHistory);

// Order Management
router.get('/orders', adminOrderController.getAdminOrders);
router.get('/orders/:id', adminOrderController.getAdminOrderDetails);
router.patch('/orders/:id/status', adminOrderController.updateOrderStatus);

// Customer Management
router.get('/customers', adminCustomerController.getAdminCustomers);
router.get('/customers/:id', adminCustomerController.getAdminCustomerDetails);
router.patch('/customers/:id/status', adminCustomerController.toggleCustomerStatus);

// Analytics
router.get('/analytics', adminAnalyticsController.getAnalytics);

// Audit Logs
router.get('/audit-logs', adminAuditController.getAuditLogs);

module.exports = router;
