import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getJwtSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-CHANGE-IN-PRODUCTION-NOW'
  );

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function verifyPassword(password: string): Promise<boolean> {
  // Support bcrypt hashed passwords stored in env
  if (ADMIN_PASSWORD.startsWith('$2')) {
    return bcrypt.compare(password, ADMIN_PASSWORD);
  }
  return password === ADMIN_PASSWORD;
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
