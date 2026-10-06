import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '@university-lms/shared';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}