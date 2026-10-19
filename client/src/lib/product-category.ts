import type { ProductCategory } from '../api/client';

type CategorySource = Pick<ProductCategory, 'name' | 'slug' | 'description'> | undefined;

export function isLpgRefillProduct(product: { name?: string; cylinderSize?: string; category?: CategorySource }): boolean {
  const key = `${product.name ?? ''} ${product.cylinderSize ?? ''} ${product.category?.slug ?? ''} ${product.category?.name ?? ''}`.toLowerCase();
  return Boolean(product.cylinderSize) && /(cylinder|lpg)/.test(key) && !/(tank|accessor|equipment)/.test(key);
}

export function refillDisplayName(product: { name: string; cylinderSize?: string; category?: CategorySource }): string {
  if (!isLpgRefillProduct(product)) return product.name;
  const size = product.cylinderSize ?? product.name.match(/\d+(?:\.\d+)?\s*kg/i)?.[0];
  return size ? `${size.replace(/\s+/g, '')} LPG Refill` : product.name;
}

export function refillCategoryLabel(product: { name?: string; cylinderSize?: string; category?: CategorySource }): string {
  return isLpgRefillProduct(product) ? 'TotalEnergies LPG Refills' : (product.category?.name ?? 'NATGAS EQUIPMENT');
}

export type CategoryPresentation = { title: string; description: string; detailLabel: string; detailPlaceholder: string; specificationHint: string };

export function getCategoryPresentation(category: CategorySource): CategoryPresentation {
  const name = category?.name ?? 'Engineering equipment';
  const key = `${category?.slug ?? ''} ${name}`.toLowerCase();
  const customDescription = category?.description?.trim();
  if (key.includes('cylinder')) return { title: 'LPG Cylinders', description: customDescription || 'Certified domestic, commercial and industrial LPG cylinders with dependable support.', detailLabel: 'Cylinder capacity / size', detailPlaceholder: 'e.g. 6kg, 12.5kg or 38kg', specificationHint: 'e.g. Capacity: 12.5 kg' };
  if (/(pipe|hose|cable)/.test(key)) return { title: name, description: customDescription || 'Reliable piping, hoses and cabling for safe gas, utility and industrial installations.', detailLabel: 'Size / length / specification', detailPlaceholder: 'e.g. 25 mm, 1/2 in, 100 m or schedule', specificationHint: 'e.g. Material: Copper; Length: 100 m' };
  if (/(valve|regulator|filter|gauge|meter|switch|manifold)/.test(key)) return { title: name, description: customDescription || 'Precision control and monitoring components for reliable LPG and industrial systems.', detailLabel: 'Size / connection / model', detailPlaceholder: 'e.g. 1/2 in BSP, DN25 or model number', specificationHint: 'e.g. Connection: 1/2 in BSP; Pressure rating: PN16' };
  return { title: name, description: customDescription || `Professional ${name.toLowerCase()} for LPG engineering, maintenance and industrial projects.`, detailLabel: 'Size / model / specification', detailPlaceholder: 'e.g. model number, dimensions or capacity', specificationHint: 'e.g. Material: Brass; Operating range: 0–16 bar' };
}
