const crypto = require('crypto');

const ENCRYPTION_KEY_B64 = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_B64) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_B64, 'base64');
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)');
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