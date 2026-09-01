import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';

const PUBLIC_SETTING_KEYS = [
  'company_name',
  'company_tagline',
  'company_phone',
  'company_email',
  'company_address',
  'social_facebook',
  'social_twitter',
  'social_linkedin',
  'social_youtube',
  'footer_text',
  'seo_default_title',
  'seo_default_description',
  'homepage_hero_title',
  'homepage_hero_subtitle',
  'home_hero_media_url',
  'home_hero_media_type',
  'home_hero_overlay',
  'home_announcement_enabled',
  'home_announcement_text',
  'home_announcement_link',
  'home_announcement_label',
  'site_font',
];

const RECOVERY_DEFAULTS: Record<string, string> = {
  home_hero_media_url: '',
  home_hero_media_type: 'image',
  home_hero_overlay: '70',
  home_announcement_enabled: 'false',
  home_announcement_label: 'New',
  home_announcement_text: '',
  home_announcement_link: '',
  site_font: 'Inter',
};

function parseSettingValue(value: string | null, type: string): unknown {
  if (value === null) return null;
  if (type === 'json') {
    try { return JSON.parse(value); } catch { return value; }
  }
  if (type === 'boolean') return value === 'true';
  if (type === 'number') return parseFloat(value);
  return value;
}

// GET /api/settings/public
export async function getPublicSettings(_req: Request, res: Response): Promise<void> {
  const settings = await prisma.websiteSetting.findMany({
    where: { key: { in: PUBLIC_SETTING_KEYS } },
  });

  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = parseSettingValue(s.value ?? null, s.type);
  }

  res.status(200).json(successResponse(result));
}

// GET /api/admin/settings
export async function getAllSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const settings = await prisma.websiteSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });

  // Group by category
  const grouped: Record<string, typeof settings> = {};
  for (const s of settings) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  res.status(200).json(successResponse(grouped));
}

// PUT /api/admin/settings (bulk update)
export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const updates = req.body as Record<string, string | null>;

  const operations = Object.entries(updates).map(([key, value]) =>
    prisma.websiteSetting.upsert({
      where: { key },
      update: { value: value !== null ? String(value) : null },
      create: { key, value: value !== null ? String(value) : null },
    }),
  );

  await Promise.all(operations);

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_SETTINGS',
    resource: 'settings',
    metadata: { keys: Object.keys(updates) },
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Settings updated'));
}

// PUT /api/admin/settings/:key
export async function updateSetting(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { key } = req.params;
  const { value, type, label, description, category } = req.body as {
    value?: string | null;
    type?: string;
    label?: string;
    description?: string;
    category?: string;
  };

  const setting = await prisma.websiteSetting.upsert({
    where: { key },
    update: {
      value: value !== undefined ? (value !== null ? String(value) : null) : undefined,
      type,
      label,
      description,
      category,
    },
    create: {
      key,
      value: value !== null && value !== undefined ? String(value) : null,
      type: type ?? 'string',
      label,
      description,
      category: category ?? 'general',
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_SETTING',
    resource: 'settings',
    resourceId: key,
    metadata: { key, value },
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(setting, 'Setting updated'));
}

// POST /api/admin/settings/restore-defaults
// A safe recovery point for site presentation only; operational CMS records are retained.
export async function restorePresentationDefaults(req: AuthenticatedRequest, res: Response): Promise<void> {
  await Promise.all(Object.entries(RECOVERY_DEFAULTS).map(([key, value]) => prisma.websiteSetting.upsert({
    where: { key },
    update: { value, type: 'string', category: 'experience' },
    create: { key, value, type: 'string', category: 'experience', label: key.replace(/_/g, ' ') },
  })));
  await createAuditLog({ userId: req.user!.id, action: 'RESTORE_PRESENTATION_DEFAULTS', resource: 'settings', metadata: { keys: Object.keys(RECOVERY_DEFAULTS) }, ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip, userAgent: req.headers['user-agent'] });
  res.status(200).json(successResponse(null, 'Homepage and visual defaults restored. Content, accounts and orders were not changed.'));
}
