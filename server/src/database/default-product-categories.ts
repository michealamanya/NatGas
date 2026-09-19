import { prisma } from './client.js';
import { createSlug } from '../utils/slug.js';

/**
 * Baseline catalogue structure for a fresh NATGAS installation.
 * Products are intentionally not created here: staff enter real stock, pricing
 * and images in Admin. Existing category records are never overwritten.
 */
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Angle Valve',
  'Auto Shutoff Valve',
  'Ball Valves',
  'Cables',
  'Carbon Steel Pipes',
  'Check Valve',
  'Copper Pipes',
  'Detection System & Alarm',
  'Discounted Items',
  'Electrical Heater',
  'Excess Flow Valve',
  'Fire Fighting & Fire Alarm',
  'Fittings & Clamps',
  'Gas Filters',
  'Gas Hoses',
  'Gas Meters & Flow Meters',
  'Gate Valve',
  'Gauges',
  'Globe Valves',
  'Hand Tools & Equipment',
  'HDPE PIPE',
  'LPG Cylinders',
  'LPG Tanks & Accessories',
  'LPG Vaporizers',
  'Manifolds & Change Over',
  'Multi Valve',
  'Paints & Sealant',
  'Power Tools & Accessories',
  'Pressure Switches',
  'Quick Close Valve',
  'Regulators',
  'Safety Equipment',
  'Safety Relief Valve',
  'Solenoid Valve',
  'Sprays & Testers',
  'Switches, Accessories, & Others',
  'Vapor Equalizing Valve',
  'Water Filters',
  'Welding Consumables & Accessories',
] as const;

export async function ensureDefaultProductCategories(): Promise<void> {
  await Promise.all(
    DEFAULT_PRODUCT_CATEGORIES.map((name, index) =>
      prisma.productCategory.upsert({
        where: { slug: createSlug(name) },
        update: {},
        create: { name, slug: createSlug(name), displayOrder: index + 1, isActive: true },
      }),
    ),
  );
}
