const crypto = require('crypto');

let ENCRYPTION_KEY;
if (process.env.ENCRYPTION_KEY) {
  try {
    const buf = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
    ENCRYPTION_KEY = buf.length === 32 ? buf : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
  } catch {
    ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
  }
} else if (process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET) {
  ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET).digest();
} else {
  ENCRYPTION_KEY = crypto.createHash('sha256').update('unidrive_default_encryption_fallback_key_2026').digest();
}


const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return '';
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
}

function decrypt(ciphertextB64) {
  if (!ciphertextB64) {
    return '';
  }
  const data = Buffer.from(ciphertextB64, 'base64');
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid ciphertext');
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };