import { Router } from 'express';
import { contactLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

// Controllers
import {
  listPublishedProducts,
  getProductBySlug,
  getPublicProductCategories,
} from '../controllers/products.controller.js';
import {
  listPublishedServices,
  getServiceBySlug,
} from '../controllers/services.controller.js';
import {
  listPublishedArticles,
  getArticleBySlug,
  getNewsCategories,
} from '../controllers/news.controller.js';
import {
  listPublishedJobs,
  getJobBySlug,
  applyForJob,
} from '../controllers/jobs.controller.js';
import { submitContact } from '../controllers/contact.controller.js';
import { listLocations } from '../controllers/locations.controller.js';
import { listFaqs } from '../controllers/faqs.controller.js';
import { getPageBySlug } from '../controllers/pages.controller.js';
import { getPublicSettings } from '../controllers/settings.controller.js';
import { createOrder, listMyOrders } from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createOrderSchema } from '../validation/order.schemas.js';

// Validation schemas
import { contactFormSchema } from '../validation/contact.schemas.js';
import { jobApplicationSchema } from '../validation/job.schemas.js';

const router: Router = Router();

// ==================== Products ====================
router.get('/products', listPublishedProducts);
router.get('/products/categories', getPublicProductCategories);
router.get('/products/:slug', getProductBySlug);

// ==================== Customer orders ====================
router.post('/orders', requireAuth, validate(createOrderSchema), createOrder);
router.get('/orders/mine', requireAuth, listMyOrders);

// ==================== Services ====================
router.get('/services', listPublishedServices);
router.get('/services/:slug', getServiceBySlug);

// ==================== News ====================
router.get('/news', listPublishedArticles);
router.get('/news/categories', getNewsCategories);
router.get('/news/:slug', getArticleBySlug);

// ==================== Jobs ====================
router.get('/jobs', listPublishedJobs);
router.get('/jobs/:slug', getJobBySlug);
router.post('/jobs/:id/apply', validate(jobApplicationSchema), applyForJob);

// ==================== Contact ====================
router.post('/contact', contactLimiter, validate(contactFormSchema), submitContact);

// ==================== Locations ====================
router.get('/locations', listLocations);

// ==================== FAQs ====================
router.get('/faqs', listFaqs);

// ==================== Pages ====================
router.get('/pages/:slug', getPageBySlug);

// ==================== Settings (public) ====================
router.get('/settings/public', getPublicSettings);

export default router;
