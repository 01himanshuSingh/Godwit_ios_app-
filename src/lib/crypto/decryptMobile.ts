/**
 * CRM mobile field — CryptoJS AES (OpenSSL salted, "U2FsdGVkX1…" prefix).
 * Plain values pass through unchanged.
 */
import CryptoJS from 'crypto-js';

export function decryptMobile(cipherText: string, key: string): string {
  if (!cipherText) return '';
  if (!key) return cipherText;
  if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    return plain || cipherText;
  } catch {
    return cipherText;
  }
}
