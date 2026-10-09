/**
 * ShopSphere Generic Product Fallback Utility (Admin Web)
 * Provides a neutral, category-agnostic SVG placeholder for missing or failing product images.
 */

export const GENERIC_PRODUCT_FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%230F172A"/><rect x="40" y="40" width="320" height="320" rx="16" fill="%231E293B" stroke="%23334155" stroke-width="2"/><path d="M200 130L260 165V235L200 270L140 235V165L200 130Z" stroke="%2394A3B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="%230F172A"/><path d="M200 130V270M200 200L260 165M200 200L140 165" stroke="%2394A3B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="%2394A3B8" text-anchor="middle">ShopSphere Product</text></svg>`;

export const handleImageError = (e) => {
  if (e && e.target && e.target.src !== GENERIC_PRODUCT_FALLBACK_IMAGE) {
    e.target.src = GENERIC_PRODUCT_FALLBACK_IMAGE;
  }
};

export const getProductImageUrl = (product) => {
  if (!product) return GENERIC_PRODUCT_FALLBACK_IMAGE;
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]?.url) {
    return product.images[0].url;
  }
  if (typeof product.image === 'string' && product.image.trim()) {
    return product.image;
  }
  return GENERIC_PRODUCT_FALLBACK_IMAGE;
};
