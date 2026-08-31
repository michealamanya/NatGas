import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  registerCustomer,
} from '../controllers/auth.controller.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  customerRegisterSchema,
} from '../validation/auth.schemas.js';

const router: Router = Router();

// POST /api/auth/login - rate limited
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/register', authLimiter, validate(customerRegisterSchema), registerCustomer);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me - requires auth
router.get('/me', requireAuth, getMe);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// PUT /api/auth/change-password - requires auth
router.put('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
