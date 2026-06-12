const CART_STORAGE_KEY = 'authapp-cart';

function readCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch {
    return [];
  }
}

function writeCart(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  window.dispatchEvent(new Event('authapp-cart-updated'));
}

export function getCartItems() {
  return readCart();
}

export function addToCart(product, quantity = 1) {
  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item._id === product._id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cartItems.push({ ...product, quantity });
  }

  writeCart(cartItems);
}

export function updateCartQuantity(productId, quantity) {
  const cartItems = readCart()
    .map((item) => (item._id === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  writeCart(cartItems);
}

export function removeFromCart(productId) {
  const cartItems = readCart().filter((item) => item._id !== productId);
  writeCart(cartItems);
}

export function clearCart() {
  writeCart([]);
}