import crypto from 'crypto';

const printTokens = new Map();

const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

export function generatePrintToken(shop, orderId) {
  const token = crypto.randomBytes(32).toString('hex');
  
  printTokens.set(token, {
    shop,
    orderId,
    createdAt: Date.now(),
    used: false
  });

  setTimeout(() => {
    printTokens.delete(token);
  }, TOKEN_EXPIRY_MS);

  return token;
}

export function validatePrintToken(token) {
  const data = printTokens.get(token);
  
  if (!data) {
    return null;
  }

  if (data.used) {
    return null;
  }

  if (Date.now() - data.createdAt > TOKEN_EXPIRY_MS) {
    printTokens.delete(token);
    return null;
  }

  data.used = true;

  return {
    shop: data.shop,
    orderId: data.orderId
  };
}

export function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of printTokens.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRY_MS) {
      printTokens.delete(token);
    }
  }
}

setInterval(cleanupExpiredTokens, 60 * 1000);
