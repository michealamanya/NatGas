import { Product } from '../api/client';
export type CartItem = Pick<Product, 'id' | 'name' | 'slug' | 'imageUrl' | 'cylinderSize'> & { quantity: number };
const KEY = 'natgas_order_cart';
export function getCart(): CartItem[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
function announceCartChange() { window.dispatchEvent(new Event('natgas-cart-change')); }
export function addToCart(product: Product) { const cart = getCart(); const found = cart.find(item => item.id === product.id); if (found) found.quantity += 1; else cart.push({ id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, cylinderSize: product.cylinderSize, quantity: 1 }); localStorage.setItem(KEY, JSON.stringify(cart)); announceCartChange(); }
export function saveCart(cart: CartItem[]) { localStorage.setItem(KEY, JSON.stringify(cart)); announceCartChange(); }
