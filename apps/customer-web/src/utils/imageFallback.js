/**
 * ShopSphere Generic Product Fallback Utility
 * Provides a neutral, category-agnostic SVG placeholder for missing or failing product images.
 */

export const GENERIC_PRODUCT_FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23F1F5F9"/><rect x="40" y="40" width="320" height="320" rx="16" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><path d="M200 130L260 165V235L200 270L140 235V165L200 130Z" stroke="%2364748B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="%23F8FAFC"/><path d="M200 130V270M200 200L260 165M200 200L140 165" stroke="%2364748B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="%2364748B" text-anchor="middle">ShopSphere Product</text></svg>`;

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
