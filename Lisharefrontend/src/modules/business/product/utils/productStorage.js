const SAVED_PRODUCTS_KEY = "lishare-saved-products";
const CART_KEY = "lishare-market-cart";
const COMPARE_KEY = "lishare-compare-products";

function readList(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("lishare-product-storage", { detail: { key } }));
  } catch {
    // Local storage can be unavailable in restricted contexts.
  }
}

function productKey(product) {
  return String(product?.id ?? product?.productId ?? product?.name ?? "");
}

function upsertProduct(list, product, extra = {}) {
  const key = productKey(product);
  if (!key) return list;
  const normalized = { ...product, ...extra, id: product?.id ?? product?.productId ?? key };
  const exists = list.some((item) => productKey(item) === key);
  return exists ? list.map((item) => (productKey(item) === key ? { ...item, ...normalized } : item)) : [normalized, ...list];
}

export function getSavedProducts() {
  return readList(SAVED_PRODUCTS_KEY);
}

export function saveProduct(product, collection = "Wishlist") {
  const next = upsertProduct(getSavedProducts(), product, {
    savedAt: new Date().toISOString(),
    collection
  });
  writeList(SAVED_PRODUCTS_KEY, next);
  return next;
}

export function removeSavedProduct(productId) {
  const next = getSavedProducts().filter((item) => String(item.id ?? item.productId) !== String(productId));
  writeList(SAVED_PRODUCTS_KEY, next);
  return next;
}

export function isProductSaved(productId) {
  return getSavedProducts().some((item) => String(item.id ?? item.productId) === String(productId));
}

export function getCartItems() {
  return readList(CART_KEY);
}

export function addCartItem(product, quantity = 1) {
  const current = getCartItems();
  const key = productKey(product);
  const next = current.some((item) => productKey(item.product) === key)
    ? current.map((item) => (
      productKey(item.product) === key
        ? { ...item, product: { ...item.product, ...product }, quantity: Number(item.quantity || 0) + quantity }
        : item
    ))
    : [{ product, quantity }, ...current];
  writeList(CART_KEY, next);
  return next;
}

export function updateCartItem(productId, quantity) {
  const next = quantity <= 0
    ? getCartItems().filter((item) => String(item.product?.id ?? item.product?.productId) !== String(productId))
    : getCartItems().map((item) => (
      String(item.product?.id ?? item.product?.productId) === String(productId) ? { ...item, quantity } : item
    ));
  writeList(CART_KEY, next);
  return next;
}

export function clearCartItems() {
  writeList(CART_KEY, []);
  return [];
}

export function getCompareProducts() {
  return readList(COMPARE_KEY);
}

export function toggleCompareProduct(product) {
  const current = getCompareProducts();
  const key = productKey(product);
  const exists = current.some((item) => productKey(item) === key);
  const next = exists ? current.filter((item) => productKey(item) !== key) : upsertProduct(current.slice(0, 3), product);
  writeList(COMPARE_KEY, next);
  return next;
}
