import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

// Controllers
import {
  adminListProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  toggleProductPublish,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../controllers/products.controller.js';
import {
  adminListServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller.js';
import {
  adminListArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
} from '../controllers/news.controller.js';
import {
  adminListJobs,
  createJob,
  updateJob,
  deleteJob,
  listApplications,
  getApplication,
  updateApplicationStatus,
} from '../controllers/jobs.controller.js';
import {
  listContactMessages,
  getContactMessage,
  updateContactStatus,
} from '../controllers/contact.controller.js';
import {
  adminListLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locations.controller.js';
import {
  uploadMedia,
  listMedia,
  updateMedia,
  deleteMedia,
} from '../controllers/media.controller.js';
import {
  adminListFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faqs.controller.js';
import {
  adminListPages,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/pages.controller.js';
import {
  getAllSettings,
  updateSettings,
  updateSetting,
  restorePresentationDefaults,
} from '../controllers/settings.controller.js';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
  adminSetPassword,
  deleteUser,
} from '../controllers/users.controller.js';

// Validation schemas
import {
  createProductSchema,
  updateProductSchema,
  createProductCategorySchema,
  updateProductCategorySchema,
  publishProductSchema,
} from '../validation/product.schemas.js';
import { createNewsArticleSchema, updateNewsArticleSchema } from '../validation/news.schemas.js';
import { createJobSchema, updateJobSchema, updateApplicationStatusSchema } from '../validation/job.schemas.js';
import { updateContactStatusSchema } from '../validation/contact.schemas.js';
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateUserRoleSchema, adminSetPasswordSchema } from '../validation/user.schemas.js';
import { adminListOrders, adminUpdateOrder } from '../controllers/orders.controller.js';
import { updateOrderSchema } from '../validation/order.schemas.js';

const router: Router = Router();

// ==================== Multer config ====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ==================== Apply requireAuth to ALL admin routes ====================
router.use(requireAuth);

// ==================== Dashboard ====================
router.get('/dashboard', requireRole('ADMIN', 'SUPER_ADMIN'), getDashboard);
router.get('/orders', requireRole('ADMIN', 'SUPER_ADMIN'), adminListOrders);
router.put('/orders/:id', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateOrderSchema), adminUpdateOrder);

// ==================== Users ====================
router.get('/users', requireRole('ADMIN', 'SUPER_ADMIN'), listUsers);
router.post('/users', requireRole('ADMIN', 'SUPER_ADMIN'), validate(createUserSchema), createUser);
router.get('/users/:id', requireRole('ADMIN', 'SUPER_ADMIN'), getUserById);
router.put('/users/:id', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateUserSchema), updateUser);
router.put('/users/:id/status', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateUserStatusSchema), updateUserStatus);
router.put('/users/:id/role', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateUserRoleSchema), updateUserRole);
router.post('/users/:id/reset-password', requireRole('ADMIN', 'SUPER_ADMIN'), adminResetPassword);
router.put('/users/:id/password', requireRole('ADMIN', 'SUPER_ADMIN'), validate(adminSetPasswordSchema), adminSetPassword);
router.delete('/users/:id', requireRole('SUPER_ADMIN'), deleteUser);

// ==================== Products ====================
router.get('/products', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListProducts);
router.post('/products', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), validate(createProductSchema), createProduct);
router.put('/products/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), validate(updateProductSchema), updateProduct);
router.delete('/products/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), archiveProduct);
router.put('/products/:id/publish', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), validate(publishProductSchema), toggleProductPublish);

// Product Categories
router.post('/product-categories', requireRole('ADMIN', 'SUPER_ADMIN'), validate(createProductCategorySchema), createProductCategory);
router.put('/product-categories/:id', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateProductCategorySchema), updateProductCategory);
router.delete('/product-categories/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteProductCategory);

// ==================== Services ====================
router.get('/services', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListServices);
router.post('/services', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), createService);
router.put('/services/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updateService);
router.delete('/services/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), deleteService);

// ==================== News ====================
router.get('/news', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListArticles);
router.post('/news', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), validate(createNewsArticleSchema), createArticle);
router.put('/news/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), validate(updateNewsArticleSchema), updateArticle);
router.delete('/news/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), deleteArticle);

// News Categories
router.post('/news-categories', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), createNewsCategory);
router.put('/news-categories/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updateNewsCategory);
router.delete('/news-categories/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteNewsCategory);

// ==================== Jobs ====================
router.get('/jobs', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), adminListJobs);
router.post('/jobs', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), validate(createJobSchema), createJob);
router.put('/jobs/:id', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), validate(updateJobSchema), updateJob);
router.delete('/jobs/:id', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), deleteJob);

// Applications
router.get('/applications', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), listApplications);
router.get('/applications/:id', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), getApplication);
router.put('/applications/:id/status', requireRole('HR', 'ADMIN', 'SUPER_ADMIN'), validate(updateApplicationStatusSchema), updateApplicationStatus);

// ==================== Contact ====================
router.get('/contact', requireRole('ADMIN', 'SUPER_ADMIN'), listContactMessages);
router.get('/contact/:id', requireRole('ADMIN', 'SUPER_ADMIN'), getContactMessage);
router.put('/contact/:id/status', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateContactStatusSchema), updateContactStatus);

// ==================== Locations ====================
router.get('/locations', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListLocations);
router.post('/locations', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), createLocation);
router.put('/locations/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updateLocation);
router.delete('/locations/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteLocation);

// ==================== Media ====================
router.post('/media/upload', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'HR'), uploadLimiter, upload.single('file'), uploadMedia);
router.get('/media', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'HR'), listMedia);
router.put('/media/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updateMedia);
router.delete('/media/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), deleteMedia);

// ==================== FAQs ====================
router.get('/faqs', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListFaqs);
router.post('/faqs', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), createFaq);
router.put('/faqs/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updateFaq);
router.delete('/faqs/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), deleteFaq);

// ==================== Pages ====================
router.get('/pages', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), adminListPages);
router.post('/pages', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), createPage);
router.put('/pages/:id', requireRole('EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'), updatePage);
router.delete('/pages/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deletePage);

// ==================== Settings ====================
router.get('/settings', requireRole('ADMIN', 'SUPER_ADMIN'), getAllSettings);
router.put('/settings', requireRole('ADMIN', 'SUPER_ADMIN'), updateSettings);
router.post('/settings/restore-defaults', requireRole('ADMIN', 'SUPER_ADMIN'), restorePresentationDefaults);
router.put('/settings/:key', requireRole('ADMIN', 'SUPER_ADMIN'), updateSetting);

// ==================== Audit Logs ====================
router.get('/audit-logs', requireRole('ADMIN', 'SUPER_ADMIN'), listAuditLogs);

export default router;
