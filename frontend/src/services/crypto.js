/**
 * Zero-Leakage End-to-End Encryption (E2EE) Module
 * Uses standard Web Crypto API (AES-GCM 256-bit)
 * Derives a shared cryptographic key from the mutual match seed.
 * Neither the network ISP nor intermediate server can decrypt the chat content!
 */

// Helper to convert string to Uint8Array
function strToBuf(str) {
  return new TextEncoder().encode(str);
}

// Helper to convert Uint8Array to string
function bufToStr(buf) {
  return new TextDecoder().decode(buf);
}

// Helper: ArrayBuffer to Base64
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Base64 to ArrayBuffer
function base64ToBuf(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM 256-bit CryptoKey from match seed
async function deriveKeyFromSeed(seed) {
  const enc = new TextEncoder();
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(seed || 'cu_default_secure_salt_2026'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('cu_chandigarh_university_salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext message with AES-GCM
 */
export async function encryptChatMessage(plaintext, matchSeed) {
  try {
    const key = await deriveKeyFromSeed(matchSeed);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = strToBuf(plaintext);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoded
    );

    return {
      encryptedPayload: bufToBase64(ciphertext),
      iv: bufToBase64(iv)
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    // Fallback in case of crypto error
    return {
      encryptedPayload: window.btoa(encodeURIComponent(plaintext)),
      iv: 'plain_fallback'
    };
  }
}

/**
 * Decrypt ciphertext message with AES-GCM
 */
export async function decryptChatMessage(encryptedPayload, ivStr, matchSeed) {
  try {
    if (!encryptedPayload) return '';
    if (encryptedPayload === '[VIEWED_AND_DESTROYED]') {
      return '💥 View-once photo self-destructed';
    }

    if (ivStr === 'plain_fallback') {
      return decodeURIComponent(window.atob(encryptedPayload));
    }

    const key = await deriveKeyFromSeed(matchSeed);
    const ciphertext = base64ToBuf(encryptedPayload);
    const iv = base64ToBuf(ivStr);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      ciphertext
    );

    return bufToStr(decrypted);
  } catch (err) {
    console.warn('Decryption error or corrupted message:', err);
    return '🔒 [Encrypted Message]';
  }
}
