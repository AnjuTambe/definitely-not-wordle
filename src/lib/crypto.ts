import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// In a real app, this should be in .env.local
const SECRET_KEY = process.env.GAME_SECRET || '12345678901234567890123456789012'; // 32 chars
const IV_LENGTH = 16;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
  const textParts = text.split(':');
  const ivHex = textParts.shift();
  if (!ivHex) throw new Error('Invalid encrypted text');
  
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
